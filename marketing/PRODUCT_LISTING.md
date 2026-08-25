# Product Listing — AI Traffic Analyzer

> Marketplace-ready listing copy for **AI Traffic Analyzer — Vehicle Detection, Counting, Tracking & Traffic Reports — Full Source Code**. This file is the single source of truth for pricing, tier definitions, and storefront copy. The application does **not** hard-code prices; if you adjust them, do it here.

---

## Title

**AI Traffic Analyzer — Vehicle Detection, Counting, Tracking & Traffic Reports — Full Source Code**

## Subtitle / Value Proposition

Self-hosted AI traffic analytics from video. Detect, classify, count, and track vehicles, build directional flow and zone analytics, generate professional reports — and own the source code.

## Short Description

AI Traffic Analyzer is a self-hosted, source-code-first product that converts traffic and road video into structured traffic intelligence: vehicle counts, classifications, tracking, directional flow, zone analytics, line crossings, configurable events, and professional HTML/CSV/JSON/PDF reports. Ships with a deterministic mock AI provider so the entire pipeline runs with zero external API keys — and an open provider architecture so you can plug in real vision APIs or your own local-inference worker.

## Long Description

Most traffic analytics tools are SaaS. You upload your video to someone else's server, pay recurring fees, and never see the code. **AI Traffic Analyzer is different.** You buy the source code, deploy it on your own infrastructure, customize it for your clients, and own the deployment end to end.

### What it does

Upload a traffic video (MP4 / H.264) or run the included demo project. Draw polygonal zones and virtual counting lines over the frame, configure rules (crossings, zone entry/exit, stopped vehicles, wrong-way, congestion, dwell time), and run an analysis. The pipeline returns:

- **Vehicle counts** by class (car, motorcycle, truck, bus, bicycle).
- **Object tracking** with stable track IDs across frames.
- **Directional flow** in 8 compass directions plus custom labels.
- **Line-crossing counts** with direction.
- **Zone statistics** (entries, exits, dwell, peak occupancy).
- **Events timeline** with severity and snapshot frames.
- **Congestion metric** (LOW / MODERATE / HIGH / SEVERE).
- **Time-series charts** of volume over time.
- **Estimated speed** as a relative motion indicator (not certified).
- **Exports**: CSV, JSON, professional HTML report, PDF where supported.

### Why it's a foundation, not a black box

- **Provider-adapter architecture.** Application code never calls a specific AI vendor. It talks to a `VisionProvider` interface (`detectObjects`, `classifyObjects`, `analyzeFrame`, `processSequence`, `healthCheck`). You can run the deterministic `mock` provider (no API key, no GPU), the `generic-http` adapter (any vision API you already have), or your own local-inference worker.
- **Open extension point for real CV.** The `local-inference` adapter is structured so a Python/FastAPI vision worker (OpenCV, FFmpeg, YOLO-class models) can be plugged in later without changing application logic. V1 ships the contract and a stub; the worker itself is the buyer's to implement.
- **Full TypeScript source.** Frontend and backend are Next.js 16 + TypeScript + Prisma + SQLite/PostgreSQL. Read every line, rebrand it, ship it under your own name (subject to your license tier).

### Who buys it

- Traffic consultants and transportation engineering firms.
- CCTV integrators who want to add analytics to their deployments.
- AI development agencies building client solutions.
- Parking and traffic solution providers.
- Researchers and universities.
- Developers who need a traffic-analytics foundation instead of starting from zero.
- Companies that want to white-label or resell traffic analytics software.

### What you get

