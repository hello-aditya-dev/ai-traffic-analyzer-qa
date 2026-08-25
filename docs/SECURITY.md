# Security

This document is the security checklist for **AI Traffic Analyzer**. It is written for operators deploying the product and for developers customizing it. The product is self-hosted and source-code-first; the buyer is responsible for the security posture of their deployment and for the legal basis of any video they process.

---

## 1. Security Posture Summary

| Property | Status in V1 |
| --- | --- |
| Self-hosted (no phone-home) | Yes — the product does not call the creator's servers |
| API key handling | Server-side only; masked in UI; never logged |
| Database | Local SQLite by default; PostgreSQL optional |
| File storage | Local filesystem; configurable paths |
| Authentication / authorization | Not included in V1 (single-user, internal deployment assumed) |
| TLS | Provided by your reverse proxy (Caddy/Nginx/Traefik) |
| Facial recognition / biometrics | **Not implemented** and **not licensed as a capability** |
| Telemetry | None |

V1 does **not** ship authentication, multi-tenancy, or SSO. It assumes a trusted internal network or a deployment protected by a reverse proxy with access control. If you expose V1 directly to the internet, you must add your own authentication layer first.

---

## 2. Secrets and API Keys

| Rule | Implementation |
| --- | --- |
| Never hard-code API keys in source | Keys live in `.env` or the `ProviderConfig` DB row |
| Never commit `.env` | `.gitignore` excludes `.env`, `.env.*` except `.env.example` |
| Never expose API keys to the browser | The provider-config API returns only a masked preview (`sk-…ab12`); the full key is read server-side |
| Never log API keys | A redaction layer strips `AI_API_KEY`, `apiKey`, and the `Authorization` header from logs |
| Never send keys over plain HTTP | The `generic-http` adapter refuses to send `AI_API_KEY` over `http://` unless `ALLOW_INSECURE_PROVIDER_HTTP=true` (dev only) |
| Store keys in env, not DB, where possible | For higher-security deployments, set `AI_API_KEY` in `.env` and leave the DB field empty |

### Operator checklist

- [ ] `.env` is not committed (`git status` shows it as ignored).
- [ ] `.env` permissions are `600` (read/write only by the runtime user).
- [ ] Only the runtime user can read the database file.
- [ ] Backups of `.env` are stored off-host and encrypted.
- [ ] The `ProviderConfig` row's `apiKey` field is empty if you are using the env var instead.
- [ ] No API key appears in logs (`grep -i 'apikey\|authorization' *.log` returns nothing sensitive).

---

## 3. File Upload Safety

| Threat | Mitigation |
| --- | --- |
| Oversized upload DoS | `MAX_UPLOAD_MB` (default 512) enforces a hard size cap before the file is written to disk |
| Path traversal via filename | Uploaded filenames are sanitized: basename only, ASCII-safe, length-capped; storage path is always under `VIDEO_STORAGE_PATH`, constructed with `path.join` and validated to remain inside the root |
| Malicious file content | File type is validated by magic-byte inspection, not by extension; only allowlisted video MIME types are accepted |
| Symlink escape | The storage path is resolved with `fs.realpath` and verified to be inside the configured root before any read/write |
| Filename collisions | Uploaded files are renamed to a server-generated ID; the original filename is stored as metadata only |
| Inconsistent state | Upload is staged to a temp path and atomically moved only after probe success |

### Operator checklist

- [ ] `MAX_UPLOAD_MB` is set to the smallest value your use case permits.
- [ ] Your reverse proxy enforces the same body-size limit.
- [ ] The storage volume is on a filesystem that supports the load (and is not the root partition).

---

## 4. Filesystem Access

The application needs write access to exactly two locations:

- The database file (or its directory, for SQLite).
- `VIDEO_STORAGE_PATH` and `OUTPUT_STORAGE_PATH`.

It does **not** need access to:

- The user's home directory.
- `/etc`, `/root`, `/var/log`.
- Any path outside the configured storage root.

