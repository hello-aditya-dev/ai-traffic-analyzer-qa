# Architecture

This document describes the structure of **AI Traffic Analyzer** at a level useful to developers who want to read, extend, or safely rebrand the product. It is intentionally honest about what V1 implements and what is a documented extension point.

---

## 1. Design Principles

1. **Separation of application logic from AI inference.** Application code never calls a specific vision API directly. It talks to a `VisionProvider` interface. The concrete provider (mock, HTTP, local) is selected by configuration.
2. **Source-code-first.** The full application is TypeScript and ships in the repository. The buyer can read, modify, and rebrand everything.
3. **Runs with zero external dependencies.** The default `mock` provider makes the entire pipeline work without an API key, a GPU, or a Python toolchain.
4. **Pluggable inference.** The provider interface is structured so a Python/FastAPI vision worker (OpenCV, FFmpeg, PyTorch, etc.) can be added later **without changing application logic**. This is a documented extension point, **not** a component shipped in V1.
5. **Deterministic by default.** The mock provider is deterministic so demo runs and screenshots are reproducible.

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                           │
│   Next.js App Router pages, shadcn/ui, Recharts, Framer Motion         │
│   Zone/Rule editor · Dashboard · Reports · Settings · Onboarding        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  HTTPS (same origin)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js Server (Node/Bun)                       │
│   App Router pages + Route Handlers (src/app/api/...)                  │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │                    Application Services                       │    │
│   │  ProjectService · VideoService · AnalysisService              │    │
│   │  ZoneService · RuleService · EventService · ReportService     │    │
│   └───────────────────────────────┬──────────────────────────────┘    │
│                                   │                                     │
│            ┌──────────────────────┴──────────────────────┐            │
│            │            Analysis Pipeline                 │            │
│            │  Ingestion → Frame Sampling → Detection →    │            │
│            │  Tracking → Trajectories → Zone/Line Logic → │            │
│            │  Event Engine → Aggregation → Storage →      │            │
│            │  Report Generation                           │            │
│            └──────────────────────┬──────────────────────┘            │
│                                   │                                     │
│                                   ▼                                     │
│            ┌──────────────────────────────────────────────┐           │
│            │         VisionProvider (interface)            │           │
│            │  detectObjects · classifyObjects ·            │           │
│            │  analyzeFrame · processSequence · healthCheck │           │
│            └──────────────────────┬──────────────────────┘           │
│                                   │                                     │
│         ┌─────────────────────────┼─────────────────────────┐         │
│         ▼                         ▼                         ▼         │
│   ┌────────────┐          ┌────────────────┐      ┌──────────────┐   │
│   │   mock     │          │  generic-http  │      │ local-       │   │
│   │ (determin- │          │ (any HTTP API  │      │ inference    │   │
│   │  istic)    │          │  returning the │      │ (extension   │   │
│   │            │          │  expected DTO) │      │  point)      │   │
│   └────────────┘          └────────────────┘      └──────┬───────┘   │
│                                                          │           │
│                                          Extension point │           │
│                                       (Python/FastAPI +  │           │
│                                       OpenCV worker —   │           │
│                                       NOT shipped in V1)│           │
│                                                          ▼           │
│                                                (your inference      │
│                                                 service)            │
└─────────────────────────────────────────────────────────────────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────────┐              ┌────────────────────────┐
│   Prisma ORM     │              │   Filesystem storage    │
│   (SQLite or     │              │   storage/projects/...  │
│    PostgreSQL)   │              │   videos · analysis ·   │
│                  │              │   snapshots · reports ·  │
└──────────────────┘              │   exports · clips        │
                                  └────────────────────────┘
```

---

## 3. Technology Stack (as actually shipped in V1)

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 | Single deployable Next.js app |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI primitives, Framer Motion, Recharts, Lucide icons | |
| State / data fetching | @tanstack/react-query, zustand, react-hook-form + Zod | |
| Backend | Next.js Route Handlers (TypeScript) | Same process as frontend |
| ORM | Prisma 6 | Schema-first migrations |
| Database | SQLite (default), PostgreSQL (optional) | SQLite file at `db/custom.db` |
| AI inference | `mock` provider (deterministic), `generic-http` provider (any HTTP API), `local-inference` extension point | Python/FastAPI worker is a documented extension point, **not** shipped |
| Video tooling | FFmpeg (external binary on PATH) | Used for probe + frame extraction |
| Packaging | Docker Compose, `.env.example`, Next.js standalone output | |

> Honesty note: The product specification preferred a Python/FastAPI service for video processing because the computer-vision ecosystem is stronger there. **V1 implements the entire pipeline in TypeScript with a deterministic mock provider** so the product runs end-to-end with no external dependencies. The `VisionProvider` interface is structured so a Python/FastAPI vision-worker microservice can be plugged in later **without changes to application logic**. That worker is an extension point documented in [AI_PROVIDERS.md](./AI_PROVIDERS.md), not a V1 component.

---

## 4. The Provider Adapter Pattern

The single most important architectural decision: **application code never imports a concrete AI provider**. It imports the `VisionProvider` interface and receives whichever provider is configured.

### 4.1 The `VisionProvider` interface

```ts
// Conceptual shape (see src/providers/types.ts in the repository)
export interface Detection {
  objectId: string;
  objectType: VehicleClass;            // car | motorcycle | truck | bus | bicycle
  confidence: number;                  // 0..1
  bbox: { x: number; y: number; width: number; height: number }; // normalized 0..1
}

