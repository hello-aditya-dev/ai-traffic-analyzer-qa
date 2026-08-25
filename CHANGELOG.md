# Changelog

All notable changes to **AI Traffic Analyzer** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for its public surface (UI, configuration variables, file storage layout, and the `VisionProvider` contract).

---

## [1.0.0] — Initial release

The first commercial release of AI Traffic Analyzer as a full source-code product.

### Added

#### Application
- Single-deployable Next.js 16 (App Router) application with TypeScript, Tailwind CSS 4, and shadcn/ui.
- Dashboard with overview, KPIs, and recent projects.
- Projects manager (create, edit, archive) with name, description, and location.
- Video upload (MP4 / H.264 and other FFmpeg-decodable formats) with FFmpeg-based probing (duration, fps, dimensions, frame count).
- Demo Mode with a pre-loaded sample project (video, zones, counting line, default ruleset).
- Onboarding flow (first-run checks: DB reachable, storage writable, provider healthy).
- Settings area including AI Provider configuration (test connection, cost-control knobs).

#### Detection & analysis pipeline
- Frame sampling at a configurable rate, with `maxFrames`, `resolution`, and `confidenceThreshold` cost-control knobs.
- Vehicle detection, classification (car, motorcycle, truck, bus, bicycle), and counting.
- Object tracking with stable track IDs across sampled frames.
- Trajectory building (smoothed positions, direction vector, entry/exit points).
- Directional flow in 8 compass directions plus custom labels.
- Virtual line crossing detection with direction.
- Polygonal zone logic (point-in-polygon) for user-defined zones.
- Estimated speed as a relative motion indicator (not certified, configurable pixels-per-meter scale).
- Congestion metric: LOW / MODERATE / HIGH / SEVERE.
- Time-series aggregation of vehicle volume.

#### Rules engine
- `COUNT_CROSSING` — count vehicles crossing a virtual line, with direction filter.
- `ZONE_ENTRY` — vehicle enters a configured zone.
- `ZONE_EXIT` — vehicle exits a configured zone.
- `STOPPED_VEHICLE` — vehicle dwells beyond a configurable threshold.
- `WRONG_WAY` — vehicle moves against the configured lane direction.
- `CONGESTION` — zone occupancy exceeds a configurable threshold.
- `DWELL_TIME` — time-in-zone tracking.
- Events emitted with severity (info, low, medium, high, critical) and snapshot references.

#### Outputs & reports
- Event snapshots (JPEG frames) stored per analysis.
- Counts, class breakdown, directional breakdown.
- Time-series charts (Recharts) on the dashboard.
- CSV export (counts, events, detections).
- JSON export (full structured run).
- Professional self-contained HTML report (branded, embedded CSS, inline charts).
- PDF export where the runtime supports reliable generation (gated by `enablePdfExport` feature flag).

#### Provider-adapter architecture
- `VisionProvider` interface (`detectObjects`, `classifyObjects`, `analyzeFrame`, `processSequence`, `healthCheck`).
- `mock` provider — deterministic, no API key, no GPU, no Python toolchain; the default.
- `generic-http` provider adapter — configurable base URL, API key (bearer header), model, retries, timeout; compatible with any HTTP vision API returning the documented DTOs.
- `local-inference` extension point — adapter stub and documented worker contract for a Python/FastAPI vision worker (OpenCV, FFmpeg, YOLO-class models). **Not shipped as a V1 component**; documented so buyers can extend along this path without changing application logic.

#### Data model (Prisma)
- `Project`, `VideoAsset`, `AnalysisRun`, `Detection`, `Track`, `Zone`, `Rule`, `Event`, `Report` models.
- `Camera` model (RTSP architecture, not enabled in V1 UI).
- `ProviderConfig` model for runtime provider settings.
- SQLite as default datasource; PostgreSQL supported via `DATABASE_URL` and datasource provider switch.

#### File storage hierarchy
- `storage/projects/<project-id>/videos/` — uploaded source videos.
- `storage/projects/<project-id>/analysis/<analysis-id>/` — per-run detection/track artifacts.
- `storage/projects/<project-id>/snapshots/` — event snapshot frames.
- `storage/projects/<project-id>/clips/` — optional event clip exports (alpha).
- `storage/projects/<project-id>/reports/` — generated HTML/CSV/JSON/PDF reports.
- `storage/projects/<project-id>/exports/` — raw structured exports.
- Paths configurable via `VIDEO_STORAGE_PATH` and `OUTPUT_STORAGE_PATH`.

#### Customization surface
- Central branding configuration in `src/lib/brand.ts` (product name, logo, colors, links).
- Default rules in `src/lib/defaults/rules.ts`.
- Default zones in `src/lib/defaults/zones.ts`.
- Navigation labels in `src/components/layout/nav.ts`.
- Report templates in `src/lib/reports/templates/`.
- Export registry in `src/lib/exports/registry.ts`.
- Feature flags in `src/lib/feature-flags.ts`.

#### Deployment & packaging
- Docker Compose deployment with bind-mounted volumes for the database and storage.
- Native development path with Bun (recommended) or Node.js 20+.
- Next.js standalone build output.
- Sample `Caddyfile` for TLS termination.
- `.env.example` with documented variables.