### Operator checklist

- [ ] The runtime user is a non-root, dedicated system user (UID `1001` in the default Docker image).
- [ ] The working directory is the repository root (or `/app` in Docker).
- [ ] The runtime user has no sudo rights.
- [ ] In Docker, the container runs with `--read-only` filesystem where practical, with explicit write mounts only for `db/` and `storage/`.

---

## 5. Path Traversal

Every API that takes a file path or ID resolves the path server-side from a trusted source (the database). User-supplied IDs are validated against the database; user-supplied paths are never trusted. The general pattern:

```ts
// Reject anything that isn't a project/video/analysis ID
const video = await db.videoAsset.findUnique({ where: { id } });
if (!video) throw new NotFoundError();

// Resolve and verify
const resolved = path.resolve(VIDEO_STORAGE_PATH, video.filePath);
const root = path.resolve(VIDEO_STORAGE_PATH);
if (!resolved.startsWith(root + path.sep)) {
  throw new ForbiddenError('Path traversal attempt');
}
```

### Operator checklist

- [ ] No API endpoint accepts a raw user-supplied filesystem path as input.
- [ ] Snapshot, report, and export filenames are generated server-side from IDs and a sanitized slug.

---

## 6. Report and Export Filenames

Generated reports and exports are written under `storage/projects/<id>/reports/` and `storage/projects/<id>/exports/`. Filenames are constructed as:

```
<report-id>-<slug>.<ext>
```

where:

- `<report-id>` is a server-generated CUID.
- `<slug>` is derived from the user-supplied title, sanitized to `[a-z0-9-]`, length-capped to 80 chars.
- `<ext>` is one of `html`, `csv`, `json`, `pdf` (PDF gated by feature flag).

This prevents:

- Path traversal via the title.
- Filename collisions.
- OS-illegal characters in filenames.

---

## 7. API Payload Validation

All API routes validate request bodies with Zod schemas before any work is done. Invalid payloads are rejected with `400 Bad Request` and a structured error body. No endpoint silently coerces unexpected types.

Examples:

- Creating a project requires a non-empty `name` (1–200 chars).
- Drawing a zone requires a polygon with at least 3 points, each normalized 0..1.
- Creating a rule requires a `ruleType` from the fixed enum.
- Running an analysis requires a valid `videoId` and optional `options` matching the `SequenceOptions` shape.

### Operator checklist

