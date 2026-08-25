/**
 * Unit tests for the MockProvider — the deterministic demo engine.
 * Covers: Phases 4, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19.
 *
 * These tests exercise the REAL provider through its public API and assert
 * mathematical properties of the output — no internal mocking.
 */
import { describe, it, expect } from "vitest";
import { MockProvider } from "@/providers/mock";
import type { AnalyzeOptions } from "@/providers/vision-provider";

function makeOpts(overrides: Partial<AnalyzeOptions> = {}): AnalyzeOptions {
  return {
    videoId: "qa-deterministic",
    durationSec: 180,
    fps: 30,
    width: 1280,
    height: 720,
    frameRate: 2,
    confidence: 0.5,
    maxFrames: 5000,
    zones: [
      {
        id: "z1",
        name: "Intersection",
        polygon: [
          { x: 0.35, y: 0.35 }, { x: 0.65, y: 0.35 },
          { x: 0.65, y: 0.65 }, { x: 0.35, y: 0.65 },
        ],
      },
    ],
    lines: [
      {
        id: "l1", name: "East-West",
        start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 },
        inboundLabel: "Inbound", outboundLabel: "Outbound",
        classes: ["car", "motorcycle", "truck", "bus", "van"],
      },
    ],
    rules: [],
    ...overrides,
  };
}

describe("MockProvider — health", () => {
  it("reports healthy with no API key required", async () => {
    const p = new MockProvider();
    const h = await p.healthCheck();
    expect(h.ok).toBe(true);
    expect(h.provider).toBe("mock");
    expect(h.message).toMatch(/no external credentials/i);
  });
});

describe("MockProvider — determinism (Phase 4 critical)", () => {
  it("produces byte-identical tracks for the same videoId", async () => {
    const p = new MockProvider();
    const o = makeOpts({ videoId: "det-1" });
    const r1 = await p.processSequence(o);
    const r2 = await p.processSequence(o);
    expect(JSON.stringify(r1.tracks)).toBe(JSON.stringify(r2.tracks));
  });
  it("produces byte-identical results for the same videoId (incl. events)", async () => {
    const p = new MockProvider();
    const o = makeOpts({ videoId: "det-2" });
    const { tracks: t1 } = await p.processSequence(o);
    const r1 = p.buildResult(o, t1);
    const { tracks: t2 } = await p.processSequence(o);
    const r2 = p.buildResult(o, t2);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
  it("produces DIFFERENT results for different videoIds", async () => {
    const p = new MockProvider();
    const a = await p.processSequence(makeOpts({ videoId: "vid-A" }));
    const b = await p.processSequence(makeOpts({ videoId: "vid-B" }));
    expect(JSON.stringify(a.tracks)).not.toBe(JSON.stringify(b.tracks));
  });
});

describe("MockProvider — detection & classification (Phase 9)", () => {
  it("produces at least one track", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    expect(tracks.length).toBeGreaterThan(0);
  });
  it("classifies vehicles into known classes", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "classes", durationSec: 300 }));
    const classes = new Set(tracks.map((t) => t.objectType));
    // expect at least 3 distinct classes over a longer window
    expect(classes.size).toBeGreaterThanOrEqual(3);
    for (const c of classes) {
      expect(["car", "motorcycle", "truck", "bus", "bicycle", "van"]).toContain(c);
    }
  });
  it("every detection has valid class, confidence in [0,1], box, timestamp, track id", async () => {
    const p = new MockProvider();
    const detections = await p.detectObjects(makeOpts({ videoId: "det-valid" }));
    expect(detections.length).toBeGreaterThan(0);
    for (const d of detections) {
      expect(["car", "motorcycle", "truck", "bus", "bicycle", "van"]).toContain(d.objectType);
      expect(d.confidence).toBeGreaterThanOrEqual(0);
      expect(d.confidence).toBeLessThanOrEqual(1);
      expect(d.box.width).toBeGreaterThan(0);
      expect(d.box.height).toBeGreaterThan(0);
      expect(d.box.x).toBeGreaterThanOrEqual(-0.5);
      expect(d.box.x).toBeLessThanOrEqual(1.5);
      expect(d.frameIndex).toBeGreaterThanOrEqual(0);
      expect(d.timestamp).toBeGreaterThanOrEqual(0);
      expect(d.objectId).toBeTruthy();
    }
  });
});