#### Security
- API keys read server-side only; masked in the UI; never logged.
- File upload validation: magic-byte inspection, allowlisted MIME types, size cap (`MAX_UPLOAD_MB`).
- Filename sanitization and server-generated IDs to prevent path traversal.
- FFmpeg invoked without a shell (`shell: false`) with validated, typed arguments.
- Path resolution checks that resolved paths remain inside the configured storage root.
- No facial recognition, biometric identification, person re-identification, or enforcement features — privacy by default.
- No phone-home, no telemetry.

#### Documentation
- `docs/GETTING_STARTED.md`, `docs/ARCHITECTURE.md`, `docs/AI_PROVIDERS.md`, `docs/DEPLOYMENT.md`, `docs/TROUBLESHOOTING.md`, `docs/CUSTOMIZATION.md`, `docs/LICENSING.md`, `docs/SECURITY.md`, `docs/THIRD_PARTY_LICENSES.md`.
- `marketing/PRODUCT_LISTING.md` and `marketing/DIRECT_OUTREACH.md`.
- Root `README.md`, `CHANGELOG.md`, `LICENSE.md`.

#### Licensing
- Four commercial tiers: Personal ($59), Commercial ($199), Agency ($499), Extended/Reseller ($999+).
- Prices stored only as marketing metadata in `marketing/PRODUCT_LISTING.md`; not read by the application.
- Proprietary license text in `LICENSE.md`.

---

### Known limitations

- **AI accuracy.** The default `mock` provider produces deterministic synthetic output. It is suitable for demos, screenshots, UI/UX development, and sales conversations, not for operational decisions about real-world traffic. Real accuracy requires the `generic-http` adapter with a real vision API, or the `local-inference` extension point with a buyer-implemented Python/FastAPI worker.
- **Estimated speed is not certified.** It is a relative motion indicator derived from frame displacement, sampling rate, and an assumed pixels-per-meter scale. It must not be used for enforcement.
- **Single-instance deployment.** V1 is designed as a single-instance deployment. SQLite is the default; for multi-instance or high-concurrency production, switch to PostgreSQL (see `docs/DEPLOYMENT.md` §5) and use shared storage.
- **No authentication / multi-tenancy.** V1 assumes a trusted internal network or a deployment protected by a reverse proxy with access control. Authentication, multi-tenancy, and SSO are explicitly out of scope for V1.
- **No billing infrastructure.** The application does not read prices or enforce tier checks. Resellers bring their own storefront and billing.
- **PDF export depends on a headless Chromium runtime.** Where the runtime cannot provide one, the option is hidden in the UI.
- **RTSP camera support is architectural only.** The data model and UI placeholder exist; live streaming is not enabled by default in V1.
- **No facial recognition, biometric ID, person re-identification, or automated enforcement.** These are not implemented and not licensed as capabilities.
- **No bundled Python/FastAPI/OpenCV worker.** The `local-inference` extension point ships the adapter contract; the worker itself is the buyer's to implement.

---

### Migration notes

This is the initial release; there is no prior version to migrate from. The following notes apply to upgrading from a pre-release or development snapshot to 1.0.0:

1. **Database schema.** Run `bun run db:push` (or `npm run db:push`) to apply the schema. The schema is additive relative to earlier drafts; destructive changes (if any) will warn.
2. **Environment variables.** Copy the new `.env.example` to `.env` and review the documented variables. Notable additions in the final 1.0.0:
   - `AI_PROVIDER` (default `mock`).
   - `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (provider config).
   - `VIDEO_STORAGE_PATH`, `OUTPUT_STORAGE_PATH` (storage roots).
   - `MAX_UPLOAD_MB` (default 512).
   - `DEFAULT_FRAME_RATE` (default 2).
   - `ALLOW_INSECURE_PROVIDER_HTTP` (default `false`).
3. **Storage layout.** The canonical storage hierarchy is `storage/projects/<id>/{videos,analysis,snapshots,clips,reports,exports}/`. If you have an older flat layout, move artifacts into the per-project subfolders before running 1.0.0 (or run a fresh analysis).
4. **Provider config.** The `ProviderConfig` table is now the runtime source of truth for provider settings, with env vars as fallback. If you previously relied on env vars only, that still works — leave the DB fields empty.
5. **Feature flags.** `src/lib/feature-flags.ts` is new. Review the defaults (`enablePdfExport: true`, `enableClips: false`, `enableRtspCameras: false`, `enableEstimatedSpeed: true`, etc.) and adjust for your deployment.
6. **Branding.** Branding is centralized in `src/lib/brand.ts`. If you previously customized strings across multiple files, consolidate them there.

---

## Versioning policy

- **Major** (x.0.0): incompatible changes to the public surface — UI structure, configuration variable names, file storage layout, or the `VisionProvider` contract.
- **Minor** (1.x.0): new features, additive changes, new providers, new rule types, new export formats.
- **Patch** (1.0.x): bug fixes, documentation, and non-breaking refinements.

Buyers operating under the Agency or Extended/Reseller tiers should consult `docs/CUSTOMIZATION.md` and `docs/LICENSING.md` before upgrading a customized fork.
