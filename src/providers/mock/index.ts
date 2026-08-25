/**
 * Mock VisionProvider — deterministic traffic analysis simulation.
 *
 * This is NOT a toy. It generates realistic, reproducible traffic data:
 *   - vehicles traveling along defined lanes with varying speeds
 *   - per-frame bounding boxes (detections)
 *   - tracks built from detections across frames
 *   - directional classification from trajectory
 *   - virtual line crossings (with jitter dedup)
 *   - zone entry/exit, dwell time
 *   - stopped-vehicle, wrong-way, congestion events
 *   - time-series volume + congestion snapshots
 *
 * Seeded RNG (mulberry32) keeps results identical across runs so automated
 * tests remain stable AND the demo always tells the same story.
 *
 * The mock provider lets the entire UI be experienced without any external
 * AI credentials. Real provider integration remains properly abstracted via
 * the VisionProvider interface.
 */
import type {
  BoundingBox,
  Detection,
  DirectionLabel,
  VehicleClass,
  VehicleTrack,
  TrackPoint,
  TrafficEvent,
  CongestionSnapshot,
  AnalysisResult,
  Severity,
  EventType,
} from "@/lib/types";
import type {
  AnalyzeOptions,
  ProviderHealth,
  VisionProvider,
} from "@/providers/vision-provider";
import {
  segmentsIntersect,
  pointInPolygon,
} from "@/lib/geometry";
import {
  directionFromDelta,
  oppositeDirection,
  isWrongWay as isWrongWayDir,
  type CardinalDirection,
} from "@/lib/direction";

/* ----------------------------- seeded RNG ------------------------------- */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

/* --------------------------- lane definitions --------------------------- */
interface Lane {
  id: string;
  // Trajectory in normalized [0..1] coordinates, start -> end
  from: { x: number; y: number };
  to: { x: number; y: number };
  direction: DirectionLabel;
  classes: VehicleClass[];
  baseSpeed: number; // normalized units/sec across the frame
}

const LANES: Lane[] = [
  { id: "L1", from: { x: -0.1, y: 0.62 }, to: { x: 1.1, y: 0.58 }, direction: "east", classes: ["car", "car", "car", "truck", "bus", "van"], baseSpeed: 0.13 },
  { id: "L2", from: { x: 1.1, y: 0.46 }, to: { x: -0.1, y: 0.42 }, direction: "west", classes: ["car", "car", "motorcycle", "car", "truck"], baseSpeed: 0.12 },
  { id: "L3", from: { x: 0.5, y: 1.1 }, to: { x: 0.46, y: -0.1 }, direction: "north", classes: ["car", "motorcycle", "car", "bicycle"], baseSpeed: 0.1 },
  { id: "L4", from: { x: 0.54, y: -0.1 }, to: { x: 0.58, y: 1.1 }, direction: "south", classes: ["car", "car", "truck", "bus"], baseSpeed: 0.11 },
];

/* ------------------------- class sizing helpers ------------------------- */
const CLASS_SIZE: Record<VehicleClass, { w: number; h: number }> = {
  car: { w: 0.06, h: 0.045 },
  motorcycle: { w: 0.022, h: 0.03 },
  truck: { w: 0.09, h: 0.055 },
  bus: { w: 0.075, h: 0.07 },
  bicycle: { w: 0.022, h: 0.028 },
  van: { w: 0.07, h: 0.05 },
};

/* --------------------------- direction helpers --------------------------- */
// directionFromDelta, oppositeDirection, isWrongWay imported from @/lib/direction.
// segmentsIntersect, pointInPolygon imported from @/lib/geometry.

function isWrongWay(direction: DirectionLabel, allowed: DirectionLabel): boolean {
  if (!isCardinal(direction) || !isCardinal(allowed)) return false;
  return isWrongWayDir(direction as CardinalDirection, allowed as CardinalDirection);
}
function isCardinal(d: string): d is CardinalDirection {
  return ["north","south","east","west","northeast","northwest","southeast","southwest"].includes(d);
}

/* ----------------------------- the provider ----------------------------- */
export class MockProvider implements VisionProvider {
  readonly name = "mock";

  async healthCheck(): Promise<ProviderHealth> {
    return { ok: true, provider: this.name, latencyMs: 1, message: "Mock provider ready — no external credentials required." };
  }

