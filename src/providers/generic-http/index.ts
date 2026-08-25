/**
 * Generic HTTP Vision Provider.
 *
 * Adapter for any external AI/vision API that accepts a frame (image bytes
 * or base64) and returns detection boxes. The exact request/response shape is
 * controlled by configuration — base URL, API key, model, timeout, retries.
 *
 * Secrets (AI_API_KEY) are read server-side only and NEVER shipped to the
 * client. This adapter is a ready-to-customize scaffold: buyers wiring a
 * specific commercial provider implement `mapResponse()` for their vendor.
 */
import { config } from "@/lib/config";
import type { Detection, VehicleClass } from "@/lib/types";
import type { AnalyzeOptions, ProviderHealth, VisionProvider } from "@/providers/vision-provider";

const CLASS_MAP: Record<string, VehicleClass> = {
  car: "car", automobile: "car", vehicle: "car",
  motorcycle: "motorcycle", motorbike: "motorcycle",
  truck: "truck", lorry: "truck",
  bus: "bus",
  bicycle: "bicycle", bike: "bicycle",
  van: "van",
};

export class GenericHttpProvider implements VisionProvider {
  readonly name = "generic-http";

  async healthCheck(): Promise<ProviderHealth> {
    if (!config.aiApiBaseUrl) {
      return { ok: false, provider: this.name, message: "AI_API_BASE_URL not configured." };
    }
    if (!config.aiApiKey) {
      return { ok: false, provider: this.name, message: "AI_API_KEY not configured." };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${config.aiApiBaseUrl.replace(/\/$/, "")}/health`, {
        method: "GET",
        headers: { Authorization: `Bearer ${config.aiApiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return { ok: res.ok, provider: this.name, latencyMs: Date.now() - start, message: res.ok ? "OK" : `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, provider: this.name, latencyMs: Date.now() - start, message: (e as Error).message };
    }
  }

  async detectObjects(opts: AnalyzeOptions): Promise<Detection[]> {
    const detections: Detection[] = [];
    const totalFrames = Math.min(opts.maxFrames, Math.floor(opts.durationSec * opts.frameRate));
    for (let f = 0; f < totalFrames; f++) {
      if (opts.signal?.cancelled) break;
      opts.onProgress?.(f / totalFrames, `Frame ${f}/${totalFrames}`);
      const frameDetections = await this.analyzeFrame(f, opts);
      detections.push(...frameDetections);
    }
    return detections;
  }

  async classifyObjects(detections: Detection[]): Promise<Detection[]> {
    return detections; // classification fused with detection in this adapter
  }

  async analyzeFrame(frameIndex: number, opts: AnalyzeOptions): Promise<Detection[]> {
    if (!config.aiApiBaseUrl || !config.aiApiKey) return [];
    let attempt = 0;
    const max = Math.max(1, config.retries);
    while (attempt < max) {
      try {
        const res = await fetch(`${config.aiApiBaseUrl.replace(/\/$/, "")}/detect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.aiApiKey}`,
            "X-Model": config.aiModel || "default",
          },
          body: JSON.stringify({
            videoId: opts.videoId,
            frameIndex,
            timestamp: frameIndex / opts.frameRate,
            confidence: opts.confidence,
          }),
          signal: AbortSignal.timeout(config.timeout * 1000),
        });
        if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);
        const json = (await res.json()) as { detections?: RawDetection[] };
        return (json.detections ?? [])
          .filter((d): d is RawDetection => d != null && typeof d === "object")
          .map(this.mapResponse)
          .filter((d): d is Detection => !!d);
      } catch (e) {
        attempt++;
        if (attempt >= max) throw e;
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
    return [];
  }

  async processSequence(opts: AnalyzeOptions): Promise<{ detections: Detection[]; tracks: never[] }> {
    const detections = await this.detectObjects(opts);
    // Tracking across frames is normally done by the vision worker. Here we
    // return raw detections and let the application layer build tracks.
    return { detections, tracks: [] };
  }

  private mapResponse = (raw: RawDetection): Detection | null => {
    const rawClass = String(raw.class || raw.label || "").toLowerCase();
    if (!rawClass) return null; // reject detections with no class label
    const cls = CLASS_MAP[rawClass] || "car";
    let conf = typeof raw.confidence === "number" ? raw.confidence : typeof raw.score === "number" ? raw.score : 0.5;
    // Clamp/reject invalid confidence — Detection.confidence MUST be in [0,1].
    if (!Number.isFinite(conf)) return null;
    conf = Math.max(0, Math.min(1, conf));
    return {
      objectId: String(raw.track_id ?? raw.id ?? Math.random().toString(36).slice(2, 8)),
      objectType: cls,
      confidence: conf,
      frameIndex: raw.frame_index ?? 0,
      timestamp: raw.timestamp ?? 0,
      box: {
        x: raw.x ?? raw.bbox?.[0] ?? 0,
        y: raw.y ?? raw.bbox?.[1] ?? 0,
        width: raw.width ?? raw.bbox?.[2] ?? 0.05,
        height: raw.height ?? raw.bbox?.[3] ?? 0.05,
      },
    };
  };
}

interface RawDetection {
  class?: string;
  label?: string;
  confidence?: number;
  score?: number;
  track_id?: string | number;
  id?: string | number;
  frame_index?: number;
  timestamp?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  bbox?: [number, number, number, number];
}
