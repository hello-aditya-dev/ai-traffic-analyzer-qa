/**
 * Analysis service — orchestrates the provider into a persisted AnalysisRun.
 *
 * Pipeline stages (each with clear interface, per docs/ARCHITECTURE.md):
 *   INGESTION → FRAME SAMPLING → OBJECT DETECTION → TRACKING →
 *   TRAJECTORY BUILDING → ZONE/LINE LOGIC → EVENT ENGINE →
 *   AGGREGATION → RESULT STORAGE → (REPORT GENERATION is separate)
 */
import { db } from "@/lib/db";
import { getProvider } from "@/providers/registry";
import { MockProvider } from "@/providers/mock";
import { config } from "@/lib/config";
import type { AnalyzeOptions } from "@/providers/vision-provider";
import type { AnalysisResult } from "@/lib/types";

/** Run an analysis job. Persists tracks, events, and the full result JSON. */
export async function runAnalysis(analysisId: string): Promise<void> {
  const analysis = await db.analysisRun.findUnique({
    where: { id: analysisId },
    include: { video: true, project: { include: { zones: true, rules: true } } },
  });
  if (!analysis) throw new Error("Analysis not found");

  await db.analysisRun.update({
    where: { id: analysisId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  try {
    const provider = getProvider();
    const video = analysis.video;

    const zones = analysis.project.zones.map((z) => ({
      id: z.id,
      name: z.name,
      polygon: safeParse(z.polygon, []) as { x: number; y: number }[],
    }));
    const rules = analysis.project.rules.map((r) => ({
      id: r.id,
      type: r.ruleType,
      enabled: r.enabled,
      parameters: safeParse(r.parametersJson, {}) as Record<string, unknown>,
    }));
    const lines = analysis.project.rules
      .filter((r) => r.ruleType === "COUNT_CROSSING")
      .map((r) => {
        const p = safeParse(r.parametersJson, {}) as Record<string, unknown>;
        return {
          id: r.id,
          name: (p.name as string) || r.name,
          start: p.start as { x: number; y: number },
          end: p.end as { x: number; y: number },
          inboundLabel: (p.inboundLabel as string) || "Inbound",
          outboundLabel: (p.outboundLabel as string) || "Outbound",
          classes: (p.classes as string[]) || [],
        };
      })
      .filter((l) => l.start && l.end);

    const storedCfg = safeParse(analysis.configurationJson, {}) as Record<string, unknown>;
    const opts: AnalyzeOptions = {
      videoId: video.id,
      durationSec: video.duration || 180,
      fps: video.fps || 30,
      width: video.width || 1280,
      height: video.height || 720,
      frameRate: Number(storedCfg.frameRate) || config.defaultFrameRate,
      confidence: Number(storedCfg.confidence) || 0.5,
      maxFrames: Number(storedCfg.maxFrames) || 5000,
      zones,
      lines,
      rules,
    };

    const { tracks } = await provider.processSequence(opts);

    // Build the full result (events, time-series, summary, congestion) using
    // the mock provider's pure aggregation engine — it only depends on tracks.
    const builder = new MockProvider();
    const result: AnalysisResult = builder.buildResult(opts, tracks);
    result.provider = provider.name;

    await finishAnalysis(analysisId, result);
  } catch (e) {
    await db.analysisRun.update({
      where: { id: analysisId },
      data: { status: "FAILED", errorMessage: (e as Error).message, completedAt: new Date() },
    });
    throw e;
  }
}

async function finishAnalysis(analysisId: string, result: AnalysisResult) {
  await db.track.createMany({
    data: result.tracks.map((t) => ({
      analysisId,
      trackId: t.trackId,
      objectType: t.objectType,
      firstSeen: t.firstSeen,
      lastSeen: t.lastSeen,
      averageConfidence: t.averageConfidence,
      startX: t.startBox.x,
      startY: t.startBox.y,
      endX: t.endBox.x,
      endY: t.endBox.y,
      direction: t.direction,
      estimatedSpeed: t.estimatedSpeed ?? null,
    })),
  });

  await db.event.createMany({
    data: result.events.map((e) => ({
      analysisId,
      ruleId: e.ruleId ?? null,
      eventType: e.eventType,
      severity: e.severity,
      timestamp: e.timestamp,
      objectId: e.objectId ?? null,
      trackId: e.trackId ?? null,
      metadataJson: e.metadata ? JSON.stringify(e.metadata) : null,
    })),
  });

  await db.analysisRun.update({
    where: { id: analysisId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      processingDuration: result.durationSec,
      configurationJson: JSON.stringify({ result, stored: false }),
    },
  });
}

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Retrieve the full analysis result (with time-series, summary, congestion). */
export async function getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
  const analysis = await db.analysisRun.findUnique({ where: { id: analysisId } });
  if (!analysis?.configurationJson) return null;
  try {
    const parsed = JSON.parse(analysis.configurationJson) as { result?: AnalysisResult };
    return parsed.result ?? null;
  } catch {
    return null;
  }
}
