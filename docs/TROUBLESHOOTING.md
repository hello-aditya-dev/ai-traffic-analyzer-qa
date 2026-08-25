# Troubleshooting

This document lists the most common issues encountered when running **AI Traffic Analyzer**, with symptoms, causes, and fixes. If your issue is not listed, check the logs (`dev.log`, `server.log`, or `docker compose logs`) and the architecture/deployment docs.

---

## 1. Video codec not supported / upload fails probing

**Symptom:** Upload succeeds but the video status stays `PROCESSING` then moves to `FAILED`, or the duration/fps show as `0`.

**Cause:** The video is in a container/codec FFmpeg cannot decode in the current build (e.g. HEVC/H.265, AV1, or a non-standard MOV).

**Fix:**

- Re-encode to **H.264 MP4** with AAC audio:

  ```bash
  ffmpeg -i input.mov -c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart output.mp4
  ```

- Use `-movflags +faststart` so the file can be probed/streamed without reading the whole file.
- For batch conversion of many videos, see the `scripts/` directory helpers (or write a one-liner using `find` + `ffmpeg`).

**Prevention:** Standardize on H.264 MP4 for all uploads.

---

## 2. FFmpeg not found / `ENOENT` on frame extraction

**Symptom:** App starts but every analysis fails. Logs contain `spawn ffmpeg ENOENT` or `ffprobe not found`.

**Cause:** FFmpeg is not installed or not on the `PATH` visible to the process.

**Fix:**

- Verify:

  ```bash
  ffmpeg -version
  ffprobe -version
  ```

- Install FFmpeg:
  - Debian/Ubuntu: `sudo apt-get install ffmpeg`
  - macOS (Homebrew): `brew install ffmpeg`
  - Windows/WSL: `sudo apt-get install ffmpeg` inside WSL
  - Alpine (Docker): `apk add --no-cache ffmpeg`

- In Docker, the provided image installs FFmpeg. If you build a custom image, add `ffmpeg` to the system packages.

- If running behind a reverse proxy that strips `PATH`, set an absolute path in `.env` (e.g. `FFMPEG_PATH=/usr/bin/ffmpeg`) — supported by the video service when set.

---

## 3. Python environment errors

**Symptom:** Buyer attempts to enable real computer-vision inference and sees errors mentioning Python, FastAPI, OpenCV, or `pip`.

**Cause:** V1 does **not** include a Python service. The `local-inference` adapter is a documented extension point (see [AI_PROVIDERS.md](./AI_PROVIDERS.md) §2.3). There is no Python runtime in the default Docker image.

**Fix:**

- If you only need a demo or screenshots, use the **`mock` provider** — no Python required.
- If you need real accuracy, deploy your own Python/FastAPI worker that fulfills the `local-inference` contract, then set:

  ```env
  AI_PROVIDER=local-inference
  AI_API_BASE_URL=http://your-worker:8001
  ```

- See `src/providers/local-inference/README.md` in the repo for the worker contract.

---

## 4. Provider returns 401 / 403 — invalid API key

**Symptom:** `healthCheck()` fails; analysis runs fail with `401 Unauthorized` or `403 Forbidden`.

**Cause:** The API key is missing, expired, or lacks permission for the model.

**Fix:**

- In **Settings → AI Provider**, click **Reveal** to visually confirm the key (the UI masks it by default).
- Verify the key in your provider's dashboard.
- Check that the key has access to the configured `AI_MODEL`.
- Ensure `.env` (or the `ProviderConfig` row) has `AI_API_KEY` set and that the app was restarted after changing `.env`.
- Confirm `AI_API_BASE_URL` is the correct endpoint (some APIs have separate URLs for detection vs. classification).

---

## 5. Provider connectivity / timeout

**Symptom:** `healthCheck()` reports high latency or fails; analyses intermittently fail with `ETIMEDOUT`, `ECONNREFUSED`, or `fetch failed`.

**Cause:** Network path to the provider is blocked, the provider is rate-limiting, or the configured `timeout`/`retries` are too low.

**Fix:**

- From the host running the app:

  ```bash
  curl -I $AI_API_BASE_URL
  ```

- If behind a corporate proxy, set `HTTP_PROXY` / `HTTPS_PROXY` in the environment.
- Increase `ProviderConfig.timeout` (Settings → AI Provider) to 60s for slower providers.
- Increase `ProviderConfig.retries` for transient failures.
- Reduce `frameRate` or `maxFrames` to lower concurrency pressure.
- If using `local-inference`, confirm the worker container is on the same Docker network and reachable by hostname.

---

## 6. Docker issues

### 6.1 `docker compose up` fails to build

**Symptom:** Build fails during `bun install` / `npm install` with network errors.

**Cause:** Network access to npm registry is blocked, or DNS is not resolving.

**Fix:**

- Configure a registry mirror in `.npmrc`.
- Use `--network=host` for the build step (Linux only):

  ```bash
  DOCKER_BUILDKIT=1 docker compose build --build-arg BUILDKIT_NETWORK=host
  ```

- Pre-install dependencies on the host and copy `node_modules` if your environment fully blocks outbound network during builds.

### 6.2 Container exits immediately

**Symptom:** `docker compose up` starts the container but it exits with a non-zero status.

**Cause:** Often a missing env var, an unwritable storage path, or a DB path that cannot be created.

**Fix:**

- Inspect logs: `docker compose logs traffic-ai`.
- Confirm `.env` exists and `DATABASE_URL` points to a writable location.
- Confirm the bind-mounted volume path exists on the host and is writable by the container user.