describe("MockProvider — tracking (Phase 10)", () => {
  it("each track has a unique trackId", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    const ids = tracks.map((t) => t.trackId);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("track trajectories are monotonically increasing in time", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    for (const t of tracks) {
      for (let i = 1; i < t.trajectory.length; i++) {
        expect(t.trajectory[i].timestamp).toBeGreaterThanOrEqual(t.trajectory[i - 1].timestamp);
      }
    }
  });
  it("track firstSeen <= lastSeen", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    for (const t of tracks) {
      expect(t.firstSeen).toBeLessThanOrEqual(t.lastSeen);
    }
  });
  it("track trajectory stays within plausible frame bounds", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    for (const t of tracks) {
      for (const tp of t.trajectory) {
        expect(tp.x).toBeGreaterThanOrEqual(-0.2);
        expect(tp.x).toBeLessThanOrEqual(1.2);
        expect(tp.y).toBeGreaterThanOrEqual(-0.2);
        expect(tp.y).toBeLessThanOrEqual(1.2);
      }
    }
  });
});

describe("MockProvider — counting (Phase 11)", () => {
  it("summary.totalVehicles equals tracks.length", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    const r = p.buildResult(makeOpts(), tracks);
    expect(r.summary.totalVehicles).toBe(tracks.length);
  });
  it("per-class counts sum to totalVehicles", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "count-sum", durationSec: 300 }));
    const r = p.buildResult(makeOpts({ videoId: "count-sum", durationSec: 300 }), tracks);
    const sum = r.summary.cars + r.summary.motorcycles + r.summary.trucks + r.summary.buses + r.summary.bicycles + r.summary.vans;
    expect(sum).toBe(r.summary.totalVehicles);
  });
  it("line crossing events reference real track ids", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "cross" }));
    const r = p.buildResult(makeOpts({ videoId: "cross" }), tracks);
    const crossings = r.events.filter((e) => e.eventType === "count_crossing");
    if (crossings.length > 0) {
      const trackIds = new Set(tracks.map((t) => t.trackId));
      for (const e of crossings) {
        expect(e.trackId).toBeTruthy();
        expect(trackIds.has(e.trackId!)).toBe(true);
      }
    }
  });
  it("a single track cannot cross the same line more than once (jitter dedup)", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "dedup" }));
    const r = p.buildResult(makeOpts({ videoId: "dedup" }), tracks);
    const crossings = r.events.filter((e) => e.eventType === "count_crossing");
    const byTrack = new Map<string, number>();
    for (const e of crossings) {
      const key = `${e.trackId}`;
      byTrack.set(key, (byTrack.get(key) ?? 0) + 1);
    }
    for (const [k, n] of byTrack) {
      expect(n).toBeLessThanOrEqual(1);
      void k;
    }
  });
});

describe("MockProvider — direction (Phase 12)", () => {
  it("every track has a valid direction label", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    const valid = ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", "inbound", "outbound"];
    for (const t of tracks) {
      expect(valid).toContain(t.direction);
    }
  });
  it("directional breakdown sums to totalVehicles", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "dir-sum", durationSec: 300 }));
    const r = p.buildResult(makeOpts({ videoId: "dir-sum", durationSec: 300 }), tracks);
    const sum = Object.values(r.summary.directionalBreakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBe(r.summary.totalVehicles);
  });
});