  async detectObjects(opts: AnalyzeOptions): Promise<Detection[]> {
    const { tracks } = await this.processSequence(opts);
    const detections: Detection[] = [];
    for (const t of tracks) {
      for (const tp of t.trajectory) {
        const size = CLASS_SIZE[t.objectType];
        detections.push({
          objectId: t.trackId,
          objectType: t.objectType,
          confidence: t.averageConfidence,
          frameIndex: tp.frameIndex,
          timestamp: tp.timestamp,
          box: {
            x: tp.x - size.w / 2,
            y: tp.y - size.h / 2,
            width: size.w,
            height: size.h,
          },
        });
      }
    }
    return detections;
  }

  async classifyObjects(detections: Detection[]): Promise<Detection[]> {
    // Already classified by the simulator.
    return detections;
  }

  async analyzeFrame(frameIndex: number, opts: AnalyzeOptions): Promise<Detection[]> {
    const all = await this.detectObjects(opts);
    return all.filter((d) => d.frameIndex === frameIndex);
  }

  async processSequence(opts: AnalyzeOptions): Promise<{ detections: Detection[]; tracks: VehicleTrack[] }> {
    const { durationSec, frameRate, confidence, onProgress, signal } = opts;
    const seed = hashSeed(opts.videoId || "demo");
    const rng = mulberry32(seed);

    const totalFrames = Math.min(opts.maxFrames, Math.max(1, Math.floor(durationSec * frameRate)));
    const dt = 1 / frameRate;

    // Spawn vehicles across the timeline.
    const vehicles: VehicleSim[] = [];
    let vehicleCounter = 1;
    // base spawn rate scales with perceived busyness; deterministic
    const spawnRate = 0.85; // vehicles per second baseline
    const plannedSpawns = Math.floor(durationSec * spawnRate);

    for (let i = 0; i < plannedSpawns; i++) {
      if (signal?.cancelled) break;
      const lane = pick(rng, LANES);
      const cls = pick(rng, lane.classes);
      const speedJitter = 0.85 + rng() * 0.4;
      const startOffset = rng() * Math.max(0, durationSec - 6);
      const travelTime = 1 / (lane.baseSpeed * speedJitter); // sec across frame
      // Occasionally spawn a wrong-way vehicle (~4%)
      const wrongWay = rng() < 0.04;
      // Occasionally spawn a stopped vehicle (~3%)
      const stopped = rng() < 0.03 && cls !== "motorcycle" && cls !== "bicycle";
      // Occasionally spawn a slow heavy vehicle
      const slowHeavy = (cls === "truck" || cls === "bus") && rng() < 0.3;

      vehicles.push({
        trackId: "T" + String(vehicleCounter++).padStart(4, "0"),
        lane,
        cls,
        startTime: startOffset,
        travelTime,
        speedFactor: speedJitter,
        wrongWay,
        stopped,
        slow: slowHeavy,
        confidence: Math.min(0.99, Math.max(confidence, 0.7 + rng() * 0.29)),
      });
      if (i % 25 === 0) onProgress?.(Math.min(0.5, i / plannedSpawns / 2), "Detecting objects");
    }

    // Build per-vehicle trajectories sampled at frameRate.
    const tracks: VehicleTrack[] = [];
    for (const v of vehicles) {
      const from = v.wrongWay ? v.lane.to : v.lane.from;
      const to = v.wrongWay ? v.lane.from : v.lane.to;
      const trajectory: TrackPoint[] = [];
      const realTravel = v.stopped ? v.travelTime * 2.5 : v.slow ? v.travelTime * 1.6 : v.travelTime;
      const steps = Math.max(2, Math.floor(realTravel / dt));
      const stopFrame = v.stopped ? Math.floor(steps * (0.4 + rng() * 0.3)) : -1;
      let pauseLen = v.stopped ? 30 + Math.floor(rng() * 40) : 0;

      let frameIdx = Math.floor(v.startTime / dt);
      for (let s = 0; s <= steps; s++) {
        if (frameIdx >= totalFrames) break;
        const t = frameIdx * dt;
        let prog = s / steps;
        if (v.stopped && s >= stopFrame && pauseLen > 0) {
          prog = stopFrame / steps;
          pauseLen--;
        }
        const x = from.x + (to.x - from.x) * prog;
        const y = from.y + (to.y - from.y) * prog;
        trajectory.push({ frameIndex: frameIdx, timestamp: t, x, y });
        frameIdx++;
      }
      if (trajectory.length < 2) continue;

      const start = trajectory[0];
      const end = trajectory[trajectory.length - 1];
      const direction = v.wrongWay ? opposite(v.lane.direction) : v.lane.direction;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.hypot(dx, dy);
      const computedDir = directionFromDelta(dx, dy);
      const finalDirection = dist > 0.05 ? computedDir : direction;
      const speedKmh = estimateSpeed(dist, v.travelTime, v.lane.baseSpeed);

      tracks.push({
        trackId: v.trackId,
        objectType: v.cls,
        firstSeen: start.timestamp,
        lastSeen: end.timestamp,
        averageConfidence: v.confidence,
        direction: finalDirection as DirectionLabel,
        trajectory,
        startBox: boxAround(start.x, start.y, v.cls),
        endBox: boxAround(end.x, end.y, v.cls),
        estimatedSpeed: Math.round(speedKmh),
        zonesVisited: [],
        crossedLines: [],
      });
    }

    onProgress?.(0.7, "Building trajectories");
    // Generate detections
    const detections: Detection[] = [];
    for (const t of tracks) {
      for (const tp of t.trajectory) {
        const size = CLASS_SIZE[t.objectType];
        detections.push({
          objectId: t.trackId,
          objectType: t.objectType,
          confidence: t.averageConfidence,
          frameIndex: tp.frameIndex,
          timestamp: tp.timestamp,
          box: { x: tp.x - size.w / 2, y: tp.y - size.h / 2, width: size.w, height: size.h },
        });
      }
    }
    onProgress?.(1, "Done");
    return { detections, tracks };
  }

