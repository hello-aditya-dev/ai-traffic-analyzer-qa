# AI Traffic Analyzer

[![Version](https://img.shields.io/badge/version-1.0.0-0f766e)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Proprietary-cc2222)](./LICENSE.md)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%2B%20TS%20%2B%20Prisma-0ea5e9)](./docs/ARCHITECTURE.md)
[![Provider](https://img.shields.io/badge/AI%20provider-mock%20%2F%20generic--http%20%2F%20extensible-9333ea)](./docs/AI_PROVIDERS.md)
[![Runs with zero API keys](https://img.shields.io/badge/runs%20with-zero%20API%20keys-16a34a)](./docs/GETTING_STARTED.md)

**AI Traffic Analyzer** is a self-hosted, source-code-first product that converts traffic and road video into structured traffic intelligence: vehicle counts, classifications, tracking, directional flow, zone analytics, line crossings, configurable events, and professional reports.

It is sold as **full source code**, not as a SaaS. You deploy it on your own infrastructure, customize it, and own the deployment end to end.

> Repository codename: `traffic-ai-analyzer` · Initial version: `1.0.0`

---

## What is this?

A Next.js + TypeScript application (single deployable process) that takes traffic video, runs it through a structured analysis pipeline, and produces counts, classifications, tracks, events, charts, and professional reports.

It ships with a deterministic **mock AI provider** that makes the entire pipeline run end-to-end with **zero external API keys** — useful for demos, screenshots, UI/UX development, and sales conversations. It also ships with a `generic-http` adapter (any vision API) and a documented `local-inference` extension point for a Python/FastAPI vision worker.

## Who is it for?

- Traffic consultants and transportation engineering firms
- CCTV integrators who want to add analytics to their deployments
- AI development agencies building client solutions
- Parking and traffic solution providers
- Researchers and universities
- Developers who need a traffic-analytics foundation instead of starting from zero
- Companies that want to white-label or resell traffic analytics software

## What does it do?

- **Detection & classification:** car, motorcycle, truck, bus, bicycle.
- **Counting & tracking:** total and per-class counts, stable track IDs across frames.
- **Directional flow:** 8 compass directions plus custom labels.
- **Virtual line crossings:** with direction.
- **Polygonal zones:** entries, exits, dwell, peak occupancy.
- **Rules engine:** `COUNT_CROSSING`, `ZONE_ENTRY`, `ZONE_EXIT`, `STOPPED_VEHICLE`, `WRONG_WAY`, `CONGESTION`, `DWELL_TIME`.
- **Events timeline:** with severity and snapshot frames.
- **Congestion metric:** LOW / MODERATE / HIGH / SEVERE.
- **Estimated speed:** relative motion indicator (not certified).
- **Reports:** CSV, JSON, professional HTML, PDF where supported.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Radix UI, Recharts, Framer Motion, Lucide |
| Backend | Next.js Route Handlers (TypeScript) |
| ORM | Prisma 6 |
| Database | SQLite (default), PostgreSQL (optional) |
| AI | Provider-adapter pattern — `mock`, `generic-http`, `local-inference` extension point |
| Packaging | Docker Compose, `.env.example`, Next.js standalone build |
| Runtime | Bun (recommended) or Node.js 20+ |
| Video tooling | FFmpeg (external binary on PATH) |

> **Honest note on Python.** The product specification preferred Python/FastAPI for video processing. V1 implements the entire pipeline in TypeScript with a deterministic mock provider so the product runs end-to-end with zero external dependencies. The `VisionProvider` interface is structured so a Python/FastAPI vision-worker microservice can be plugged in later **without changing application logic** — that is a documented extension point, not a V1 component. See [docs/AI_PROVIDERS.md](./docs/AI_PROVIDERS.md).

---

## Quick start

### Docker (recommended)

```bash
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000` and click **Demo Mode** in the sidebar.

### Native (Bun)

```bash
git clone <your-repo-url> traffic-ai-analyzer
cd traffic-ai-analyzer
bun install
cp .env.example .env
bun run db:push
bun run dev
```

### Native (npm)

```bash
npm install
npm run db:push
npm run dev
```

> FFmpeg must be on your `PATH`. See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) if video probing fails.

---

## Demo Mode

No video upload required. The product ships with a **demo project** containing a sample video, pre-defined zones, a counting line, and a default ruleset. From the sidebar, choose **Demo Mode**, click **Run Analysis**, and explore the dashboard, events timeline, charts, and reports. Demo Mode uses the deterministic `mock` provider, so output is repeatable — ideal for screenshots and sales demos.

> Mock output is synthetic. Do not use it for operational decisions about real-world traffic. Switch to a real provider (`generic-http` or `local-inference`) for real-world accuracy.

---

## Features

- **Input:** MP4/H.264 upload, demo mode, optional RTSP camera architecture.
- **Detection & analysis:** vehicle detection, classification (5 classes), counting, tracking, directional flow, line crossings, polygonal zones, time-series volume, congestion metric, stopped-vehicle / wrong-way / dwell events, estimated speed.
- **Rules engine:** seven configurable rule types with parameters.
- **Output:** event snapshots, events timeline, counts, class breakdown, directional breakdown, time-series charts, zone statistics, CSV/JSON/HTML/PDF exports.
- **Dashboard:** overview, projects, video analysis workspace, zone/rule editor, results, events, reports, settings, AI provider config, onboarding, demo mode.
- **Architecture:** `VisionProvider` interface, `mock` / `generic-http` / `local-inference` adapters, Prisma + SQLite/PostgreSQL, Docker Compose, feature flags.
- **Security:** API keys server-side only and masked in UI, filename sanitization, path-traversal protection, FFmpeg invoked without a shell, no logging of secrets, privacy-by-default (no facial recognition, no biometrics, no enforcement).

See [marketing/PRODUCT_LISTING.md](./marketing/PRODUCT_LISTING.md) for the full feature list and storefront copy.

---

## Screenshots

> Replace these placeholders with actual screenshots before publishing.

| | | |
| --- | --- | --- |
| ![Dashboard](./marketing/screenshots/dashboard.png) | ![Zone editor](./marketing/screenshots/zone-editor.png) | ![Analysis](./marketing/screenshots/analysis.png) |
| ![Events](./marketing/screenshots/events.png) | ![Charts](./marketing/screenshots/charts.png) | ![HTML report](./marketing/screenshots/report.png) |

---

## Documentation

| Document | Purpose |
| --- | --- |
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | System requirements, install, first run, demo walkthrough |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | High-level architecture, pipeline, provider model, storage hierarchy |
| [docs/AI_PROVIDERS.md](./docs/AI_PROVIDERS.md) | Provider interface, mock / generic-http / local-inference, cost-control, security, adding adapters |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Docker, native, env vars, volumes, PostgreSQL, backups |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Codecs, FFmpeg, provider connectivity, Docker, permissions, DB locked, ports |
| [docs/CUSTOMIZATION.md](./docs/CUSTOMIZATION.md) | Branding, defaults, navigation, feature flags — concrete file paths |
| [docs/LICENSING.md](./docs/LICENSING.md) | License tiers and what each permits |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security checklist and privacy-by-default notes |
| [docs/THIRD_PARTY_LICENSES.md](./docs/THIRD_PARTY_LICENSES.md) | Dependency licenses and redistribution notes |

---

## Commercial use

This is a **source-code product**, not open source. Commercial use requires a license. See:

- [marketing/PRODUCT_LISTING.md](./marketing/PRODUCT_LISTING.md) — pricing, tiers, FAQ, storefront copy.
- [docs/LICENSING.md](./docs/LICENSING.md) — tier definitions.
- [LICENSE.md](./LICENSE.md) — binding legal text.

Launch pricing (positioning targets, configurable in `marketing/PRODUCT_LISTING.md`):

| Tier | Price | Best for |
| --- | --- | --- |
| Personal | $59 | Evaluation, learning, internal experimentation |
| Commercial | $199 | One organization in production |
| Agency | $499 | Agencies delivering to multiple clients |
| Extended / Reseller | $999+ | Resale, broad white-label |

The application does **not** read prices and does **not** enforce tier checks at runtime. There is no license key, no phone-home, no telemetry.

---

## Not included in V1

To keep the scope of V1 honest and shippable:

- Facial recognition, biometric ID, person re-identification — not implemented, not licensed as a capability.
- Automated enforcement / fines / challans — not implemented.
- Custom neural network training — out of scope.
- Multi-tenant SaaS / billing infrastructure — out of scope.
- Enterprise SSO — out of scope.
- Certified speed measurement — the estimated-speed feature is a relative motion indicator and must not be used for enforcement.
- A bundled Python/FastAPI/OpenCV worker — documented extension point, not a V1 component.

---

## License

Proprietary. See [LICENSE.md](./LICENSE.md) for the full text and [docs/LICENSING.md](./docs/LICENSING.md) for tier explanations. Bundled third-party dependencies retain their original licenses — see [docs/THIRD_PARTY_LICENSES.md](./docs/THIRD_PARTY_LICENSES.md).

---

## Project status

Initial release: **v1.0.0**. See [CHANGELOG.md](./CHANGELOG.md).
