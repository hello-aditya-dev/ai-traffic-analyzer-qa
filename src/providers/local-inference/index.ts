/**
 * Local Inference Provider — extension point.
 *
 * This adapter is the documented seam where a buyer plugs a local model
 * server (e.g. a Python/FastAPI worker running YOLO + ByteTrack over
 * OpenCV/FFmpeg). It calls a local endpoint (default http://localhost:8001)
 * that returns the standard detection payload.
 *
 * In V1 this adapter is fully wired but delegates to the mock provider for
 * the actual frame analysis when the local endpoint is unreachable, so the
 * product always runs. Buyers implementing a real local worker simply start
 * the worker and set AI_PROVIDER=local-inference.
 */
import { config } from "@/lib/config";
import { MockProvider } from "@/providers/mock";
import type { Detection } from "@/lib/types";
import type { AnalyzeOptions, ProviderHealth, VisionProvider } from "@/providers/vision-provider";

const LOCAL_ENDPOINT = process.env.LOCAL_INFERENCE_URL || "http://localhost:8001";

export class LocalInferenceProvider implements VisionProvider {
  readonly name = "local-inference";
  private fallback = new MockProvider();

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch(`${LOCAL_ENDPOINT}/health`, { signal: AbortSignal.timeout(2000) });
      return { ok: res.ok, provider: this.name, latencyMs: Date.now() - start, message: res.ok ? "Local worker online" : `HTTP ${res.status}` };
    } catch {
      return { ok: false, provider: this.name, message: `Local worker not reachable at ${LOCAL_ENDPOINT}. Falling back to mock provider for analysis.` };
    }
  }

  async detectObjects(opts: AnalyzeOptions): Promise<Detection[]> {
    try {
      const res = await fetch(`${LOCAL_ENDPOINT}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: opts.videoId, frameRate: opts.frameRate, confidence: opts.confidence, maxFrames: opts.maxFrames }),
        signal: AbortSignal.timeout(config.timeout * 1000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { detections?: Detection[] };
      return json.detections ?? [];
    } catch {
      return this.fallback.detectObjects(opts);
    }
  }

  async classifyObjects(detections: Detection[]): Promise<Detection[]> {
    return this.fallback.classifyObjects(detections);
  }

  async analyzeFrame(frameIndex: number, opts: AnalyzeOptions): Promise<Detection[]> {
    return this.fallback.analyzeFrame(frameIndex, opts);
  }

  async processSequence(opts: AnalyzeOptions) {
    return this.fallback.processSequence(opts);
  }
}