  /** Build the full AnalysisResult including events + time series. */
  buildResult(opts: AnalyzeOptions, tracks: VehicleTrack[]): AnalysisResult {
    const rng = mulberry32(hashSeed(opts.videoId) + 7);
    const events: TrafficEvent[] = [];

    // Line crossings
    for (const line of opts.lines) {
      for (const t of tracks) {
        if (line.classes.length && !line.classes.includes(t.objectType)) continue;
        for (let i = 1; i < t.trajectory.length; i++) {
          const a = t.trajectory[i - 1];
          const b = t.trajectory[i];
          if (segmentsIntersect(a, b, line.start, line.end)) {
            const inward = b.y < a.y;
            events.push({
              id: `E${events.length + 1}`,
              eventType: "count_crossing",
              severity: "info",
              timestamp: b.timestamp,
              objectId: t.trackId,
              trackId: t.trackId,
              metadata: { line: line.name, direction: inward ? line.inboundLabel : line.outboundLabel, label: inward ? line.inboundLabel : line.outboundLabel },
            });
            t.crossedLines.push(line.id);
            break; // dedup jitter: one crossing per track per line
          }
        }
      }
    }

    // Zone entry/exit + dwell + stopped in zone
    const zonePresence = new Map<string, { entered: number; exited: number; current: number; max: number; sum: number; samples: number; dwellSum: number; dwellN: number; classes: Record<string, number> }>();
    for (const z of opts.zones) zonePresence.set(z.id, { entered: 0, exited: 0, current: 0, max: 0, sum: 0, samples: 0, dwellSum: 0, dwellN: 0, classes: {} });

    for (const t of tracks) {
      let insideAny: Record<string, boolean> = {};
      for (const z of opts.zones) insideAny[z.id] = false;
      let enterTs: Record<string, number> = {};
      for (let i = 0; i < t.trajectory.length; i++) {
        const p = t.trajectory[i];
        for (const z of opts.zones) {
          const inside = pointInPolygon(p, z.polygon);
          if (inside && !insideAny[z.id]) {
            insideAny[z.id] = true;
            enterTs[z.id] = p.timestamp;
            const s = zonePresence.get(z.id)!;
            s.entered++;
            s.current++;
            s.classes[t.objectType] = (s.classes[t.objectType] || 0) + 1;
            events.push({
              id: `E${events.length + 1}`,
              eventType: "zone_entry",
              severity: "info",
              timestamp: p.timestamp,
              objectId: t.trackId,
              trackId: t.trackId,
              metadata: { zone: z.name, zoneId: z.id },
            });
            t.zonesVisited.push(z.id);
          } else if (!inside && insideAny[z.id]) {
            insideAny[z.id] = false;
            const s = zonePresence.get(z.id)!;
            s.exited++;
            s.current = Math.max(0, s.current - 1);
            const dwell = p.timestamp - (enterTs[z.id] ?? p.timestamp);
            s.dwellSum += dwell;
            s.dwellN++;
            events.push({
              id: `E${events.length + 1}`,
              eventType: "zone_exit",
              severity: "info",
              timestamp: p.timestamp,
              objectId: t.trackId,
              trackId: t.trackId,
              metadata: { zone: z.name, zoneId: z.id, dwellSec: Math.round(dwell * 10) / 10 },
            });
          }
        }
      }
      // dwell time rule
      for (const z of opts.zones) {
        if (insideAny[z.id]) {
          const s = zonePresence.get(z.id)!;
          const dwell = (tracks[0].lastSeen) - (enterTs[z.id] ?? 0);
          if (dwell > 15) {
            events.push({
              id: `E${events.length + 1}`,
              eventType: "dwell_time",
              severity: "low",
              timestamp: enterTs[z.id] ?? 0,
              objectId: t.trackId,
              trackId: t.trackId,
              metadata: { zone: z.name, dwellSec: Math.round(dwell) },
            });
          }
        }
      }
    }

    // Wrong-way events
    for (const t of tracks) {
      if (isWrongWay(t.direction, "north") || isWrongWay(t.direction, "east")) {
        // Only flag if it actually conflicts with the dominant flow for its lane area
        // Simplification: flag tracks that moved south/southwest on the northbound lane region (x ~0.5)
        if (t.direction === "south" && t.endBox.x > 0.45 && t.endBox.x < 0.65) {
          events.push({
            id: `E${events.length + 1}`,
            eventType: "wrong_way",
            severity: "high",
            timestamp: t.firstSeen,
            objectId: t.trackId,
            trackId: t.trackId,
            metadata: { direction: t.direction, expected: "north" },
          });
        }
        if (t.direction === "east" && t.endBox.y > 0.55) {
          // westbound lane going east -> wrong way
          events.push({
            id: `E${events.length + 1}`,
            eventType: "wrong_way",
            severity: "high",
            timestamp: t.firstSeen,
            objectId: t.trackId,
            trackId: t.trackId,
            metadata: { direction: t.direction, expected: "west" },
          });
        }
      }
    }

    // Stopped-vehicle events (from sim)
    // We approximate: tracks with very low end-to-end movement but long presence
    for (const t of tracks) {
      const dx = t.endBox.x - t.startBox.x;
      const dy = t.endBox.y - t.startBox.y;
      const moved = Math.hypot(dx, dy);
      const presence = t.lastSeen - t.firstSeen;
      if (moved < 0.06 && presence > 25) {
        events.push({
          id: `E${events.length + 1}`,
          eventType: "stopped_vehicle",
          severity: "medium",
          timestamp: t.firstSeen + 10,
          objectId: t.trackId,
          trackId: t.trackId,
          metadata: { durationSec: Math.round(presence), moved: Math.round(moved * 1000) / 1000 },
        });
      }
    }

    // Congestion snapshots (every 30s)
    const congestion: CongestionSnapshot[] = [];
    for (let t = 0; t < opts.durationSec; t += 30) {
      const active = tracks.filter((tr) => tr.firstSeen <= t && tr.lastSeen >= t).length;
      const occ = Math.min(1, active / 18);
      const level = occ > 0.75 ? "SEVERE" : occ > 0.5 ? "HIGH" : occ > 0.25 ? "MODERATE" : "LOW";
      congestion.push({ timestamp: t, level, occupancy: occ, activeVehicles: active, avgMovement: 0.6 + rng() * 0.3 });
    }

    // Time series (per 10s bucket)
    const timeSeries = [];
    for (let t = 0; t < opts.durationSec; t += 10) {
      const bucket = tracks.filter((tr) => tr.firstSeen >= t && tr.firstSeen < t + 10);
      const count = bucket.length;
      timeSeries.push({
        t,
        count,
        cars: bucket.filter((b) => b.objectType === "car").length,
        motorcycles: bucket.filter((b) => b.objectType === "motorcycle").length,
        trucks: bucket.filter((b) => b.objectType === "truck").length,
        buses: bucket.filter((b) => b.objectType === "bus").length,
      });
    }

    // Congestion events
    for (const c of congestion) {
      if (c.level === "HIGH" || c.level === "SEVERE") {
        events.push({
          id: `E${events.length + 1}`,
          eventType: "congestion",
          severity: c.level === "SEVERE" ? "critical" : "high",
          timestamp: c.timestamp,
          metadata: { level: c.level, occupancy: c.occupancy, activeVehicles: c.activeVehicles },
        });
      }
    }

    events.sort((a, b) => a.timestamp - b.timestamp);
    events.forEach((e, i) => (e.id = `E${String(i + 1).padStart(4, "0")}`));

    // Summary
    const summary = buildSummary(tracks, events, congestion, zonePresence, opts.zones);
    void rng;

    return {
      videoId: opts.videoId,
      provider: this.name,
      durationSec: opts.durationSec,
      fps: opts.fps,
      width: opts.width,
      height: opts.height,
      detections: [],
      tracks,
      events,
      congestion,
      timeSeries,
      summary,
    };
  }
}

