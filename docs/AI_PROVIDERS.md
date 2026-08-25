# AI Providers

AI Traffic Analyzer uses a **provider-adapter architecture**. The application never calls a specific vision API directly — it talks to a `VisionProvider` interface. The concrete provider is selected by configuration. This makes the product runnable with zero external dependencies (the `mock` provider) while remaining open to real vision APIs and local inference services.

This document covers:

1. The `VisionProvider` interface.
2. The built-in providers: `mock`, `generic-http`, and the `local-inference` extension point.
3. Configuration via environment variables and the runtime `ProviderConfig` table.
4. Cost-control knobs.
5. Security rules for API keys.
6. How to author and register a new provider adapter.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the higher-level pipeline and [DEPLOYMENT.md](./DEPLOYMENT.md) for the full environment variable reference.

---

## 1. The `VisionProvider` Interface

Every provider implements this interface (defined in `src/providers/types.ts`):

```ts
export type VehicleClass = 'car' | 'motorcycle' | 'truck' | 'bus' | 'bicycle';

export interface Detection {
  objectId: string;
  objectType: VehicleClass;
  confidence: number;                  // 0..1
  bbox: {
    x: number; y: number;              // top-left, normalized 0..1
    width: number; height: number;    // normalized 0..1
  };
}

export interface FrameInput {
  frameIndex: number;
  timestamp: number;                    // seconds from video start
  width: number; height: number;
  // Either an in-memory buffer or a path to an extracted frame file.
  buffer?: Buffer;
  path?: string;
}

export interface FrameAnalysis {
  frameIndex: number;
  timestamp: number;
  detections: Detection[];
}

export interface TrackSummary {
  trackId: string;
  objectType: VehicleClass;
  firstSeen: number; lastSeen: number;
  averageConfidence: number;
  start: { x: number; y: number };
  end:   { x: number; y: number };
  direction: string;                   // compass label or custom label
}

export interface SequenceOptions {
  frameRate?: number;                  // sample frames per second
  maxFrames?: number;                  // hard cap on frames sent
  resolution?: '480p' | '720p' | '1080p';
  confidenceThreshold?: number;       // 0..1
}

export interface SequenceResult {
  frames: FrameAnalysis[];
  tracks: TrackSummary[];
  metadata: {
    provider: string;
    model?: string;
    durationMs: number;
    framesProcessed: number;
  };
}

export interface HealthStatus {
  ok: boolean;
  latencyMs?: number;
  detail?: string;
}

export interface VisionProvider {
  readonly name: string;
  detectObjects(frame: FrameInput): Promise<Detection[]>;
  classifyObjects(detections: Detection[], frame?: FrameInput): Promise<Detection[]>;
  analyzeFrame(frame: FrameInput): Promise<FrameAnalysis>;
  processSequence(frames: FrameInput[], options?: SequenceOptions): Promise<SequenceResult>;
  healthCheck(): Promise<HealthStatus>;
}
```

The application pipeline calls `processSequence` (or `analyzeFrame` for single-frame use) and treats the result as opaque structured data. The provider is free to:

- compute detections locally (mock, future local-inference adapter),
- call an external HTTP API (generic-http),
- proxy to a Python worker that wraps OpenCV/YOLO/etc. (local-inference extension point).

---

## 2. Built-In Providers

### 2.1 `mock` — deterministic, no API key (default)

The default provider. Returns deterministic, repeatable detections derived from the video's duration and dimensions using fixed fixtures and a stable pseudo-random function. Designed for:

- First-run / demo / screenshot workflows.
- UI/UX and report development without external dependencies.
- Reproducible test runs.
- Sales demos where the goal is to show the *product*, not the *accuracy* of a particular model.

| Property | Value |
| --- | --- |
| Requires API key | No |
| Requires network | No |
| Requires GPU | No |
| Output accuracy | Synthetic; **not** real-world accurate |
| Reproducible | Yes, given the same video and same options |

Configuration: none required. Selected automatically when `AI_PROVIDER` is unset or `mock`.

### 2.2 `generic-http` — any HTTP vision API

A configurable HTTP adapter. Use this when you have an existing vision API (proprietary or commercial) that accepts a frame and returns detections in a structured response.

The adapter:

- POSTs a frame (as multipart or base64 JSON, configurable) to `AI_API_BASE_URL`.
- Sends the API key as `Authorization: Bearer <AI_API_KEY>` (header name configurable).
- Expects a response matching a configurable response schema (default: the DTO shape in §1).
- Applies retries (`ProviderConfig.retries`) and timeout (`ProviderConfig.timeout`).
- Respects `frameRate`, `maxFrames`, `resolution`, and `confidenceThreshold` cost-control knobs.

Configuration:

```env
AI_PROVIDER=generic-http
AI_API_BASE_URL=https://your-vision-api.example.com/v1/detect
AI_API_KEY=sk-your-key-here
AI_MODEL=your-model-id
```

If your API's response shape differs from the default DTO, you have two options:

1. Map it server-side inside a custom adapter (see §6).
2. Use the request/response schema mapping fields in `ProviderConfig` (added by a thin custom adapter).

The generic adapter deliberately avoids embedding any specific commercial provider's SDK. That keeps the product license-clean and lets buyers switch providers without code changes when the DTO is compatible.

### 2.3 `local-inference` — extension point (not shipped in V1)

A documented extension point for buyers who want real computer-vision accuracy without depending on an external API. The intended pattern:

1. Buyer writes a Python/FastAPI service (with OpenCV, FFmpeg, and a model of their choice, e.g. a YOLO-class detector).
2. The service exposes endpoints that accept frames (or frame paths) and return the DTOs in §1.
3. Buyer sets `AI_PROVIDER=local-inference` and `AI_API_BASE_URL=http://localhost:8001` (or a Docker network hostname).
4. The `local-inference` adapter forwards requests to that service.

> This is an **extension point**, not a V1 component. V1 ships only `mock` and `generic-http` adapters. The `src/providers/local-inference/` folder contains a `README.md` describing the contract the worker must satisfy and a thin stub adapter; the actual Python worker is out of scope and intentionally not bundled, so V1 has zero Python dependencies.

---

## 3. Configuration

Provider configuration is read in this order:

1. Environment variables (`.env`).
2. Runtime `ProviderConfig` table row (editable from **Settings → AI Provider**). The UI form writes here. If a field is empty, the API falls back to the env var.

### 3.1 Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | `mock` | Selects the provider adapter: `mock`, `generic-http`, `local-inference` |
| `AI_API_BASE_URL` | _empty_ | Base URL for `generic-http` / `local-inference` adapters |
| `AI_API_KEY` | _empty_ | API key / bearer token sent to the provider |
| `AI_MODEL` | _empty_ | Model identifier passed to the provider (provider-specific) |

Additional cost-control defaults are stored in the `ProviderConfig` table (`frameRate`, `maxFrames`, `resolution`, `confidence`, `timeout`, `retries`) and are editable from the UI. See §4.

### 3.2 Runtime configuration (UI)

Open **Settings → AI Provider** to:

- See the active provider and its health status.
- Change `apiUrl`, `apiKey`, `model`, `timeout`, `retries`.
- Change cost-control defaults (`frameRate`, `maxFrames`, `resolution`, `confidence`).
- Run **Test connection** (`healthCheck()`).
- Mask / reveal the API key (it is masked by default in the UI; see §5).

Changes are saved to the `ProviderConfig` table and take effect on the next analysis run.

---

## 4. Cost-Control Knobs

Because vision API calls are usually billed per frame (and add latency), the pipeline exposes several knobs to control cost and throughput. All are stored in `ProviderConfig` and editable from the UI.

| Knob | Default | Effect |
| --- | --- | --- |
| `frameRate` | `2` | Frames sampled per second of video. Lower = cheaper, less smooth trajectories. |
| `maxFrames` | `5000` | Hard cap on the total number of frames sent to the provider in one run. |
| `resolution` | `720p` | Resolution at which frames are extracted and sent. `480p` reduces token/payload size. |
| `confidence` | `0.5` | Detections below this confidence are dropped before storage. |
| `timeout` | `30` (seconds) | Per-request timeout to the provider. |
| `retries` | `3` | Retry attempts on transient failures (with exponential backoff). |

These knobs are applied **before** frames reach the provider, so they reduce both cost and processing time. They do not change the provider's internal behavior.

Example: a 10-minute video at 2 fps = 1,200 frames. At 5 fps it would be 3,000 frames. Capping `maxFrames=2000` ensures the run stops at 2,000 frames regardless.

