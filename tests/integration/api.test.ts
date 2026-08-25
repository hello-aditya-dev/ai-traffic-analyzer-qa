/**
 * Integration tests for the AI Traffic Analyzer API routes.
 *
 * Strategy: call the route handler functions DIRECTLY with constructed
 * NextRequest objects (no HTTP server). Uses the REAL test SQLite database
 * and the REAL mock provider — nothing is mocked.
 *
 * Each test starts with a clean DB via `resetDb()` in beforeEach.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../fixtures/db";
import { db } from "@/lib/db";

// Route handlers — aliased to avoid name collisions across route files.
import { GET as getProjects, POST as postProject } from "@/app/api/projects/route";
import {
  GET as getProjectById,
  PATCH as patchProjectById,
  DELETE as deleteProjectById,
} from "@/app/api/projects/[id]/route";
import {
  GET as getZonesForProject,
  POST as postZoneForProject,
} from "@/app/api/projects/[id]/zones/route";
import {
  PATCH as patchZone,
  DELETE as deleteZone,
} from "@/app/api/zones/[id]/route";
import {
  GET as getRulesForProject,
  POST as postRuleForProject,
} from "@/app/api/projects/[id]/rules/route";
import {
  PATCH as patchRule,
  DELETE as deleteRule,
} from "@/app/api/rules/[id]/route";
import { GET as getAnalyses, POST as postAnalysis } from "@/app/api/analysis/route";
import { GET as getAnalysisById } from "@/app/api/analysis/[id]/route";
import { POST as startAnalysis } from "@/app/api/analysis/[id]/start/route";
import { GET as getAnalysisResult } from "@/app/api/analysis/[id]/result/route";
import { GET as getStatsOverview } from "@/app/api/stats/overview/route";
import { GET as getProviderHealth } from "@/app/api/provider/health/route";
import {
  GET as getProviderConfig,
  PATCH as patchProviderConfig,
} from "@/app/api/provider/config/route";
import { GET as getVideos } from "@/app/api/videos/route";
import { GET as exportCsv } from "@/app/api/exports/csv/route";
import { GET as exportJson } from "@/app/api/exports/json/route";
import { GET as exportReport } from "@/app/api/exports/report/route";

/* ------------------------------- helpers -------------------------------- */

type Ctx = { params: Promise<{ id: string }> };
const ctx = (id: string): Ctx => ({ params: Promise.resolve({ id }) });