/* ----------------------------- helpers ---------------------------------- */
interface VehicleSim {
  trackId: string;
  lane: Lane;
  cls: VehicleClass;
  startTime: number;
  travelTime: number;
  speedFactor: number;
  wrongWay: boolean;
  stopped: boolean;
  slow: boolean;
  confidence: number;
}

function boxAround(x: number, y: number, cls: VehicleClass): BoundingBox {
  const s = CLASS_SIZE[cls];
  return { x: x - s.w / 2, y: y - s.h / 2, width: s.w, height: s.h };
}

function opposite(d: DirectionLabel): DirectionLabel {
  if (d === "inbound") return "outbound";
  if (d === "outbound") return "inbound";
  if (isCardinal(d)) return oppositeDirection(d as CardinalDirection) as DirectionLabel;
  return d;
}

function estimateSpeed(dist: number, travelTime: number, base: number): number {
  // Crude heuristic mapping normalized distance to km/h.
  // Calibrated so a typical car across the frame ~ 30-50 km/h.
  const normSpeed = dist / Math.max(0.1, travelTime);
  const kmh = Math.round(normSpeed * 320 / base);
  return Math.max(5, Math.min(120, kmh));
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildSummary(
  tracks: VehicleTrack[],
  events: TrafficEvent[],
  congestion: CongestionSnapshot[],
  zonePresence: Map<string, { entered: number; exited: number; current: number; max: number; sum: number; samples: number; dwellSum: number; dwellN: number; classes: Record<string, number> }>,
  zones: { id: string; name: string }[],
): AnalysisResult["summary"] {
  const cars = tracks.filter((t) => t.objectType === "car").length;
  const motorcycles = tracks.filter((t) => t.objectType === "motorcycle").length;
  const trucks = tracks.filter((t) => t.objectType === "truck").length;
  const buses = tracks.filter((t) => t.objectType === "bus").length;
  const bicycles = tracks.filter((t) => t.objectType === "bicycle").length;
  const vans = tracks.filter((t) => t.objectType === "van").length;

  const directionalBreakdown: Record<string, number> = {};
  for (const t of tracks) directionalBreakdown[t.direction] = (directionalBreakdown[t.direction] || 0) + 1;

  const inbound = (directionalBreakdown["east"] || 0) + (directionalBreakdown["north"] || 0) + (directionalBreakdown["inbound"] || 0);
  const outbound = (directionalBreakdown["west"] || 0) + (directionalBreakdown["south"] || 0) + (directionalBreakdown["outbound"] || 0);

  const peakBucket = congestion.reduce((a, b) => (b.activeVehicles > a.activeVehicles ? b : a), congestion[0] ?? { activeVehicles: 0, timestamp: 0 });

  const zoneStats: Record<string, unknown> = {};
  for (const z of zones) {
    const s = zonePresence.get(z.id);
    zoneStats[z.id] = {
      zoneId: z.id,
      name: z.name,
      entered: s?.entered ?? 0,
      exited: s?.exited ?? 0,
      currentInside: s?.current ?? 0,
      maxOccupancy: s?.max ?? 0,
      avgOccupancy: s?.samples ? s.sum / s.samples : 0,
      avgDwellSec: s?.dwellN ? s.dwellSum / s.dwellN : 0,
      classBreakdown: s?.classes ?? {},
    };
  }

  const finalLevel = congestion.length ? congestion[congestion.length - 1].level : "LOW";

  return {
    totalVehicles: tracks.length,
    cars, motorcycles, trucks, buses, bicycles, vans,
    inboundCount: inbound,
    outboundCount: outbound,
    peakVolume: peakBucket?.activeVehicles ?? 0,
    peakVolumeTime: peakBucket?.timestamp ?? 0,
    avgOccupancy: congestion.length ? congestion.reduce((a, b) => a + b.occupancy, 0) / congestion.length : 0,
    totalEvents: events.length,
    congestionLevel: finalLevel,
    directionalBreakdown,
    zoneStats: zoneStats as never,
  };
}
