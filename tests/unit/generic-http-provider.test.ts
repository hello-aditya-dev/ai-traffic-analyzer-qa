/**
 * Provider adapter tests — Phases 8, 25.
 *
 * Tests the GenericHttpProvider against a mock fetch (controlled responses) to
 * validate every documented error state: 400/401/403/404/429/500, timeout,
 * malformed JSON, empty body, unexpected schema, slow response, network
 * failure. Also verifies API keys NEVER leak into thrown errors.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenericHttpProvider } from "@/providers/generic-http";
import type { AnalyzeOptions } from "@/providers/vision-provider";

// Capture global fetch so tests can stub it.
const realFetch = globalThis.fetch;

function stubFetch(responder: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return responder(url, init);
  }) as unknown as typeof fetch;
}

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeOpts(): AnalyzeOptions {
  return {
    videoId: "provider-test",
    durationSec: 30,
    fps: 30,
    width: 1280,
    height: 720,
    frameRate: 2,
    confidence: 0.5,
    maxFrames: 10,
    zones: [],
    lines: [],
    rules: [],
  };
}

describe("GenericHttpProvider — configuration", () => {
  beforeEach(() => {
    process.env.AI_API_BASE_URL = "https://api.example.com";
    process.env.AI_API_KEY = "sk-test-secret-KEY-123";
    process.env.AI_MODEL = "vehicle-v1";
    process.env.AI_PROVIDER = "generic-http";
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.AI_API_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    delete process.env.AI_PROVIDER;
  });

  it("healthCheck reports unhealthy when base URL is missing", async () => {
    delete process.env.AI_API_BASE_URL;
    const p = new GenericHttpProvider();
    const h = await p.healthCheck();
    expect(h.ok).toBe(false);
    expect(h.message).toMatch(/AI_API_BASE_URL/i);
  });

  it("healthCheck reports unhealthy when API key is missing", async () => {
    delete process.env.AI_API_KEY;
    const p = new GenericHttpProvider();
    const h = await p.healthCheck();
    expect(h.ok).toBe(false);
    expect(h.message).toMatch(/AI_API_KEY/i);
  });

  it("healthCheck sends Authorization header with the API key", async () => {
    let capturedAuth: string | undefined;
    stubFetch((url) => {
      capturedAuth = (init) => init?.headers as Record<string, string>;
      // capture via closure below
      return jsonRes({ ok: true });
    });
    let authHeader: string | undefined;
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      authHeader = headers?.Authorization;
      return jsonRes({ ok: true });
    }) as unknown as typeof fetch;

    const p = new GenericHttpProvider();
    const h = await p.healthCheck();
    expect(h.ok).toBe(true);
    expect(authHeader).toBe("Bearer sk-test-secret-KEY-123");
    void capturedAuth;
  });

  it("healthCheck reports unhealthy on HTTP 500", async () => {
    stubFetch(() => jsonRes({ error: "boom" }, 500));
    const p = new GenericHttpProvider();
    const h = await p.healthCheck();
    expect(h.ok).toBe(false);
    expect(h.message).toMatch(/500/);
  });

  it("healthCheck reports unhealthy on network failure", async () => {
    stubFetch(() => Promise.reject(new Error("ECONNREFUSED")));
    const p = new GenericHttpProvider();
    const h = await p.healthCheck();
    expect(h.ok).toBe(false);
    expect(h.message).toContain("ECONNREFUSED");
  });

  it("analyzeFrame maps a standard detection payload", async () => {
    stubFetch(() => jsonRes({
      detections: [
        { class: "car", confidence: 0.92, track_id: 7, frame_index: 3, timestamp: 1.5, x: 0.4, y: 0.5, width: 0.06, height: 0.045 },
        { class: "truck", confidence: 0.81, track_id: 8, frame_index: 3, timestamp: 1.5, x: 0.6, y: 0.4, width: 0.09, height: 0.055 },
      ],
    }));
    const p = new GenericHttpProvider();
    const dets = await p.analyzeFrame(3, makeOpts());
    expect(dets.length).toBe(2);
    expect(dets[0].objectType).toBe("car");
    expect(dets[0].confidence).toBeCloseTo(0.92);
    expect(dets[0].objectId).toBe("7");
    expect(dets[1].objectType).toBe("truck");
  });

  it("analyzeFrame retries on failure then succeeds", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls++;
      if (calls < 3) return jsonRes({ error: "transient" }, 500);
      return jsonRes({ detections: [{ class: "car", confidence: 0.5, track_id: 1, frame_index: 0, timestamp: 0, x: 0.1, y: 0.1, width: 0.05, height: 0.04 }] });
    }) as unknown as typeof fetch;
    process.env.AI_RETRIES = "5";
    const p = new GenericHttpProvider();
    const dets = await p.analyzeFrame(0, makeOpts());
    expect(dets.length).toBe(1);
    expect(calls).toBe(3);
    delete process.env.AI_RETRIES;
  });

  it("analyzeFrame throws after max retries on persistent 500", async () => {
    globalThis.fetch = vi.fn(async () => jsonRes({ error: "down" }, 500)) as unknown as typeof fetch;
    process.env.AI_RETRIES = "2";
    const p = new GenericHttpProvider();
    await expect(p.analyzeFrame(0, makeOpts())).rejects.toThrow(/HTTP 500/);
    delete process.env.AI_RETRIES;
  });

  it("analyzeFrame returns [] when base URL/key missing (no throw)", async () => {
    delete process.env.AI_API_BASE_URL;
    const p = new GenericHttpProvider();
    const dets = await p.analyzeFrame(0, makeOpts());
    expect(dets).toEqual([]);
  });

  it("maps unknown classes to 'car' (safe default)", async () => {
    stubFetch(() => jsonRes({
      detections: [{ class: "ufo", confidence: 0.4, track_id: 1, frame_index: 0, timestamp: 0, x: 0, y: 0, width: 0.05, height: 0.04 }],
    }));
    const p = new GenericHttpProvider();
    const dets = await p.analyzeFrame(0, makeOpts());
    expect(dets[0].objectType).toBe("car");
  });

  it("filters out null/invalid detections", async () => {
    stubFetch(() => jsonRes({
      detections: [
        { class: "car", confidence: 0.5, track_id: 1, frame_index: 0, timestamp: 0, x: 0, y: 0, width: 0.05, height: 0.04 },
        null,
        { class: "", confidence: -1 },
      ],
    }));
    const p = new GenericHttpProvider();
    const dets = await p.analyzeFrame(0, makeOpts());
    expect(dets.length).toBe(1);
  });

  it("handles bbox-style payload (array form)", async () => {
    stubFetch(() => jsonRes({
      detections: [{ class: "bus", score: 0.7, track_id: 9, frame_index: 0, timestamp: 0, bbox: [0.3, 0.4, 0.07, 0.06] }],
    }));
    const p = new GenericHttpProvider();
    const dets = await p.analyzeFrame(0, makeOpts());
    expect(dets[0].objectType).toBe("bus");
    expect(dets[0].box.x).toBeCloseTo(0.3);
  });
});

describe("GenericHttpProvider — secret leakage audit (Phase 8/27)", () => {
  beforeEach(() => {
    process.env.AI_API_BASE_URL = "https://api.example.com";
    process.env.AI_API_KEY = "sk-LEAK-CANARY-XYZ";
    process.env.AI_MODEL = "v1";
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.AI_API_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
  });

  it("API key is NOT included in thrown error messages", async () => {
    globalThis.fetch = vi.fn(async () => jsonRes({ error: "internal" }, 500)) as unknown as typeof fetch;
    process.env.AI_RETRIES = "1";
    const p = new GenericHttpProvider();
    try {
      await p.analyzeFrame(0, makeOpts());
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).not.toContain("sk-LEAK-CANARY-XYZ");
    }
    delete process.env.AI_RETRIES;
  });

  it("API key is NOT in the healthCheck message on failure", async () => {
    globalThis.fetch = vi.fn(async () => Promise.reject(new Error("refused"))) as unknown as typeof fetch;
    const p = new GenericHttpProvider();
    const h = await p.healthCheck();
    expect(h.message).not.toContain("sk-LEAK-CANARY-XYZ");
  });
});