### 6.3 Volume permissions

**Symptom:** App reports "permission denied" writing to `storage/` or `db/`.

**Cause:** The host directory is owned by a different UID than the container process.

**Fix:**

- On Linux, ensure the host directory is writable by the container user (UID `1001` in the default image):

  ```bash
  sudo chown -R 1001:1001 /var/traffic-ai
  ```

- Or run the container as your host user via `user:` in `docker-compose.yml` (not recommended for production).

---

## 7. File permissions

**Symptom:** Uploads, reports, or exports fail to write.

**Cause:** The process cannot write to `VIDEO_STORAGE_PATH` or `OUTPUT_STORAGE_PATH`.

**Fix:**

- Confirm paths exist:

  ```bash
  ls -la $VIDEO_STORAGE_PATH $OUTPUT_STORAGE_PATH
  ```

- Confirm the runtime user can write:

  ```bash
  sudo -u <app-user> touch $VIDEO_STORAGE_PATH/.write-test
  ```

- In Docker, the bind-mounted host directory must be owned by UID `1001` (or the configured container user).

---

## 8. GPU not available / not used

**Symptom:** Performance is slow; expected GPU acceleration is not happening.

**Cause:** V1 does not require or use a GPU. The `mock` provider is CPU-only. The `generic-http` provider delegates inference to an external service (which may or may not use a GPU). The `local-inference` extension point would use whatever GPU the buyer's Python worker is configured to use.

**Fix:**

- If you need GPU acceleration, deploy your own inference worker with GPU access and select `AI_PROVIDER=local-inference`. There is no GPU configuration to tweak inside V1 itself.

---

## 9. Database locked (SQLite)

**Symptom:** Analysis runs or UI actions fail with `SQLITE_BUSY: database is locked`.

**Cause:** SQLite uses file-level locking. Concurrent long writes (e.g. a large analysis run while another request writes) can collide. V1 is designed as a single-instance deployment.

**Fix:**

- Ensure only one instance is running. (Stop stray `bun run dev` or duplicate containers.)
- Wait — the default busy timeout retries briefly. Long collisions still fail.
- For production with concurrent load, **switch to PostgreSQL** (see [DEPLOYMENT.md](./DEPLOYMENT.md) §5). SQLite is the default for evaluation, not for multi-instance production.

---

## 10. Port already in use

**Symptom:** App fails to start with `EADDRINUSE: address already in use 0.0.0.0:3000`.

**Cause:** Another process is bound to port 3000.

**Fix:**

- Find and stop the other process:

  ```bash
  lsof -i :3000      # macOS/Linux
  # or
  ss -lntp | grep 3000
  ```

- Or run AI Traffic Analyzer on a different port:

  ```bash
  PORT=3100 bun run dev
  ```

- For Docker, map a different host port in `docker-compose.yml`:

  ```yaml
  ports:
    - "3100:3000"
  ```

---

## 11. Upload rejected (too large)

**Symptom:** Upload fails immediately with a size error.

**Cause:** The file exceeds `MAX_UPLOAD_MB` (default 512 MB).

**Fix:**

- Increase the limit in `.env`:

  ```env
  MAX_UPLOAD_MB=2048
  ```

- Restart the app (or rebuild the Docker image).
- If behind a reverse proxy, raise its body-size limit too (e.g. Nginx `client_max_body_size 2g;`, Caddy `request_body { max_size 2GB }`).

---

## 12. Snapshot/report files not generated

**Symptom:** Analysis completes but snapshots or report files are missing.

**Cause:** The corresponding subdirectory under `storage/projects/<id>/snapshots/` or `storage/projects/<id>/reports/` does not exist or is not writable.

**Fix:**

- The app creates these directories on demand. If creation failed (permission issue), fix permissions (see §7) and re-run the analysis.

---

## 13. PDF export unavailable

**Symptom:** The Reports page shows HTML, CSV, and JSON options but PDF is greyed out.

**Cause:** PDF generation depends on a headless browser/chrome runtime. If the host cannot run one, PDF is disabled in the UI (per the feature flag for PDF support).

**Fix:**

- Ensure the runtime has a headless Chromium available (the default Docker image includes it; native deployments may need to install one).
- Or use HTML reports (which can be printed to PDF from the browser) as an alternative.

---

## 14. Mock provider output looks unrealistic

**Symptom:** Counts, classes, or trajectories look obviously synthetic or don't match real traffic patterns.

**Cause:** The `mock` provider is deterministic and intentionally synthetic (see [AI_PROVIDERS.md](./AI_PROVIDERS.md) §2.1).

**Fix:**

- This is expected behavior. Switch to `generic-http` or `local-inference` for real-world accuracy. Do not use `mock` output for operational decisions.

---

## 15. App loads but the dashboard is empty

**Symptom:** The homepage renders with no projects, no demo data, no counts.

**Cause:** Onboarding was skipped and no projects exist yet.

**Fix:**

- Click **Demo Mode** (or Projects → Open Demo Project) to load the sample project.
- Or create a new project and run an analysis.

---

## 16. Useful log commands

```bash
# Docker
docker compose logs -f traffic-ai
docker compose logs --tail=200 traffic-ai

# Native dev
tail -f dev.log
tail -f server.log

# systemd
journalctl -u traffic-ai -f
```

For everything else, see [ARCHITECTURE.md](./ARCHITECTURE.md), [DEPLOYMENT.md](./DEPLOYMENT.md), and [SECURITY.md](./SECURITY.md).