function jsonReq(url: string, method: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function plainReq(url: string, method: string): NextRequest {
  return new NextRequest(url, { method });
}

/** Create a project through the API and return the parsed project record. */
async function createProject(name: string): Promise<{
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}> {
  const res = await postProject(jsonReq("http://localhost/api/projects", "POST", { name, location: "Testville" }));
  const body = (await res.json()) as { project: { id: string; name: string; description: string | null; location: string | null; createdAt: string; updatedAt: string } };
  return body.project;
}

/** Create a video asset directly via Prisma (no POST /api/videos route exists). */
async function createVideo(projectId: string, filename = "qa-test.mp4"): Promise<{ id: string; projectId: string; filename: string; duration: number; width: number; height: number; fps: number; frameCount: number; status: string }> {
  return db.videoAsset.create({
    data: {
      projectId,
      filename,
      filePath: "data/samples/" + filename,
      duration: 60,
      width: 1280,
      height: 720,
      fps: 30,
      frameCount: 1800,
      status: "READY",
    },
  });
}

/** Full end-to-end setup: project + video + zone + COUNT_CROSSING rule + analysis run + start. */
async function setupCompletedAnalysis(name = "QA Export Project"): Promise<{
  project: { id: string; name: string };
  video: { id: string; filename: string };
  analysisId: string;
}> {
  const project = await createProject(name);
  const video = await createVideo(project.id);

  // Add a zone covering the center of the frame.
  await postZoneForProject(
    jsonReq(`http://localhost/api/projects/${project.id}/zones`, "POST", {
      name: "Intersection",
      polygon: [
        { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 },
        { x: 0.7, y: 0.7 }, { x: 0.3, y: 0.7 },
      ],
      zoneType: "zone",
      color: "#3b82f6",
    }),
    ctx(project.id),
  );

  // Add a COUNT_CROSSING rule with a horizontal line at y=0.5.
  await postRuleForProject(
    jsonReq(`http://localhost/api/projects/${project.id}/rules`, "POST", {
      name: "Main Line",
      ruleType: "COUNT_CROSSING",
      parameters: {
        name: "Main Line",
        start: { x: 0, y: 0.5 },
        end: { x: 1, y: 0.5 },
        inboundLabel: "Inbound",
        outboundLabel: "Outbound",
        classes: ["car", "truck", "bus", "van", "motorcycle"],
      },
      enabled: true,
    }),
    ctx(project.id),
  );

  // Create an analysis run.
  const analysisRes = await postAnalysis(
    jsonReq("http://localhost/api/analysis", "POST", {
      projectId: project.id,
      videoId: video.id,
      provider: "mock",
      frameRate: 2,
      confidence: 0.5,
      maxFrames: 500,
      resolution: "720p",
    }),
  );
  const analysisBody = (await analysisRes.json()) as { analysis: { id: string } };

  // Start the analysis (synchronous in the mock provider).
  await startAnalysis(
    plainReq(`http://localhost/api/analysis/${analysisBody.analysis.id}/start`, "POST"),
    ctx(analysisBody.analysis.id),
  );

  return { project, video, analysisId: analysisBody.analysis.id };
}

/* ------------------------------ test setup ------------------------------ */

beforeEach(async () => {
  await resetDb();
});

/* ============================ 1. PROJECTS =============================== */

describe("Projects API", () => {
  it("POST /api/projects creates a project (201)", async () => {
    const res = await postProject(jsonReq("http://localhost/api/projects", "POST", { name: "Alpha", description: "d", location: "L" }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { project: { id: string; name: string; description: string; location: string } };
    expect(body.project.id).toBeTruthy();
    expect(body.project.name).toBe("Alpha");
    expect(body.project.description).toBe("d");
    expect(body.project.location).toBe("L");
  });

  it("POST /api/projects with missing name returns 400", async () => {
    const res = await postProject(jsonReq("http://localhost/api/projects", "POST", { description: "no name" }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/name/i);
  });

  it("GET /api/projects lists projects", async () => {
    await createProject("P1");
    await createProject("P2");
    const res = await getProjects();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { projects: Array<{ id: string; name: string }> };
    expect(body.projects).toHaveLength(2);
    expect(body.projects.map((p) => p.name).sort()).toEqual(["P1", "P2"]);
  });

  it("GET /api/projects/[id] returns a project by id", async () => {
    const p = await createProject("Single");
    const res = await getProjectById(plainReq(`http://localhost/api/projects/${p.id}`, "GET"), ctx(p.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { project: { id: string; name: string; zones: unknown[]; rules: unknown[]; videos: unknown[]; analyses: unknown[] } };
    expect(body.project.id).toBe(p.id);
    expect(body.project.name).toBe("Single");
    expect(Array.isArray(body.project.zones)).toBe(true);
    expect(Array.isArray(body.project.rules)).toBe(true);
  });

  it("GET /api/projects/[id] returns 404 for nonexistent id", async () => {
    const res = await getProjectById(plainReq("http://localhost/api/projects/nonexistent", "GET"), ctx("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("PATCH /api/projects/[id] renames a project", async () => {
    const p = await createProject("OldName");
    const res = await patchProjectById(jsonReq(`http://localhost/api/projects/${p.id}`, "PATCH", { name: "NewName", description: "updated" }), ctx(p.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { project: { name: string; description: string } };
    expect(body.project.name).toBe("NewName");
    expect(body.project.description).toBe("updated");
  });

  it("DELETE /api/projects/[id] deletes a project", async () => {
    const p = await createProject("ToDelete");
    const res = await deleteProjectById(plainReq(`http://localhost/api/projects/${p.id}`, "DELETE"), ctx(p.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    // Confirm gone
    const after = await getProjectById(plainReq(`http://localhost/api/projects/${p.id}`, "GET"), ctx(p.id));
    expect(after.status).toBe(404);
  });

  it("DELETE /api/projects/[id] returns 404 for nonexistent id", async () => {
    // BUG: DELETE handler calls db.project.delete() with no try/catch; on a
    // nonexistent id Prisma throws P2025 and the request rejects instead of
    // returning a clean 404. The assertion below documents the expected
    // behavior — the test will currently fail (rejected promise).
    const res = await deleteProjectById(plainReq("http://localhost/api/projects/nonexistent", "DELETE"), ctx("nonexistent"));
    expect(res.status).toBe(404);
  });
});

/* ============================== 2. ZONES =============================== */

describe("Zones API", () => {
  it("POST /api/projects/[id]/zones creates a zone (201)", async () => {
    const p = await createProject("ZP");
    const res = await postZoneForProject(
      jsonReq(`http://localhost/api/projects/${p.id}/zones`, "POST", {
        name: "Box",
        polygon: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }],
        zoneType: "lane",
        color: "#ff0000",
      }),
      ctx(p.id),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { zone: { id: string; name: string; polygon: string; zoneType: string; color: string } };
    expect(body.zone.id).toBeTruthy();
    expect(body.zone.name).toBe("Box");
    expect(body.zone.zoneType).toBe("lane");
    expect(body.zone.color).toBe("#ff0000");
    const polygon = JSON.parse(body.zone.polygon) as Array<{ x: number; y: number }>;
    expect(polygon).toHaveLength(2);
  });

  it("POST /api/projects/[id]/zones with missing name returns 400", async () => {
    const p = await createProject("ZP2");
    const res = await postZoneForProject(
      jsonReq(`http://localhost/api/projects/${p.id}/zones`, "POST", { polygon: [] }),
      ctx(p.id),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/name/i);
  });

  it("GET /api/projects/[id]/zones lists zones for a project", async () => {
    const p = await createProject("ZP3");
    await postZoneForProject(jsonReq(`http://localhost/api/projects/${p.id}/zones`, "POST", { name: "A" }), ctx(p.id));
    await postZoneForProject(jsonReq(`http://localhost/api/projects/${p.id}/zones`, "POST", { name: "B" }), ctx(p.id));
    const res = await getZonesForProject(plainReq(`http://localhost/api/projects/${p.id}/zones`, "GET"), ctx(p.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { zones: Array<{ name: string }> };
    expect(body.zones).toHaveLength(2);
    expect(body.zones.map((z) => z.name)).toEqual(["A", "B"]);
  });

  it("PATCH /api/zones/[id] updates name, color, and polygon", async () => {
    const p = await createProject("ZP4");
    const createRes = await postZoneForProject(
      jsonReq(`http://localhost/api/projects/${p.id}/zones`, "POST", {
        name: "Orig",
        polygon: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        color: "#000000",
      }),
      ctx(p.id),
    );
    const { zone } = (await createRes.json()) as { zone: { id: string } };

    const res = await patchZone(
      jsonReq(`http://localhost/api/zones/${zone.id}`, "PATCH", {
        name: "Renamed",
        color: "#abcdef",
        polygon: [{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.6 }],
      }),
      ctx(zone.id),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { zone: { name: string; color: string; polygon: string } };
    expect(body.zone.name).toBe("Renamed");
    expect(body.zone.color).toBe("#abcdef");
    const polygon = JSON.parse(body.zone.polygon) as Array<{ x: number; y: number }>;
    expect(polygon).toEqual([{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.6 }]);
  });

  it("DELETE /api/zones/[id] removes a zone", async () => {
    const p = await createProject("ZP5");
    const createRes = await postZoneForProject(jsonReq(`http://localhost/api/projects/${p.id}/zones`, "POST", { name: "X" }), ctx(p.id));
    const { zone } = (await createRes.json()) as { zone: { id: string } };
    const res = await deleteZone(plainReq(`http://localhost/api/zones/${zone.id}`, "DELETE"), ctx(zone.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    // Verify it's gone
    const listRes = await getZonesForProject(plainReq(`http://localhost/api/projects/${p.id}/zones`, "GET"), ctx(p.id));
    const list = (await listRes.json()) as { zones: unknown[] };
    expect(list.zones).toHaveLength(0);
  });
});

/* ============================== 3. RULES =============================== */

describe("Rules API", () => {
  it("POST /api/projects/[id]/rules creates a COUNT_CROSSING rule (201)", async () => {
    const p = await createProject("RP");
    const res = await postRuleForProject(
      jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", {
        name: "Main Line",
        ruleType: "COUNT_CROSSING",
        parameters: {
          start: { x: 0, y: 0.5 },
          end: { x: 1, y: 0.5 },
          inboundLabel: "Inbound",
          outboundLabel: "Outbound",
          classes: ["car", "truck"],
        },
        enabled: true,
      }),
      ctx(p.id),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { rule: { id: string; name: string; ruleType: string; parametersJson: string | null; enabled: boolean } };
    expect(body.rule.id).toBeTruthy();
    expect(body.rule.name).toBe("Main Line");
    expect(body.rule.ruleType).toBe("COUNT_CROSSING");
    expect(body.rule.enabled).toBe(true);
    expect(body.rule.parametersJson).toBeTruthy();
    const params = JSON.parse(body.rule.parametersJson as string) as { start: { x: number; y: number }; classes: string[] };
    expect(params.start).toEqual({ x: 0, y: 0.5 });
    expect(params.classes).toEqual(["car", "truck"]);
  });

  it("POST /api/projects/[id]/rules with missing name returns 400", async () => {
    const p = await createProject("RP2");
    const res = await postRuleForProject(
      jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", { ruleType: "ZONE_ENTRY" }),
      ctx(p.id),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/name/i);
  });

  it("GET /api/projects/[id]/rules lists rules for a project", async () => {
    const p = await createProject("RP3");
    await postRuleForProject(jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", { name: "R1", ruleType: "ZONE_ENTRY" }), ctx(p.id));
    await postRuleForProject(jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", { name: "R2", ruleType: "WRONG_WAY" }), ctx(p.id));
    const res = await getRulesForProject(plainReq(`http://localhost/api/projects/${p.id}/rules`, "GET"), ctx(p.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rules: Array<{ name: string; ruleType: string }> };
    expect(body.rules).toHaveLength(2);
    expect(body.rules.map((r) => r.name)).toEqual(["R1", "R2"]);
  });

  it("PATCH /api/rules/[id] toggles the enabled flag", async () => {
    const p = await createProject("RP4");
    const createRes = await postRuleForProject(jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", { name: "Tog", ruleType: "ZONE_ENTRY" }), ctx(p.id));
    const { rule } = (await createRes.json()) as { rule: { id: string; enabled: boolean } };
    expect(rule.enabled).toBe(true);

    const res = await patchRule(jsonReq(`http://localhost/api/rules/${rule.id}`, "PATCH", { enabled: false }), ctx(rule.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rule: { enabled: boolean } };
    expect(body.rule.enabled).toBe(false);
  });

  it("DELETE /api/rules/[id] removes a rule", async () => {
    const p = await createProject("RP5");
    const createRes = await postRuleForProject(jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", { name: "Del", ruleType: "ZONE_ENTRY" }), ctx(p.id));
    const { rule } = (await createRes.json()) as { rule: { id: string } };
    const res = await deleteRule(plainReq(`http://localhost/api/rules/${rule.id}`, "DELETE"), ctx(rule.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    const listRes = await getRulesForProject(plainReq(`http://localhost/api/projects/${p.id}/rules`, "GET"), ctx(p.id));
    const list = (await listRes.json()) as { rules: unknown[] };
    expect(list.rules).toHaveLength(0);
  });
});

/* ============================ 4. ANALYSIS ============================== */

describe("Analysis API", () => {
  it("POST /api/analysis creates an analysis run (201)", async () => {
    const p = await createProject("AP");
    const v = await createVideo(p.id);
    const res = await postAnalysis(
      jsonReq("http://localhost/api/analysis", "POST", {
        projectId: p.id,
        videoId: v.id,
        provider: "mock",
        frameRate: 2,
        confidence: 0.5,
        maxFrames: 100,
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { analysis: { id: string; projectId: string; videoId: string; status: string; provider: string; configurationJson: string } };
    expect(body.analysis.id).toBeTruthy();
    expect(body.analysis.projectId).toBe(p.id);
    expect(body.analysis.videoId).toBe(v.id);
    expect(body.analysis.status).toBe("QUEUED");
    expect(body.analysis.provider).toBe("mock");
    const cfg = JSON.parse(body.analysis.configurationJson) as { frameRate: number; confidence: number; maxFrames: number };
    expect(cfg.frameRate).toBe(2);
    expect(cfg.maxFrames).toBe(100);
  });

  it("POST /api/analysis with missing projectId returns 400", async () => {
    const p = await createProject("AP2");
    const v = await createVideo(p.id);
    const res = await postAnalysis(
      jsonReq("http://localhost/api/analysis", "POST", { videoId: v.id }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/projectId/i);
  });

  it("GET /api/analysis lists all analyses", async () => {
    const p = await createProject("AP3");
    const v = await createVideo(p.id);
    await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: p.id, videoId: v.id }));
    await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: p.id, videoId: v.id }));
    const res = await getAnalyses(plainReq("http://localhost/api/analysis", "GET"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { analyses: Array<{ id: string }> };
    expect(body.analyses).toHaveLength(2);
  });

  it("GET /api/analysis?projectId= filters by project", async () => {
    const pA = await createProject("PA");
    const pB = await createProject("PB");
    const vA = await createVideo(pA.id);
    const vB = await createVideo(pB.id);
    await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: pA.id, videoId: vA.id }));
    await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: pB.id, videoId: vB.id }));

    const res = await getAnalyses(plainReq(`http://localhost/api/analysis?projectId=${pA.id}`, "GET"));
    const body = (await res.json()) as { analyses: Array<{ projectId: string }> };
    expect(body.analyses).toHaveLength(1);
    expect(body.analyses[0].projectId).toBe(pA.id);
  });

  it("GET /api/analysis/[id] returns an analysis by id", async () => {
    const p = await createProject("AP4");
    const v = await createVideo(p.id);
    const createRes = await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: p.id, videoId: v.id }));
    const { analysis } = (await createRes.json()) as { analysis: { id: string } };

    const res = await getAnalysisById(plainReq(`http://localhost/api/analysis/${analysis.id}`, "GET"), ctx(analysis.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { analysis: { id: string; video: { id: string }; project: { id: string }; events: unknown[]; tracks: unknown[] } };
    expect(body.analysis.id).toBe(analysis.id);
    expect(body.analysis.video.id).toBe(v.id);
    expect(body.analysis.project.id).toBe(p.id);
    expect(Array.isArray(body.analysis.events)).toBe(true);
    expect(Array.isArray(body.analysis.tracks)).toBe(true);
  });

  it("GET /api/analysis/[id] returns 404 for nonexistent id", async () => {
    const res = await getAnalysisById(plainReq("http://localhost/api/analysis/nonexistent", "GET"), ctx("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("POST /api/analysis/[id]/start runs the analysis to COMPLETED with tracks + events", async () => {
    const p = await createProject("AP5");
    const v = await createVideo(p.id);
    // Add a COUNT_CROSSING rule so events include count_crossing entries.
    await postRuleForProject(
      jsonReq(`http://localhost/api/projects/${p.id}/rules`, "POST", {
        name: "Line",
        ruleType: "COUNT_CROSSING",
        parameters: {
          start: { x: 0, y: 0.5 },
          end: { x: 1, y: 0.5 },
          inboundLabel: "In",
          outboundLabel: "Out",
          classes: ["car", "truck", "bus", "van", "motorcycle"],
        },
      }),
      ctx(p.id),
    );
    const createRes = await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: p.id, videoId: v.id, maxFrames: 200 }));
    const { analysis } = (await createRes.json()) as { analysis: { id: string } };

    const startRes = await startAnalysis(plainReq(`http://localhost/api/analysis/${analysis.id}/start`, "POST"), ctx(analysis.id));
    expect(startRes.status).toBe(200);
    const startBody = (await startRes.json()) as { ok: boolean };
    expect(startBody.ok).toBe(true);

    // Fetch the analysis and verify completion + persisted tracks/events.
    const getRes = await getAnalysisById(plainReq(`http://localhost/api/analysis/${analysis.id}`, "GET"), ctx(analysis.id));
    const getBody = (await getRes.json()) as { analysis: { id: string; status: string; tracks: Array<{ id: string }>; events: Array<{ id: string }> } };
    expect(getBody.analysis.status).toBe("COMPLETED");
    expect(getBody.analysis.tracks.length).toBeGreaterThan(0);
    expect(getBody.analysis.events.length).toBeGreaterThan(0);

    // Verify in DB directly as well.
    const dbTracks = await db.track.count({ where: { analysisId: analysis.id } });
    const dbEvents = await db.event.count({ where: { analysisId: analysis.id } });
    expect(dbTracks).toBeGreaterThan(0);
    expect(dbEvents).toBeGreaterThan(0);
  });

  it("GET /api/analysis/[id]/result returns the full result after analysis", async () => {
    const { analysisId } = await setupCompletedAnalysis("Result Project");
    const res = await getAnalysisResult(plainReq(`http://localhost/api/analysis/${analysisId}/result`, "GET"), ctx(analysisId));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      result: {
        tracks: Array<{ trackId: string }>;
        events: Array<{ id: string; eventType: string }>;
        summary: { totalVehicles: number; totalEvents: number; cars: number };
        timeSeries: unknown[];
        congestion: unknown[];
      };
    };
    expect(body.result.tracks.length).toBeGreaterThan(0);
    expect(body.result.events.length).toBeGreaterThan(0);
    expect(body.result.summary.totalVehicles).toBe(body.result.tracks.length);
    expect(body.result.summary.totalEvents).toBe(body.result.events.length);
    expect(body.result.timeSeries.length).toBeGreaterThan(0);
    expect(body.result.congestion.length).toBeGreaterThan(0);
  });
});

/* =========================== 5. STATS OVERVIEW ========================= */

describe("Stats overview API", () => {
  it("GET /api/stats/overview returns counts for all resource types", async () => {
    // Seed a small dataset.
    const { analysisId } = await setupCompletedAnalysis("Stats Project");

    const res = await getStatsOverview();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      counts: { projects: number; videos: number; analyses: number; completedAnalyses: number; events: number; tracks: number };
      classCounts: Record<string, number>;
      dirCounts: Record<string, number>;
      eventCounts: Record<string, number>;
      recentAnalyses: unknown[];
      recentEvents: unknown[];
    };
    expect(body.counts.projects).toBe(1);
    expect(body.counts.videos).toBe(1);
    expect(body.counts.analyses).toBe(1);
    expect(body.counts.completedAnalyses).toBe(1);
    expect(body.counts.tracks).toBeGreaterThan(0);
    expect(body.counts.events).toBeGreaterThan(0);
    expect(typeof body.classCounts).toBe("object");
    expect(typeof body.dirCounts).toBe("object");
    expect(typeof body.eventCounts).toBe("object");
    expect(Array.isArray(body.recentAnalyses)).toBe(true);
    expect(Array.isArray(body.recentEvents)).toBe(true);
    void analysisId;
  });
});

/* =========================== 6. PROVIDER HEALTH ======================== */

describe("Provider health API", () => {
  it("GET /api/provider/health returns provider mock with ok=true", async () => {
    const res = await getProviderHealth();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      provider: string;
      label: string;
      health: { ok: boolean; provider: string; latencyMs: number; message: string };
      configured: { aiProvider: string; aiApiKey: string; aiApiBaseUrl: string; aiModel: string; defaultFrameRate: number };
    };
    expect(body.provider).toBe("mock");
    expect(body.health.ok).toBe(true);
    expect(body.health.provider).toBe("mock");
    expect(typeof body.health.latencyMs).toBe("number");
    expect(typeof body.health.message).toBe("string");
    expect(body.configured.aiProvider).toBe("mock");
    expect(["(set)", "(not set)"]).toContain(body.configured.aiApiKey);
  });
});

/* =========================== 7. PROVIDER CONFIG ======================== */

describe("Provider config API", () => {
  it("GET /api/provider/config returns null config when none exists", async () => {
    const res = await getProviderConfig();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { config: null };
    expect(body.config).toBeNull();
  });

  it("PATCH /api/provider/config updates fields and masks apiKey in response", async () => {
    const res = await patchProviderConfig(
      jsonReq("http://localhost/api/provider/config", "PATCH", {
        provider: "mock",
        apiKey: "super-secret-key",
        model: "gpt-4-vision",
        timeout: 60,
        frameRate: 4,
        confidence: 0.7,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { config: { provider: string; apiKey: string | null; model: string | null; timeout: number; frameRate: number; confidence: number } };
    expect(body.config.provider).toBe("mock");
    expect(body.config.model).toBe("gpt-4-vision");
    expect(body.config.timeout).toBe(60);
    expect(body.config.frameRate).toBe(4);
    expect(body.config.confidence).toBe(0.7);
    // The PATCH response must never reveal the real key.
    expect(body.config.apiKey).toBe("(set)");
  });

  it("GET /api/provider/config after PATCH masks the apiKey (does not reveal the real key)", async () => {
    // BUG: The GET handler returns the raw ProviderConfig record from the DB,
    // which includes the actual `apiKey` value. It should mask it as "(set)"
    // (or null) just like the PATCH handler does. The assertion below
    // documents the expected behavior — it will currently FAIL because GET
    // returns the raw key.
    await patchProviderConfig(
      jsonReq("http://localhost/api/provider/config", "PATCH", { apiKey: "leaked-secret-key" }),
    );
    const res = await getProviderConfig();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { config: { apiKey: string | null } };
    expect(body.config.apiKey).toBe("(set)");
  });
});

/* ============================== 8. VIDEOS ============================= */

describe("Videos API", () => {
  it("GET /api/videos lists all videos", async () => {
    const p = await createProject("VP");
    await createVideo(p.id, "v1.mp4");
    await createVideo(p.id, "v2.mp4");
    const res = await getVideos(plainReq("http://localhost/api/videos", "GET"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { videos: Array<{ id: string; filename: string }> };
    expect(body.videos).toHaveLength(2);
    expect(body.videos.map((v) => v.filename).sort()).toEqual(["v1.mp4", "v2.mp4"]);
  });

  it("GET /api/videos?projectId= filters by project", async () => {
    const pA = await createProject("VA");
    const pB = await createProject("VB");
    await createVideo(pA.id, "a.mp4");
    await createVideo(pB.id, "b.mp4");
    const res = await getVideos(plainReq(`http://localhost/api/videos?projectId=${pA.id}`, "GET"));
    const body = (await res.json()) as { videos: Array<{ filename: string; projectId: string }> };
    expect(body.videos).toHaveLength(1);
    expect(body.videos[0].filename).toBe("a.mp4");
    expect(body.videos[0].projectId).toBe(pA.id);
  });
});

/* ============================= 9. EXPORTS ============================= */

describe("Exports API", () => {
  it("GET /api/exports/csv returns text/csv with # Tracks header + data rows", async () => {
    const { analysisId } = await setupCompletedAnalysis("CSV Project");
    const res = await exportCsv(plainReq(`http://localhost/api/exports/csv?analysisId=${analysisId}`, "GET"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    const csv = await res.text();
    expect(csv).toContain("# Tracks");
    expect(csv).toContain("track_id,class,first_seen,last_seen,direction,estimated_speed_kmh,confidence");
    expect(csv).toContain("# Events");
    expect(csv).toContain("# Summary");
    expect(csv).toContain("total_vehicles,");
    // At least one data row (not just headers) — there must be a T#### track id.
    expect(csv).toMatch(/\bT\d+\b/);
  });

  it("GET /api/exports/csv returns 400 when analysisId is missing", async () => {
    const res = await exportCsv(plainReq("http://localhost/api/exports/csv", "GET"));
    expect(res.status).toBe(400);
  });

  it("GET /api/exports/json returns valid JSON with the result object", async () => {
    const { analysisId } = await setupCompletedAnalysis("JSON Project");
    const res = await exportJson(plainReq(`http://localhost/api/exports/json?analysisId=${analysisId}`, "GET"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await res.json()) as {
      exportedAt: string;
      analysis: { id: string; provider: string; status: string };
      project: { name: string };
      video: { filename: string };
      result: { tracks: unknown[]; events: unknown[]; summary: { totalVehicles: number } };
    };
    expect(body.exportedAt).toBeTruthy();
    expect(body.analysis.id).toBe(analysisId);
    expect(body.analysis.status).toBe("COMPLETED");
    expect(body.project.name).toBe("JSON Project");
    expect(body.result.tracks.length).toBeGreaterThan(0);
    expect(body.result.summary.totalVehicles).toBeGreaterThan(0);
  });

  it("GET /api/exports/report returns text/html containing project name + 'Traffic Analysis Report'", async () => {
    const { analysisId, project } = await setupCompletedAnalysis("HTML Project Name");
    const res = await exportReport(plainReq(`http://localhost/api/exports/report?analysisId=${analysisId}`, "GET"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain(project.name);
    expect(html).toContain("Traffic Analysis Report");
  });

  it("GET /api/exports/report returns 400 when analysisId is missing", async () => {
    const res = await exportReport(plainReq("http://localhost/api/exports/report", "GET"));
    expect(res.status).toBe(400);
  });

  it("GET /api/exports/json returns 404 when analysis has no result yet", async () => {
    const p = await createProject("NoResult");
    const v = await createVideo(p.id);
    const createRes = await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: p.id, videoId: v.id }));
    const { analysis } = (await createRes.json()) as { analysis: { id: string } };
    const res = await exportJson(plainReq(`http://localhost/api/exports/json?analysisId=${analysis.id}`, "GET"));
    expect(res.status).toBe(404);
  });
});

/* ======================= 10. PROJECT ISOLATION ======================== */

describe("Project isolation", () => {
  it("zones from project A do not appear in project B's zone list", async () => {
    const pA = await createProject("IsoA");
    const pB = await createProject("IsoB");

    // Create a zone under A.
    const createRes = await postZoneForProject(
      jsonReq(`http://localhost/api/projects/${pA.id}/zones`, "POST", { name: "A's zone" }),
      ctx(pA.id),
    );
    const { zone } = (await createRes.json()) as { zone: { id: string; name: string } };
    expect(zone.name).toBe("A's zone");

    // List B's zones — must NOT include A's zone.
    const listB = await getZonesForProject(plainReq(`http://localhost/api/projects/${pB.id}/zones`, "GET"), ctx(pB.id));
    const body = (await listB.json()) as { zones: Array<{ id: string; name: string }> };
    expect(body.zones).toHaveLength(0);
    expect(body.zones.find((z) => z.id === zone.id)).toBeUndefined();
  });

  it("analyses from project A do not appear when filtering by project B", async () => {
    const pA = await createProject("IsoAA");
    const pB = await createProject("IsoBB");
    const vA = await createVideo(pA.id);

    // Create an analysis under A.
    const createRes = await postAnalysis(jsonReq("http://localhost/api/analysis", "POST", { projectId: pA.id, videoId: vA.id }));
    const { analysis } = (await createRes.json()) as { analysis: { id: string; projectId: string } };
    expect(analysis.projectId).toBe(pA.id);

    // Filter analyses by B — must NOT include A's analysis.
    const res = await getAnalyses(plainReq(`http://localhost/api/analysis?projectId=${pB.id}`, "GET"));
    const body = (await res.json()) as { analyses: Array<{ id: string; projectId: string }> };
    expect(body.analyses).toHaveLength(0);
    expect(body.analyses.find((a) => a.id === analysis.id)).toBeUndefined();
  });

  it("rules from project A do not appear in project B's rule list", async () => {
    const pA = await createProject("IsoRuleA");
    const pB = await createProject("IsoRuleB");
    const createRes = await postRuleForProject(
      jsonReq(`http://localhost/api/projects/${pA.id}/rules`, "POST", { name: "A's rule", ruleType: "ZONE_ENTRY" }),
      ctx(pA.id),
    );
    const { rule } = (await createRes.json()) as { rule: { id: string } };

    const listB = await getRulesForProject(plainReq(`http://localhost/api/projects/${pB.id}/rules`, "GET"), ctx(pB.id));
    const body = (await listB.json()) as { rules: Array<{ id: string }> };
    expect(body.rules).toHaveLength(0);
    expect(body.rules.find((r) => r.id === rule.id)).toBeUndefined();
  });
});