export interface FrameAnalysis {
  frameIndex: number;
  timestamp: number;                   // seconds
  detections: Detection[];
}

export interface SequenceResult {
  frames: FrameAnalysis[];
  tracks: TrackSummary[];
  metadata: { provider: string; model?: string; durationMs: number };
}

export interface VisionProvider {
  readonly name: string;
  detectObjects(frame: FrameInput): Promise<Detection[]>;
  classifyObjects(detections: Detection[], frame?: FrameInput): Promise<Detection[]>;
  analyzeFrame(frame: FrameInput): Promise<FrameAnalysis>;
  processSequence(frames: FrameInput[], options?: SequenceOptions): Promise<SequenceResult>;
  healthCheck(): Promise<{ ok: boolean; latencyMs?: number; detail?: string }>;
}
```

### 4.2 Why this matters commercially

- **Buyer independence.** Buyers can swap providers without forking application logic.
- **Demoability.** The `mock` provider makes the product fully functional with no key and no GPU.
- **Future-proofing.** A Python/FastAPI worker can be wrapped behind a `local-inference` adapter that satisfies the same interface. Application code does not change.
- **Testability.** Deterministic mock output makes UI/UX and report development reproducible.

### 4.3 Provider directory layout

```text
src/providers/
  types.ts                  # VisionProvider interface, DTOs
  registry.ts               # Provider registry / factory
  mock/
    index.ts                # Deterministic mock implementation
    fixtures.ts             # Sample detection patterns, trajectories
  generic-http/
    index.ts                # Configurable HTTP API adapter
    client.ts              # Fetch wrapper, retries, timeouts
  local-inference/
    index.ts                # Extension-point adapter (calls a local worker)
    README.md               # How to implement the worker
```

See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for configuration and how to add a new adapter.

---

## 5. Analysis Pipeline

A single analysis run flows through these stages. Each stage is independently testable and writes structured records to the database.

```text
1. INGESTION
   Video uploaded → validated → probed (FFmpeg) → metadata stored
   (duration, width, height, fps, frameCount)
        │
        ▼
2. FRAME SAMPLING
   Pick frames at the configured frame rate (e.g. 2 fps)
   Apply resolution + max-frames limits (cost control)
        │
        ▼
3. OBJECT DETECTION          ── VisionProvider.detectObjects / analyzeFrame
   Per-frame bounding boxes + class + confidence
        │
        ▼
4. TRACKING                  ── Application-side tracker (IoU/centroid)
   Per-object track IDs across sampled frames
        │
        ▼
5. TRAJECTORY BUILDING
   Smoothed positions, direction vector, estimated speed (NOT certified),
   entry/exit points
        │
        ▼
6. ZONE / LINE LOGIC
   Point-in-polygon tests against user zones
   Line-crossing tests against virtual counting lines (with direction)
        │
        ▼
7. EVENT ENGINE
   Rules (COUNT_CROSSING, ZONE_ENTRY, ZONE_EXIT, STOPPED_VEHICLE,
   WRONG_WAY, CONGESTION, DWELL_TIME) evaluated against trajectories
   Produces Event records with severity + snapshot references
        │
        ▼
8. AGGREGATION
   Time-series volume, class breakdown, directional flow (8 compass + custom),
   zone statistics, congestion metric (LOW/MODERATE/HIGH/SEVERE)
        │
        ▼
9. RESULT STORAGE
   Persist Detection, Track, Event rows (Prisma)
   Persist snapshot frames under storage/projects/<id>/snapshots/
        │
        ▼
10. REPORT GENERATION
    HTML, CSV, JSON exports written under storage/projects/<id>/reports/
    PDF where the environment supports reliable generation
        │
        ▼
11. UI
    Dashboard re-renders from persisted data (Recharts, tables, timeline)