---

## 5. Security: Handling API Keys

API keys are credentials. The product enforces the following rules:

- **API keys are never exposed to the browser.** Provider configuration forms render only a masked preview (e.g. `sk-…ab12`). The full key is read server-side only.
- **API keys are never logged.** Logs redact `AI_API_KEY`, `apiKey`, and the `Authorization` header.
- **API keys are not committed.** `.env` is git-ignored. `.env.example` contains placeholders only.
- **API keys are stored in the `ProviderConfig` row** at the database level. For higher-security deployments, prefer reading the key from the environment (`AI_API_KEY`) and leaving the database field empty, so the secret never touches the database file.
- **Outbound requests use HTTPS only.** The `generic-http` adapter warns if `AI_API_BASE_URL` is `http://` (insecure) and refuses to send the key over plain HTTP unless explicitly allowed via `ALLOW_INSECURE_PROVIDER_HTTP=true` (dev only).

See [SECURITY.md](./SECURITY.md) for the full hardening checklist.

---

## 6. Adding a New Provider Adapter

To add a new provider (e.g. `my-vendor`):

### Step 1 — Create the adapter folder

```text
src/providers/my-vendor/
  index.ts        # Implements VisionProvider
  client.ts       # HTTP client, auth, retries (if applicable)
  README.md        # Vendor-specific notes, model list, limits
```

### Step 2 — Implement the interface

```ts
// src/providers/my-vendor/index.ts
import type {
  VisionProvider, FrameInput, FrameAnalysis,
  SequenceResult, SequenceOptions, HealthStatus, Detection
} from '../types';

export class MyVendorProvider implements VisionProvider {
  readonly name = 'my-vendor';

  constructor(private cfg: { apiUrl: string; apiKey: string; model: string }) {}

  async detectObjects(frame: FrameInput): Promise<Detection[]> {
    // ... call your vendor's API, map to Detection[]
  }

  async classifyObjects(detections: Detection[], frame?: FrameInput): Promise<Detection[]> {
    // ... if your vendor splits detection and classification
  }

  async analyzeFrame(frame: FrameInput): Promise<FrameAnalysis> {
    const detections = await this.detectObjects(frame);
    return { frameIndex: frame.frameIndex, timestamp: frame.timestamp, detections };
  }

  async processSequence(frames: FrameInput[], options?: SequenceOptions): Promise<SequenceResult> {
    // ... loop analyzeFrame, then run the app-side tracker, return SequenceResult
  }

  async healthCheck(): Promise<HealthStatus> {
    // ... ping /auth or /models endpoint
  }
}
```

### Step 3 — Register it

In `src/providers/registry.ts`:

```ts
import { MyVendorProvider } from './my-vendor';

export function getProvider(cfg: ProviderConfig): VisionProvider {
  switch (cfg.provider) {
    case 'mock':           return new MockProvider();
    case 'generic-http':   return new GenericHttpProvider(cfg);
    case 'local-inference':return new LocalInferenceProvider(cfg);
    case 'my-vendor':      return new MyVendorProvider(cfg);
    default:               return new MockProvider();
  }
}
```

### Step 4 — Add to the UI

Add `my-vendor` to the provider dropdown in **Settings → AI Provider** (`src/app/settings/providers/page.tsx` and the related form schema in `src/components/settings/provider-form.tsx`).

### Step 5 — Document it

Add a row in this file's "Built-In Providers" section (or a separate `docs/providers/my-vendor.md`) describing vendor-specific gotchas, rate limits, and recommended cost-control defaults.

---

## 7. Provider Selection Guidance

| Scenario | Recommended provider |
| --- | --- |
| First run, demo, screenshot, no API key | `mock` |
| Sales demo with a specific customer's real video, no key | `mock` (clearly labeled as demo) |
| Real accuracy, already have a vision API | `generic-http` |
| Real accuracy, on-prem, no external API | `local-inference` (requires the buyer to deploy a Python/FastAPI worker — extension point) |
| Air-gapped / sensitive environment | `mock` for the product UI, `local-inference` for real data |

---

## 8. Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — pipeline and provider directory layout.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — environment variables, volumes, PostgreSQL.
- [SECURITY.md](./SECURITY.md) — API key handling, redaction, header security.
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) — feature flags and provider defaults.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — provider connectivity, 401/403, timeouts.
