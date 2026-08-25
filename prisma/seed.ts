/**
 * Seed script — creates the "Downtown Intersection Demo" sample project with
 * configured zones, counting lines, rules, a sample video asset, and a
 * COMPLETED analysis run (so demo mode works instantly with no processing).
 *
 * Run: `bun run db:seed`
 */
import { PrismaClient } from "@prisma/client";
import { MockProvider } from "../src/providers/mock";
import type { AnalyzeOptions } from "../src/providers/vision-provider";

const db = new PrismaClient();

async function main() {
  console.log("Seeding AI Traffic Analyzer demo data...");

  // Clean previous seed
  await db.event.deleteMany();
  await db.track.deleteMany();
  await db.report.deleteMany();
  await db.analysisRun.deleteMany();
  await db.rule.deleteMany();
  await db.zone.deleteMany();
  await db.camera.deleteMany();
  await db.videoAsset.deleteMany();
  await db.project.deleteMany();
  await db.providerConfig.deleteMany();

  // Provider config (mock by default)
  await db.providerConfig.create({
    data: { provider: "mock", apiUrl: "", apiKey: "", model: "", timeout: 30, retries: 3, frameRate: 2, confidence: 0.5, maxFrames: 5000, resolution: "720p" },
  });

  // Sample project
  const project = await db.project.create({
    data: {
      name: "Downtown Intersection Demo",
      description:
        "Sample project showcasing vehicle detection, classification, tracking, directional flow, zone analytics, line crossings and event detection on a four-way urban intersection.",
      location: "Central Ave & 5th St, Downtown",
    },
  });

  // Zones
  const zoneIntersection = await db.zone.create({
    data: {
      projectId: project.id,
      name: "Main Intersection",
      polygon: JSON.stringify([
        { x: 0.35, y: 0.35 }, { x: 0.65, y: 0.35 }, { x: 0.65, y: 0.65 }, { x: 0.35, y: 0.65 },
      ]),
      zoneType: "intersection",
      color: "#0ea5e9",
    },
  });
  await db.zone.create({
    data: {
      projectId: project.id,
      name: "Northbound Approach",
      polygon: JSON.stringify([
        { x: 0.45, y: 0.0 }, { x: 0.55, y: 0.0 }, { x: 0.55, y: 0.35 }, { x: 0.45, y: 0.35 },
      ]),
      zoneType: "lane",
      color: "#10b981",
    },
  });
  await db.zone.create({
    data: {
      projectId: project.id,
      name: "Eastbound Approach",
      polygon: JSON.stringify([
        { x: 0.0, y: 0.5 }, { x: 0.35, y: 0.5 }, { x: 0.35, y: 0.62 }, { x: 0.0, y: 0.62 },
      ]),
      zoneType: "lane",
      color: "#f59e0b",
    },
  });
  await db.zone.create({
    data: {
      projectId: project.id,
      name: "Restricted Zone",
      polygon: JSON.stringify([
        { x: 0.78, y: 0.05 }, { x: 0.95, y: 0.05 }, { x: 0.95, y: 0.22 }, { x: 0.78, y: 0.22 },
      ]),
      zoneType: "restricted",
      color: "#ef4444",
    },
  });

  // Counting line (east-west)
  const countLine = await db.rule.create({
    data: {
      projectId: project.id,
      name: "East-West Count Line",
      ruleType: "COUNT_CROSSING",
      parametersJson: JSON.stringify({
        name: "East-West Count Line",
        start: { x: 0.0, y: 0.5 },
        end: { x: 1.0, y: 0.5 },
        inboundLabel: "Inbound (West→East)",
        outboundLabel: "Outbound (East→West)",
        classes: ["car", "motorcycle", "truck", "bus", "van"],
      }),
      enabled: true,
    },
  });
  // North-south counting line
  const countLine2 = await db.rule.create({
    data: {
      projectId: project.id,
      name: "North-South Count Line",
      ruleType: "COUNT_CROSSING",
      parametersJson: JSON.stringify({
        name: "North-South Count Line",
        start: { x: 0.5, y: 0.0 },
        end: { x: 0.5, y: 1.0 },
        inboundLabel: "Inbound (South→North)",
        outboundLabel: "Outbound (North→South)",
        classes: ["car", "motorcycle", "bicycle"],
      }),
      enabled: true,
    },
  });
  await db.rule.create({
    data: { projectId: project.id, name: "Stopped Vehicle Alert", ruleType: "STOPPED_VEHICLE", parametersJson: JSON.stringify({ minDurationSec: 30, minConfidence: 0.75 }), enabled: true },
  });
  await db.rule.create({
    data: { projectId: project.id, name: "Wrong-Way Detection", ruleType: "WRONG_WAY", parametersJson: JSON.stringify({ expectedDirection: "north" }), enabled: true },
  });
  await db.rule.create({
    data: { projectId: project.id, name: "Intersection Congestion", ruleType: "CONGESTION", parametersJson: JSON.stringify({ zoneId: zoneIntersection.id, threshold: 0.6, minDurationSec: 30 }), enabled: true },
  });
  await db.rule.create({
    data: { projectId: project.id, name: "Long Dwell in Restricted Zone", ruleType: "DWELL_TIME", parametersJson: JSON.stringify({ minDwellSec: 60 }), enabled: true },
  });

  // Sample video asset
  const video = await db.videoAsset.create({
    data: {
      projectId: project.id,
      filename: "downtown-intersection-180s.mp4",
      filePath: "data/samples/downtown-intersection.mp4",
      duration: 180,
      width: 1280,
      height: 720,
      fps: 30,
      frameCount: 5400,
      status: "READY",
    },
  });

  // Pre-completed analysis run
  const analysis = await db.analysisRun.create({
    data: {
      projectId: project.id,
      videoId: video.id,
      provider: "mock",
      status: "PROCESSING",
      startedAt: new Date(Date.now() - 1000 * 60 * 3),
    },
  });

  // Run mock provider to populate everything
  const provider = new MockProvider();
  const zones = (await db.zone.findMany({ where: { projectId: project.id } })).map((z) => ({
    id: z.id,
    name: z.name,
    polygon: JSON.parse(z.polygon),
  }));
  const lines = [countLine, countLine2].map((r) => {
    const p = JSON.parse(r.parametersJson!) as Record<string, unknown>;
    return {
      id: r.id,
      name: (p.name as string) || r.name,
      start: p.start as { x: number; y: number },
      end: p.end as { x: number; y: number },
      inboundLabel: (p.inboundLabel as string) || "Inbound",
      outboundLabel: (p.outboundLabel as string) || "Outbound",
      classes: (p.classes as string[]) || [],
    };
  });
  const rules = (await db.rule.findMany({ where: { projectId: project.id } })).map((r) => ({
    id: r.id,
    type: r.ruleType,
    enabled: r.enabled,
    parameters: r.parametersJson ? JSON.parse(r.parametersJson) : {},
  }));

  const opts: AnalyzeOptions = {
    videoId: video.id,
    durationSec: video.duration,
    fps: video.fps,
    width: video.width,
    height: video.height,
    frameRate: 2,
    confidence: 0.5,
    maxFrames: 5000,
    zones,
    lines,
    rules,
  };

  const { tracks } = await provider.processSequence(opts);
  const result = provider.buildResult(opts, tracks);

  // Persist tracks
  await db.track.createMany({
    data: result.tracks.map((t) => ({
      analysisId: analysis.id,
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

  // Persist events
  await db.event.createMany({
    data: result.events.map((e) => ({
      analysisId: analysis.id,
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
    where: { id: analysis.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      processingDuration: result.durationSec,
      configurationJson: JSON.stringify({ result }),
    },
  });

  // Second smaller project for the project list
  const p2 = await db.project.create({
    data: { name: "Highway Survey — Route 9", description: "Long-distance highway segment survey for volume & speed.", location: "Route 9, Mile 24-26" },
  });
  const v2 = await db.videoAsset.create({
    data: { projectId: p2.id, filename: "highway-9-survey.mp4", filePath: "data/samples/highway-9.mp4", duration: 240, width: 1920, height: 1080, fps: 25, frameCount: 6000, status: "READY" },
  });
  const a2 = await db.analysisRun.create({ data: { projectId: p2.id, videoId: v2.id, provider: "mock", status: "PROCESSING", startedAt: new Date(Date.now() - 1000 * 60 * 8) } });
  const opts2 = { ...opts, videoId: v2.id, durationSec: v2.duration, fps: v2.fps, width: v2.width, height: v2.height, zones: [], lines: [], rules: [] };
  const { tracks: t2 } = await provider.processSequence(opts2);
  const r2 = provider.buildResult(opts2, t2);
  await db.track.createMany({ data: r2.tracks.map((t) => ({ analysisId: a2.id, trackId: t.trackId, objectType: t.objectType, firstSeen: t.firstSeen, lastSeen: t.lastSeen, averageConfidence: t.averageConfidence, startX: t.startBox.x, startY: t.startBox.y, endX: t.endBox.x, endY: t.endBox.y, direction: t.direction, estimatedSpeed: t.estimatedSpeed ?? null })) });
  await db.event.createMany({ data: r2.events.map((e) => ({ analysisId: a2.id, ruleId: e.ruleId ?? null, eventType: e.eventType, severity: e.severity, timestamp: e.timestamp, objectId: e.objectId ?? null, trackId: e.trackId ?? null, metadataJson: e.metadata ? JSON.stringify(e.metadata) : null })) });
  await db.analysisRun.update({ where: { id: a2.id }, data: { status: "COMPLETED", completedAt: new Date(), processingDuration: r2.durationSec, configurationJson: JSON.stringify({ result: r2 }) } });

  const p3 = await db.project.create({
    data: { name: "Mall Parking Lot — Entrance A", description: "Parking lot entrance analytics: entry/exit counts and dwell.", location: "Mall Plaza, Entrance A" },
  });
  const v3 = await db.videoAsset.create({ data: { projectId: p3.id, filename: "mall-parking-a.mp4", filePath: "data/samples/mall-parking.mp4", duration: 120, width: 1280, height: 720, fps: 30, frameCount: 3600, status: "READY" } });
  const a3 = await db.analysisRun.create({ data: { projectId: p3.id, videoId: v3.id, provider: "mock", status: "QUEUED", startedAt: new Date() } });
  void a3;

  console.log("Seed complete. Projects: Downtown Intersection Demo (completed), Highway Survey (completed), Mall Parking (queued).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
