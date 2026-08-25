/**
 * Database tests — Phase 26.
 *
 * Tests CRUD operations, foreign-key cascade behavior, and persistence against
 * the real test SQLite database.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../fixtures/db";

describe("Database — CRUD (Phase 26)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates and reads a project", async () => {
    const p = await db.project.create({ data: { name: "DB Test", location: "Here" } });
    const found = await db.project.findUnique({ where: { id: p.id } });
    expect(found?.name).toBe("DB Test");
    expect(found?.location).toBe("Here");
  });

  it("updates a project", async () => {
    const p = await db.project.create({ data: { name: "Old" } });
    await db.project.update({ where: { id: p.id }, data: { name: "New" } });
    const found = await db.project.findUnique({ where: { id: p.id } });
    expect(found?.name).toBe("New");
  });

  it("deletes a project", async () => {
    const p = await db.project.create({ data: { name: "To Delete" } });
    await db.project.delete({ where: { id: p.id } });
    const found = await db.project.findUnique({ where: { id: p.id } });
    expect(found).toBeNull();
  });
});

describe("Database — cascade behavior (Phase 26)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("deleting a project cascades to videos, analyses, zones, rules, events, tracks, reports", async () => {
    const project = await db.project.create({ data: { name: "Cascade Parent" } });
    const video = await db.videoAsset.create({ data: { projectId: project.id, filename: "v.mp4", filePath: "p", duration: 1, width: 1, height: 1, fps: 1, frameCount: 1, status: "READY" } });
    const analysis = await db.analysisRun.create({ data: { projectId: project.id, videoId: video.id, provider: "mock", status: "COMPLETED" } });
    await db.zone.create({ data: { projectId: project.id, name: "Z", polygon: "[]", zoneType: "zone", color: "#fff" } });
    await db.rule.create({ data: { projectId: project.id, name: "R", ruleType: "ZONE_ENTRY" } });
    await db.track.create({ data: { analysisId: analysis.id, trackId: "T1", objectType: "car", firstSeen: 0, lastSeen: 1, averageConfidence: 0.9, startX: 0, startY: 0, endX: 1, endY: 1, direction: "east" } });
    await db.event.create({ data: { analysisId: analysis.id, eventType: "zone_entry", severity: "info", timestamp: 0 } });
    await db.report.create({ data: { projectId: project.id, analysisId: analysis.id, format: "html", path: "r" } });

    await db.project.delete({ where: { id: project.id } });

    expect(await db.videoAsset.findFirst({ where: { projectId: project.id } })).toBeNull();
    expect(await db.analysisRun.findFirst({ where: { projectId: project.id } })).toBeNull();
    expect(await db.zone.findFirst({ where: { projectId: project.id } })).toBeNull();
    expect(await db.rule.findFirst({ where: { projectId: project.id } })).toBeNull();
    expect(await db.track.findFirst({ where: { analysisId: analysis.id } })).toBeNull();
    expect(await db.event.findFirst({ where: { analysisId: analysis.id } })).toBeNull();
    expect(await db.report.findFirst({ where: { projectId: project.id } })).toBeNull();
  });

  it("deleting an analysis cascades to tracks and events", async () => {
    const project = await db.project.create({ data: { name: "P" } });
    const video = await db.videoAsset.create({ data: { projectId: project.id, filename: "v", filePath: "p", duration: 1, width: 1, height: 1, fps: 1, frameCount: 1, status: "READY" } });
    const analysis = await db.analysisRun.create({ data: { projectId: project.id, videoId: video.id, provider: "mock", status: "COMPLETED" } });
    await db.track.create({ data: { analysisId: analysis.id, trackId: "T1", objectType: "car", firstSeen: 0, lastSeen: 1, averageConfidence: 0.9, startX: 0, startY: 0, endX: 1, endY: 1, direction: "east" } });
    await db.event.create({ data: { analysisId: analysis.id, eventType: "zone_entry", severity: "info", timestamp: 0 } });

    await db.analysisRun.delete({ where: { id: analysis.id } });

    expect(await db.track.findFirst({ where: { analysisId: analysis.id } })).toBeNull();
    expect(await db.event.findFirst({ where: { analysisId: analysis.id } })).toBeNull();
    // project + video survive
    expect(await db.project.findUnique({ where: { id: project.id } })).not.toBeNull();
    expect(await db.videoAsset.findUnique({ where: { id: video.id } })).not.toBeNull();
  });
});

describe("Database — persistence across reconnect (Phase 26)", () => {
  it("data survives a client disconnect+reconnect", async () => {
    await resetDb();
    const p = await db.project.create({ data: { name: "Persistent" } });
    await db.$disconnect();
    // Re-import a fresh client (simulating a process restart reading the same file).
    const { PrismaClient } = await import("@prisma/client");
    const fresh = new PrismaClient();
    const found = await fresh.project.findUnique({ where: { id: p.id } });
    expect(found?.name).toBe("Persistent");
    await fresh.$disconnect();
    // Re-establish the global client for subsequent tests.
    const { db: globalDb } = await import("@/lib/db");
    void globalDb;
  });
});
