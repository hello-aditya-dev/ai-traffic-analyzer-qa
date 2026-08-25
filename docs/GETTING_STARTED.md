# Getting Started

Welcome to **AI Traffic Analyzer**. This guide takes you from a fresh clone to a running, working installation in a few commands. Two installation paths are covered: a Docker Compose path (recommended for evaluation and production) and a native development path (recommended for customization work).

AI Traffic Analyzer ships with a deterministic **mock AI provider** enabled by default, so the full pipeline runs end-to-end with **zero external API keys**. You can switch to a real vision API later by editing `.env` — see [AI_PROVIDERS.md](./AI_PROVIDERS.md).

---

## 1. System Requirements

### Minimum (Demo / Mock provider / short videos)

| Component | Requirement |
| --- | --- |
| OS | Linux, macOS, or Windows (WSL2 recommended) |
| CPU | 2 cores, x86_64 or ARM64 |
| RAM | 4 GB |
| Disk | 5 GB free (code + dependencies + sample data) |
| Browser | Chromium-based, Firefox, or Safari (current versions) |

### Recommended (Real-world video, generic HTTP provider)

| Component | Requirement |
| --- | --- |
| CPU | 4+ cores |
| RAM | 8 GB+ |
| Disk | 50 GB+ SSD (uploads, analysis outputs, reports) |
| Network | Outbound access to your chosen vision provider, if any |

### Required tooling (Docker path)

- Docker 24+
- Docker Compose v2 (`docker compose` plugin)

### Required tooling (Native dev path)

- Node.js 20+ **or** Bun 1.1+ (Bun is the recommended runtime)
- FFmpeg 6+ (used for video probing and frame extraction)
- Git

> FFmpeg must be available on your `PATH`. On Debian/Ubuntu: `sudo apt-get install ffmpeg`. On macOS: `brew install ffmpeg`. On Windows/WSL: install via your distribution's package manager.

---

## 2. Quick Start — Docker (recommended)

```bash
# 1. Clone
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer

# 2. Configure environment
cp .env.example .env
# (defaults are fine for a first run — the mock provider needs no key)

# 3. Build and launch
docker compose up --build
```

Open `http://localhost:3000` in your browser.

The first build downloads dependencies and may take several minutes. Subsequent starts are fast.

To stop:

```bash
docker compose down
```

To stop and **remove data** (fresh install):

```bash
docker compose down -v
```

---

## 3. Quick Start — Native Development

The native path is best when you intend to read or modify the source.

```bash
# 1. Clone
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer

# 2. Install dependencies (Bun recommended; npm/pnpm/yarn also work)
bun install

# 3. Configure environment
cp .env.example .env

# 4. Create / migrate the SQLite database
bun run db:push

# 5. Start the dev server
bun run dev
```

Open `http://localhost:3000`.

### Equivalent with npm

```bash
npm install
npm run db:push
npm run dev
```

### Production build (native)

```bash
bun run build
bun run start
```

The production build uses Next.js standalone output (`output: "standalone"` in `next.config.ts`).

---

## 4. First Run Walkthrough

### 4.1 Onboarding screen

On first launch you will see a short onboarding flow that confirms the database is reachable, the storage directories are writable, and the AI provider is configured. If you skipped onboarding, you can replay it from **Settings → Onboarding**.

### 4.2 Try Demo Mode (no video upload required)

AI Traffic Analyzer ships with a **demo project** that contains a sample video, pre-defined zones, and a default ruleset.

1. From the dashboard sidebar, choose **Demo Mode** (or **Projects → Open Demo Project**).
2. The demo project loads with one video asset, two polygonal zones, one virtual counting line, and a basic ruleset already configured.
3. Click **Run Analysis**.
4. Watch the pipeline progress through its stages (see [ARCHITECTURE.md](./ARCHITECTURE.md)).
5. When the run completes, explore:
   - **Overview** — total counts, class breakdown, directional flow.
   - **Events** — timeline of detected events (crossings, zone entries/exits, congestion, etc.).
   - **Charts** — time-series volume, class distribution, direction rose.
   - **Reports** — generate an HTML or CSV report.

Demo Mode uses the **mock provider**, which produces deterministic, repeatable output. It is suitable for screenshots, sales demos, and onboarding — not for operational decisions about real-world traffic.

### 4.3 Run your own analysis

1. **Create a project** — Projects → New Project. Give it a name and optional location.
2. **Upload a video** — drag an H.264 MP4 file into the upload area. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if your video fails to probe.
3. **Draw zones and lines** — open the Zone/Rule Editor. Draw polygons over areas of interest (intersections, lanes, entrances). Add a virtual counting line across a lane and pick a direction.
4. **Configure rules** — enable or disable rule types: `COUNT_CROSSING`, `ZONE_ENTRY`, `ZONE_EXIT`, `STOPPED_VEHICLE`, `WRONG_WAY`, `CONGESTION`, `DWELL_TIME`. Each rule has parameters (thresholds, dwell time, direction).
5. **Run analysis** — click Run Analysis. Select a provider (default: `mock`) and adjust cost-control knobs (frame rate, max frames, resolution, confidence threshold).
6. **Review results** — counts, classifications, tracks, events, charts.
7. **Export** — CSV, JSON, or professional HTML report. PDF export is available where the environment supports reliable PDF generation.

### 4.4 Switch to a real AI provider (optional)

Edit `.env`:

```env
AI_PROVIDER=generic-http
AI_API_BASE_URL=https://your-vision-api.example.com
AI_API_KEY=your-key-here
AI_MODEL=your-model-name
```

Restart the app, then open **Settings → AI Provider** and click **Test connection**. See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for the full reference.

---

## 5. Where Things Are Stored

By default, all data is stored under the repository root:

```text
db/custom.db                        # SQLite database (projects, videos metadata, analyses, events)
storage/
  projects/<project-id>/
    videos/                          # Uploaded source video files
    analysis/<analysis-id>/          # Per-run detection/track artifacts
    snapshots/                       # Event snapshot frames
    clips/                           # Event clip exports (where generated)
    reports/                         # Generated HTML/CSV/JSON/PDF reports
    exports/                         # Raw structured exports
```

Paths are configurable via `VIDEO_STORAGE_PATH` and `OUTPUT_STORAGE_PATH` (see [DEPLOYMENT.md](./DEPLOYMENT.md)). In Docker, these are bind-mounted volumes so data persists across container restarts.

---

## 6. Verifying the Installation

| Check | How |
| --- | --- |
| App loads | Visit `http://localhost:3000` |
| Database reachable | Onboarding screen shows a green DB status |
| Storage writable | Upload a small test video |
| Provider healthy | Settings → AI Provider → Test connection |
| Pipeline runs end-to-end | Run Demo Mode analysis |

If any check fails, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 7. Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) — understand the pipeline and provider model.
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — configure or extend the AI layer.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment, PostgreSQL, backups.
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — branding, defaults, navigation, feature flags.
- [SECURITY.md](./SECURITY.md) — deployment hardening checklist.
- [LICENSING.md](./LICENSING.md) — what your license tier permits.