```

> Estimated speed is **not** certified and must not be used for enforcement. It is a relative motion indicator derived from frame displacement, frame rate, and an assumed (configurable) pixels-per-meter scale.

---

## 6. File Storage Hierarchy

All video, snapshot, and report artifacts live under a single configurable root.

```text
<storage-root>/                     # VIDEO_STORAGE_PATH / OUTPUT_STORAGE_PATH
  projects/
    <project-id>/
      videos/
        <video-id>.mp4              # Original uploaded source video
      analysis/
        <analysis-id>/
          frames/                   # Sampled frames (transient, optional)
          detections.json           # Raw per-frame detection dump
          tracks.json               # Track summaries
      snapshots/
        <event-id>.jpg              # Snapshot for an Event
      clips/
        <event-id>.mp4              # Optional clip export around an event
      reports/
        <report-id>.html
        <report-id>.csv
        <report-id>.json
        <report-id>.pdf             # Where supported
      exports/
        <export-id>.csv             # Raw structured exports (counts, events)
```

- Paths are normalized and stored relative to the storage root in the DB.
- Filenames are sanitized (see [SECURITY.md](./SECURITY.md)).
- In Docker, the storage root is a bind-mounted volume so data persists.

---

## 7. Database

V1 uses SQLite by default (`db/custom.db`). The schema is defined in `prisma/schema.prisma` and includes:

- `Project` — top-level grouping (name, description, location).
- `VideoAsset` — uploaded video metadata (filename, path, duration, fps, dimensions, status).
- `AnalysisRun` — a single analysis run against a video (provider, status, timing, config JSON).
- `Detection` — per-frame object detections.
- `Track` — aggregated object tracks (direction, estimated speed).
- `Zone` — user-defined polygons (normalized coordinates, type, color).
- `Rule` — enabled rule types and parameters per project.
- `Event` — events emitted by the rule engine (type, severity, timestamp, snapshot ref).
- `Report` — generated report metadata (format, path, title, author, company).
- `Camera` — RTSP camera configuration (architecture for future live streams).
- `ProviderConfig` — runtime provider settings (API URL, key, model, frame rate, confidence, max frames, resolution, timeout, retries).

PostgreSQL is supported by changing the Prisma datasource provider and `DATABASE_URL`. See [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 8. Frontend (App Router) Layout

```text
src/app/
  layout.tsx                  # Root layout, theme provider, toaster
  page.tsx                    # Dashboard / landing
  (dashboard)/
    projects/[id]/page.tsx
    projects/[id]/zones/page.tsx
    projects/[id]/rules/page.tsx
    projects/[id]/analysis/[runId]/page.tsx
    projects/[id]/events/page.tsx
    projects/[id]/reports/page.tsx
  settings/
    providers/page.tsx
    general/page.tsx
  onboarding/page.tsx
  api/
    projects/...
    videos/.../route.ts
    analysis/.../route.ts
    reports/.../route.ts
    providers/.../route.ts
```

UI components are shadcn/ui primitives under `src/components/ui/` and product components under `src/components/`. Charts use Recharts. Motion uses Framer Motion sparingly (page transitions, dashboard tiles).

---

## 9. Configuration Surface

The application reads configuration from three places, in order of precedence:

1. **Environment variables** (`.env`) — provider, storage paths, DB URL, upload limits, defaults. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full table.
2. **`src/lib/brand.ts`** — branding constants (product name, logo, colors, navigation labels). See [CUSTOMIZATION.md](./CUSTOMIZATION.md).
3. **Database `ProviderConfig` row** — runtime provider settings editable from the UI (Settings → AI Provider). The UI form writes here; the API reads from here, falling back to env vars.

---

## 10. Extension Points (what you can safely extend)

| Extension point | Where | How |
| --- | --- | --- |
| New AI provider | `src/providers/<name>/` | Implement `VisionProvider`, register in `registry.ts` |
| New rule type | Rule engine module | Add to the rule union, implement the evaluator |
| New export format | Report service | Add a generator + register the MIME type |
| New chart / widget | Dashboard tiles | Add a tile component, register in the dashboard config |
| Real CV inference | `services/vision-worker/` (new) | Implement a Python/FastAPI worker that fulfills the `local-inference` adapter contract |

### 10.1 The Python/FastAPI vision worker (extension point, not shipped)

V1 does not include a Python service. To add one:

1. Create a `services/vision-worker/` directory with a FastAPI app.
2. Expose endpoints that accept a frame (or batch) and return the DTOs defined in `src/providers/types.ts` (detections, tracks).
3. Use OpenCV + FFmpeg + your chosen model (e.g. YOLO-class) server-side.
4. Set `AI_PROVIDER=local-inference` and `AI_API_BASE_URL=http://vision-worker:8000` in `.env`.
5. The `local-inference` adapter forwards requests; application logic is unchanged.

This is the documented path for buyers who need real computer-vision accuracy. It is intentionally out of scope for V1 so that V1 ships with zero Python dependencies and runs anywhere Node/Bun + FFmpeg run.

---

## 11. Cross-References

- [GETTING_STARTED.md](./GETTING_STARTED.md) — install and first run.
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — provider configuration and adapter authoring.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment, PostgreSQL, volumes, backups.
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — branding, defaults, navigation, feature flags.
- [SECURITY.md](./SECURITY.md) — hardening checklist.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common issues.