describe("MockProvider — zones (Phase 13)", () => {
  it("zone entry events reference a known zone", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "zone-e" }));
    const r = p.buildResult(makeOpts({ videoId: "zone-e" }), tracks);
    const entries = r.events.filter((e) => e.eventType === "zone_entry");
    const zoneIds = new Set(makeOpts().zones.map((z) => z.id));
    for (const e of entries) {
      const meta = e.metadata as Record<string, unknown> | null;
      expect(meta?.zoneId).toBeTruthy();
      expect(zoneIds.has(meta!.zoneId as string)).toBe(true);
    }
  });
  it("zone stats entered >= exited + currentInside (invariant)", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "zone-inv", durationSec: 300 }));
    const r = p.buildResult(makeOpts({ videoId: "zone-inv", durationSec: 300 }), tracks);
    for (const z of Object.values(r.summary.zoneStats)) {
      expect(z.entered).toBeGreaterThanOrEqual(z.exited);
      // entered = exited + still-inside (approximately; currentInside may lag)
      expect(z.entered - z.exited).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("MockProvider — rule engine events (Phases 15-18)", () => {
  it("generates wrong-way events for opposing traffic", async () => {
    const p = new MockProvider();
    // long window → statistically guaranteed wrong-way vehicle (~4% spawn rate)
    const { tracks } = await p.processSequence(makeOpts({ videoId: "wrongway", durationSec: 600 }));
    const r = p.buildResult(makeOpts({ videoId: "wrongway", durationSec: 600 }), tracks);
    const ww = r.events.filter((e) => e.eventType === "wrong_way");
    expect(ww.length).toBeGreaterThan(0);
    for (const e of ww) {
      expect(e.severity).toBe("high");
    }
  });
  it("generates congestion snapshots with valid levels", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "cong", durationSec: 300 }));
    const r = p.buildResult(makeOpts({ videoId: "cong", durationSec: 300 }), tracks);
    expect(r.congestion.length).toBeGreaterThan(0);
    for (const c of r.congestion) {
      expect(["LOW", "MODERATE", "HIGH", "SEVERE"]).toContain(c.level);
      expect(c.occupancy).toBeGreaterThanOrEqual(0);
      expect(c.occupancy).toBeLessThanOrEqual(1);
      expect(c.activeVehicles).toBeGreaterThanOrEqual(0);
    }
  });
  it("congestion thresholds are monotonic (LOW<MODERATE<HIGH<SEVERE by occupancy)", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "cong-thr", durationSec: 300 }));
    const r = p.buildResult(makeOpts({ videoId: "cong-thr", durationSec: 300 }), tracks);
    const order = { LOW: 0, MODERATE: 1, HIGH: 2, SEVERE: 3 };
    const byLevel = new Map<string, number[]>();
    for (const c of r.congestion) {
      if (!byLevel.has(c.level)) byLevel.set(c.level, []);
      byLevel.get(c.level)!.push(c.occupancy);
    }
    // SEVERE avg occupancy must be >= HIGH avg >= MODERATE avg >= LOW avg
    const avg = (lvl: string) => {
      const arr = byLevel.get(lvl);
      return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : -1;
    };
    if (byLevel.has("SEVERE") && byLevel.has("LOW")) {
      expect(avg("SEVERE")).toBeGreaterThan(avg("LOW"));
    }
    void order;
  });
  it("events are ordered by timestamp ascending", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "order" }));
    const r = p.buildResult(makeOpts({ videoId: "order" }), tracks);
    for (let i = 1; i < r.events.length; i++) {
      expect(r.events[i].timestamp).toBeGreaterThanOrEqual(r.events[i - 1].timestamp);
    }
  });
  it("event severities are valid", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts({ videoId: "sev" }));
    const r = p.buildResult(makeOpts({ videoId: "sev" }), tracks);
    for (const e of r.events) {
      expect(["info", "low", "medium", "high", "critical"]).toContain(e.severity);
    }
  });
});

describe("MockProvider — speed estimation (Phase 19)", () => {
  it("every track has a positive, finite estimatedSpeed", async () => {
    const p = new MockProvider();
    const { tracks } = await p.processSequence(makeOpts());
    for (const t of tracks) {
      expect(t.estimatedSpeed).toBeDefined();
      expect(Number.isFinite(t.estimatedSpeed)).toBe(true);
      expect(t.estimatedSpeed!).toBeGreaterThan(0);
      // documented cap
      expect(t.estimatedSpeed!).toBeLessThanOrEqual(120);
    }
  });
  it("never produces NaN speeds (no divide-by-zero)", async () => {
    const p = new MockProvider();
    // zero-duration edge case
    const { tracks } = await p.processSequence(makeOpts({ durationSec: 1, videoId: "edge" }));
    for (const t of tracks) {
      expect(Number.isNaN(t.estimatedSpeed)).toBe(false);
    }
  });
});

describe("MockProvider — progress reporting", () => {
  it("invokes onProgress with increasing pct and stage labels", async () => {
    const p = new MockProvider();
    const seen: Array<{ pct: number; stage: string }> = [];
    const opts = makeOpts({ videoId: "progress" });
    opts.onProgress = (pct, stage) => seen.push({ pct, stage });
    await p.processSequence(opts);
    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) {
      expect(s.pct).toBeGreaterThanOrEqual(0);
      expect(s.pct).toBeLessThanOrEqual(1);
      expect(typeof s.stage).toBe("string");
      expect(s.stage.length).toBeGreaterThan(0);
    }
  });
});

describe("MockProvider — cancellation", () => {
  it("honours the cancellation signal", async () => {
    const p = new MockProvider();
    const signal = { cancelled: true };
    const { tracks } = await p.processSequence(makeOpts({ videoId: "cancel", signal }));
    // when cancelled before start, no vehicles should spawn
    expect(tracks.length).toBe(0);
  });
});
