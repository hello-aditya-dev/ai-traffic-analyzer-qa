/**
 * VisionProvider — the abstraction layer between application logic and AI.
 *
 * Application code MUST NEVER call a specific AI provider directly.
 * It always goes through this interface, so analysis results can come from:
 *   - an external AI API (generic-http)
 *   - a local inference server (local-inference)
 *   - the deterministic mock provider (mock) — for demos & tests
 *
 * To add a new provider: create a folder under `src/providers/<name>/`,
 * implement this interface, and register it in `src/providers/registry.ts`.
 */
import type { AnalysisResult, Detection, VehicleTrack } from "@/lib/types";

export interface ProviderHealth {
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
}

export interface AnalyzeOptions {
  videoId: string;
  durationSec: number;
  fps: number;
  width: number;
  height: number;
  frameRate: number; // analysis sample rate (FPS)
  confidence: number; // 0..1
  maxFrames: number;
  zones: { id: string; name: string; polygon: { x: number; y: number }[] }[];
  lines: {
    id: string;
    name: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    inboundLabel: string;
    outboundLabel: string;
    classes: string[];
  }[];
  rules: { id: string; type: string; enabled: boolean; parameters: Record<string, unknown> }[];
  onProgress?: (pct: number, stage: string) => void;
  signal?: { cancelled: boolean };
}

export interface VisionProvider {
  readonly name: string;
  /** Detect objects frame-by-frame. */
  detectObjects(opts: AnalyzeOptions): Promise<Detection[]>;
  /** Classify objects (usually fused with detection). */
  classifyObjects(detections: Detection[]): Promise<Detection[]>;
  /** Analyze a single sampled frame. */
  analyzeFrame(frameIndex: number, opts: AnalyzeOptions): Promise<Detection[]>;
  /** Run the full sequence and return tracks + final result scaffolding. */
  processSequence(opts: AnalyzeOptions): Promise<{
    detections: Detection[];
    tracks: VehicleTrack[];
  }>;
  /** Connectivity / configuration health check. */
  healthCheck(): Promise<ProviderHealth>;
}

export type { AnalysisResult };