- Complete source code of the application (Next.js + TypeScript + Prisma).
- Docker Compose deployment, native dev path, and `.env.example`.
- Deterministic mock provider — runs end-to-end with zero external dependencies.
- Generic HTTP provider adapter for any vision API.
- Documented extension point for a Python/FastAPI vision worker.
- Prisma schema for SQLite (default) with PostgreSQL support.
- Professional UI (shadcn/ui, Tailwind, Recharts, Framer Motion).
- Zone/Rule editor, dashboard, events timeline, reports.
- Full documentation: Getting Started, Architecture, AI Providers, Deployment, Troubleshooting, Customization, Licensing, Security, Third-Party Licenses.
- Commercial license terms (see [Pricing](#pricing) below).

---

## Feature List

### Input & Ingestion
- MP4 / H.264 video upload.
- Common video formats where FFmpeg can decode them.
- Demo mode with a pre-loaded sample project.
- RTSP camera architecture (data model and UI placeholder; not enabled in V1 by default).
- FFmpeg-based video probing (duration, fps, dimensions, frame count).

### Detection & Analysis
- Vehicle detection (bounding boxes, confidence).
- Classification: car, motorcycle, truck, bus, bicycle.
- Object counting (total and per-class).
- Object tracking with stable IDs across sampled frames.
- Directional movement (8 compass directions + custom labels).
- Virtual line crossing with direction.
- User-defined polygonal zones.
- Traffic volume over time.
- Congestion metric: LOW / MODERATE / HIGH / SEVERE.
- Estimated speed (relative motion indicator — **not certified**).

### Rules Engine
- `COUNT_CROSSING` — count vehicles crossing a virtual line.
- `ZONE_ENTRY` — vehicle enters a zone.
- `ZONE_EXIT` — vehicle exits a zone.
- `STOPPED_VEHICLE` — vehicle dwells beyond a threshold.
- `WRONG_WAY` — vehicle moves against the configured lane direction.
- `CONGESTION` — occupancy in a zone exceeds a threshold.
- `DWELL_TIME` — time-in-zone tracking.

### Output & Reports
- Annotated event snapshots.
- Event list with severity and timestamps.
- Vehicle counts and class breakdown.
- Directional breakdown.
- Time-series charts (Recharts).
- Zone statistics.
- CSV export (counts, events, detections).
- JSON export (full structured run).
- Professional HTML report (self-contained, branded).
- PDF export (where the runtime supports reliable generation; gated by feature flag).

### Dashboard
- Overview with KPIs.
- Projects manager.
- Video analysis workspace.
- Zone/Rule editor.
- Results viewer.
- Events timeline.
- Reports center.
- Settings.
- AI Provider configuration (test connection, switch provider, cost-control knobs).
- Onboarding flow.
- Demo Mode.

### Architecture & Extensibility
- `VisionProvider` interface — pluggable AI layer.
- `mock` provider (deterministic, no key).
- `generic-http` provider adapter (any HTTP vision API).
- `local-inference` extension point (for your Python/FastAPI worker).
- Cost-control knobs: frame rate, max frames, resolution, confidence threshold, retries, timeout.
- Prisma ORM with SQLite (default) and PostgreSQL support.
- Docker Compose deployment.
- Feature flags for opt-in capabilities.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Radix UI, Recharts, Framer Motion, Lucide icons |
| Backend | Next.js Route Handlers (TypeScript) |
| ORM | Prisma 6 |
| Database | SQLite (default), PostgreSQL (optional) |
| AI | Provider-adapter pattern — `mock`, `generic-http`, `local-inference` extension point |
| Packaging | Docker Compose, `.env.example`, Next.js standalone build |
| Runtime | Bun (recommended) or Node.js 20+ |
| Video tooling | FFmpeg (external binary on PATH) |

> Honest note: The original product specification preferred Python/FastAPI for video processing. **V1 implements the entire pipeline in TypeScript with a deterministic mock provider** so the product runs end-to-end with zero external dependencies. The `VisionProvider` interface is structured so a Python/FastAPI vision-worker microservice can be plugged in later without changing application logic. That worker is a documented extension point, **not** a V1 component. Do not purchase expecting a bundled Python/OpenCV service — that is the documented extension path for buyers who need real CV accuracy.

---

## System Requirements

| Component | Minimum | Recommended |
| --- | --- | --- |
| OS | Linux, macOS, Windows (WSL2) | Linux server |
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8 GB+ |
| Disk | 5 GB free | 50 GB+ SSD |
| Runtime | Bun 1.1+ or Node.js 20+ | Bun |
| Video tooling | FFmpeg 6+ | FFmpeg 6+ |
| Browser | Chromium-based, Firefox, Safari (current) | Chromium-based |
| Optional | A vision API key (only if using `generic-http`) | Local GPU worker (only if using `local-inference`) |

---

## What's Included

- Complete TypeScript source code (Next.js App Router + Route Handlers).
- Prisma schema and migrations.
- Default `mock` provider and `generic-http` adapter.
- `local-inference` extension point with documented worker contract.
- Docker Compose configuration.
- `.env.example` with documented variables.
- Sample `Caddyfile` for TLS termination.
- Demo project (sample video, zones, rules).
- Full documentation set (`docs/`).
- Marketing assets (`marketing/`).
- `README.md`, `CHANGELOG.md`, `LICENSE.md`.

## What's Not Included

- **Facial recognition, biometric ID, person re-identification.** Not implemented, not licensed as a capability.
- **Automated enforcement / fines / challans.** Not implemented.
- **Custom neural network training.** Out of scope.
- **Multi-tenant SaaS / billing infrastructure.** Out of scope for V1.
- **Enterprise SSO.** Out of scope for V1.
- **Certified speed measurement.** The estimated-speed feature is a relative motion indicator and must not be used for enforcement.
- **A bundled Python/FastAPI/OpenCV worker.** This is a documented extension point. V1 ships the adapter contract; the worker is the buyer's to implement.
- **A specific commercial AI vendor's SDK.** The product is vendor-neutral. Bring your own API key.

---

## Setup Instructions

### Docker (recommended)

```bash
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`. Try Demo Mode from the sidebar.

### Native (Bun)

```bash
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer
bun install
cp .env.example .env
bun run db:push
bun run dev
```

Full setup details: `docs/GETTING_STARTED.md`.

---

## Screenshots

> Replace these placeholders with screenshots before publishing the listing. Recommended set:

1. **Dashboard Overview** — KPIs and recent projects.
2. **Zone/Rule Editor** — polygonal zones and counting lines drawn over a video frame.
3. **Analysis Workspace** — running pipeline with stage progress.
4. **Events Timeline** — events with severity, timestamps, and snapshot thumbnails.
5. **Charts** — time-series volume, class breakdown, directional flow rose.
6. **HTML Report** — branded, self-contained report opened in a browser.
7. **Settings → AI Provider** — provider dropdown, test connection, cost-control knobs.
8. **Demo Mode** — the pre-loaded sample project.
9. **Onboarding** — first-run setup screen.

Suggested format: 1600×1000 PNG, optimized for web. Place under `marketing/screenshots/`.

---

## Pricing

Prices are launch positioning targets and are configurable in this file. The application does **not** read prices and does **not** enforce tier checks at runtime. There is no license key, no phone-home, no telemetry.

| Tier | Price | Best for | Deployments | Source redistribution | White-label | Support |
| --- | --- | --- | --- | --- | --- | --- |
| **Personal** | $59 | Evaluation, learning, internal experimentation | 1 internal (non-commercial) | Not permitted | No | Community |
| **Commercial** | $199 | One organization in production | 1 commercial deployment | Not permitted | No | Best-effort email (5 BD response) |
| **Agency** | $499 | Agencies delivering to multiple clients | Multiple client projects (delivered as deployed/customized systems) | Not permitted (deliver deployed systems, not raw original source) | Limited (client-facing fork) | Best-effort email (3 BD response) |
| **Extended / Reseller** | $999+ | Resale, broad white-label | Unlimited | Permitted under the reseller schedule | Yes | Priority email (2 BD response) + onboarding call |

See `docs/LICENSING.md` for full tier terms and the root `LICENSE.md` for the binding legal text.

### What you get at each tier

- **Personal ($59):** Full source download, one internal non-commercial instance, mock + generic-http + local-inference extension point, documentation.
- **Commercial ($199):** All of the above, plus one commercial deployment and the right to distribute outputs (reports, exports) produced by your deployment.
- **Agency ($499):** All of the above, plus the right to deliver customized/deployed systems to multiple clients (you deliver deployed systems, not raw original source), and client-facing rebranding for each engagement.
- **Extended / Reseller ($999+):** All of the above, plus the right to redistribute source under your own brand and resell the product, subject to the reseller schedule in `LICENSE.md`.

---

## FAQ

### 1. Is this a SaaS?

No. AI Traffic Analyzer is a **source-code product**. You buy the source, deploy it on your own infrastructure, and own the deployment. There is no recurring fee to the creator and the application does not call the creator's servers.

### 2. Do I need an AI API key to run it?

No. The default `mock` provider is deterministic and runs with zero external dependencies — no API key, no GPU, no Python toolchain. The full pipeline (detection, tracking, zones, events, reports) works end-to-end in mock mode. You only need an API key if you switch to the `generic-http` provider, or if you implement your own local-inference worker.

### 3. Is the AI accuracy real?

In mock mode, **no** — the output is deterministic and synthetic, suitable for demos and UI/UX development. For real-world accuracy, configure the `generic-http` adapter with a real vision API, or implement the documented Python/FastAPI `local-inference` worker (OpenCV, YOLO-class models, etc.). The application pipeline is identical; only the provider changes.

### 4. Why is it TypeScript and not Python?

The product specification preferred Python/FastAPI for video processing because the computer-vision ecosystem is stronger there. V1 implements the entire pipeline in TypeScript with a deterministic mock provider so the product runs end-to-end with **zero external dependencies** and ships as a single Next.js process. The `VisionProvider` interface is structured so a Python/FastAPI vision worker can be plugged in later without changing application logic. That worker is a documented extension point, not a V1 component.

### 5. Can I white-label it?

Yes, under the **Agency** and **Extended/Reseller** tiers. Agency licensees may rebrand client-facing forks per engagement. Extended/Reseller licensees may redistribute source under their own brand subject to the reseller schedule in `LICENSE.md`. See `docs/LICENSING.md` for details.

### 6. Can I use it for enforcement / fines?

**No.** The product does not perform facial recognition, biometric identification, person re-identification, automated enforcement, or fines, and no license tier grants a right to claim otherwise. The estimated-speed feature is a **relative motion indicator**, not a certified measurement, and must not be used for enforcement.

### 7. What database does it use?

SQLite by default (`db/custom.db`) — the application works out of the box after `bun run db:push`. PostgreSQL is supported for production deployments that need concurrent writers or managed backups. See `docs/DEPLOYMENT.md` for the switch procedure.

### 8. Can I run it on my own GPU?

V1 itself does not require or use a GPU. If you need GPU acceleration, deploy your own local-inference worker with GPU access and set `AI_PROVIDER=local-inference`. The worker is your responsibility — see `docs/AI_PROVIDERS.md` §2.3.

### 9. How is the price set? Can I change it?

Prices are marketing metadata in this file (`marketing/PRODUCT_LISTING.md`). The application does **not** read prices and does **not** enforce tier checks at runtime. If you are an Extended/Reseller licensee reselling the product, you set your own prices in your storefront. V1 ships without billing infrastructure; you bring your own.

### 10. What about privacy?

The product is privacy-by-default: no facial recognition, no biometrics, no person re-identification, no enforcement. Snapshots capture vehicle context, not face crops. You are responsible for the legal basis of any video you process and for retention policies. See `docs/SECURITY.md` for the full privacy-by-default notes and hardening checklist.

### 11. What's the support policy?

- **Personal:** Community resources only (if any). No guaranteed response time.
- **Commercial:** Best-effort email support, target first response within 5 business days.
- **Agency:** Best-effort email support, target first response within 3 business days.
- **Extended/Reseller:** Priority email support, target first response within 2 business days, plus one onboarding call if purchased.

Support covers the product **as shipped**. It does not cover your customizations, your AI provider's APIs, your hosting environment, or your data.

### 12. Can I get a refund?

Refunds (if any) are governed by the storefront from which you purchased the license. The product is delivered as digital source code; once the source has been downloaded, some storefronts do not offer refunds. Review the storefront's refund policy before purchasing.

---

## License Explanation (Summary)

AI Traffic Analyzer is **proprietary** software sold under a tiered commercial license. It is **not** MIT, GPL, or open source. The creator retains all intellectual property rights in the original work. You receive a copy of the source under the terms of the tier you purchased, with rights to deploy, customize, and (in higher tiers) redistribute. Full terms: `docs/LICENSING.md` and root `LICENSE.md`.

| Right | Personal | Commercial | Agency | Extended/Reseller |
| --- | --- | --- | --- | --- |
| Read source | Yes | Yes | Yes | Yes |
| Run internally (non-commercial) | 1 instance | Yes | Yes | Yes |
| Run commercially | No | 1 deployment | Multiple client deployments | Unlimited |
| Customize for own use | Yes | Yes | Yes | Yes |
| Distribute outputs (reports, exports) | Internal only | Yes | Yes (to your clients) | Yes |
| Redistribute source | No | No | No (deliver deployed systems only) | Yes (under reseller schedule) |
| White-label / rebrand | No | No | Limited (client-facing fork) | Yes |
| Sublicense as open source | No | No | No | No (without written permission) |

---

## Searchable Keywords

AI traffic analyzer, vehicle counting software, traffic video analysis, vehicle detection source code, CCTV analytics source code, traffic monitoring software, vehicle tracking software, OpenCV traffic analyzer, traffic flow analysis, traffic intelligence platform, traffic counting system, vehicle classification software, road traffic analytics, intersection analysis, self-hosted traffic analytics, traffic report generator, traffic data export, transportation analytics, parking analytics, ITS software, intelligent transportation systems, traffic survey software, traffic volume count, vehicle detection and tracking, computer vision traffic, ANPR alternative, traffic dashboard source code, white-label traffic analytics, source-code traffic product.

---

## Contact

- Storefront: `<your-storefront-url>`
- Support email: `<your-support-email>`
- Security email: `<your-security-email>`
- Documentation: see the `docs/` folder in the repository.