- [ ] Logs of rejected payloads do not contain secrets (they don't — payloads are request bodies, not env vars; but verify).
- [ ] Reverse proxy returns your custom error pages for 4xx/5xx if desired.

---

## 8. Logging Discipline

| Never logged | Reason |
| --- | --- |
| `AI_API_KEY`, `apiKey` | Secret |
| `Authorization` header | Secret |
| `password`, `secret`, `token` fields | Secret |
| Full request bodies of multipart uploads | May contain uploaded content (potentially sensitive) |
| Response bodies from the provider | May contain provider API response data |

A redaction middleware scans log lines against an allowlist of keys and replaces sensitive values with `[REDACTED]`. `LOG_LEVEL` controls verbosity:

- `error` — only errors.
- `warn` — errors and warnings.
- `info` — operational events (analysis started, completed, failed). Default.
- `debug` — verbose; do not use in production.

### Operator checklist

- [ ] `LOG_LEVEL` is `info` or `warn` in production.
- [ ] Log files are rotated and access-controlled.
- [ ] Logs are not shipped to a third-party log aggregator without reviewing the redaction layer.

---

## 9. HTTP and Headers

For internet-facing deployments, put AI Traffic Analyzer behind a reverse proxy (Caddy, Traefik, Nginx) that terminates TLS and sets security headers. Recommended headers:

| Header | Value | Why |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` (or CSP `frame-ancestors 'none'`) | Prevent clickjacking |
| `Content-Security-Policy` | Strict policy tuned for your deployment | Mitigate XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Deny unnecessary browser capabilities |

The included `Caddyfile` at the repo root sets several of these as a starting point.

### Operator checklist

- [ ] TLS is terminated by the reverse proxy.
- [ ] Internal traffic between the proxy and the app stays on `localhost` or a private Docker network.
- [ ] Security headers are configured and verified with a scanner (e.g. securityheaders.com).

---

## 10. FFmpeg Argument Safety

FFmpeg is invoked with a fixed argument vector. **No user input is ever passed to a shell.** All arguments are passed as an array (no `shell: true`). Specifically:

- Input file paths are resolved server-side from a validated DB record (see §5).
- Numeric options (`-ss`, `-t`, `-vf scale=...`) are interpolated from validated, typed values.
- Output paths are server-generated IDs in the storage root.
- No user-supplied string is ever placed in a position where FFmpeg would interpret it as a flag (e.g. never `ffmpeg <user-input>`).

This prevents argument injection via filenames, filter strings, or metadata.

---

## 11. Masking Secrets in the UI

The Settings → AI Provider screen masks the API key:

- Display: `sk-••••••••••ab12` (first 3 + last 4 chars).
- A **Reveal** button toggles visibility for the current admin session only.
- The full key is never included in HTML responses, API responses to the browser, or hydration data.

### Operator checklist

- [ ] Screenshots used in marketing or support requests do not contain a revealed key.
- [ ] The Reveal button is used only when strictly necessary.

---

## 12. Privacy by Default

V1 is designed around traffic analytics, not surveillance. Defaults reflect that:

- **No facial recognition** is implemented or licensed as a capability.
- **No biometric identification** is implemented.
- **No person re-identification** is implemented.
- **No automated enforcement** or fines are implemented.
- The product analyzes vehicle motion and counts; it does not identify individuals.
- Snapshots stored for events contain vehicle context, not face crops.

### Operator responsibility for legal basis

You are responsible for:

- Establishing and documenting the legal basis for processing video in your jurisdiction.
- Complying with applicable privacy law (GDPR, CCPA, local CCTV/traffic regulations, etc.).
- Posting any required signage (e.g. CCTV notices).
- Retention limits for source videos, snapshots, and reports.
- Data subject access requests if your jurisdiction grants them.

### Privacy-hardening deployment recommendations

- Use the **`mock`** provider for product demos where no real video processing is needed.
- Use **`local-inference`** for sensitive on-prem deployments so video never leaves your network.
- Avoid the `generic-http` provider with third-party APIs for video of identifiable people unless you have a data processing agreement with the API vendor.
- Store source videos on encrypted volumes.
- Set a retention policy and prune `storage/projects/<id>/videos/` and `snapshots/` on a schedule.
- Disable the `enableClips` and `enableEstimatedSpeed` feature flags if you do not need them (see [CUSTOMIZATION.md](./CUSTOMIZATION.md) §7).

---

## 13. Dependency Security

Dependencies are pinned in `package.json` with caret ranges. See [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) for the full license table. Security-relevant practices:

- Run `bun audit` (or `npm audit`) regularly and on every dependency bump.
- Pin lockfile (`bun.lock`) — do not commit without it.
- Review transitive dependencies before major upgrades.
- No dependency is allowed to send data off-host. Audit any new dependency for telemetry/phone-home behavior before adding it.

---

## 14. Vulnerability Reporting

If you discover a vulnerability in AI Traffic Analyzer, please report it responsibly to `security@example.com` (replace with the operator's actual address). Include:

- A description of the issue.
- Steps to reproduce (minimum viable PoC).
- Affected versions.
- Your assessment of impact.

Do not publicly disclose vulnerabilities until a fix has been released or 90 days have elapsed, whichever is sooner.

---

## 15. Cross-References

- [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment, volumes, PostgreSQL.
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — provider configuration and API key handling.
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — feature flags, upload limits, defaults.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — security-adjacent runtime issues.
- [LICENSING.md](./LICENSING.md) — what your license permits regarding security modifications.
