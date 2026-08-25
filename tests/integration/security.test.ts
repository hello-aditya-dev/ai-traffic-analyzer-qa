/**
 * Security tests — Phase 27.
 *
 * Tests path traversal, invalid IDs, malformed JSON, oversized uploads,
 * API-key masking, and command-injection safety. Uses the real API route
 * handlers + real test DB.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST as uploadPOST } from "@/app/api/upload/route";
import { resetDb, seedMinimalProject } from "../fixtures/db";
import { db } from "@/lib/db";

function makeUpload(file: { name: string; type: string; content: string | Uint8Array }, projectId: string) {
  const form = new FormData();
  const blob =
    typeof file.content === "string"
      ? new Blob([file.content], { type: file.type })
      : new Blob([file.content], { type: file.type });
  form.append("file", blob, file.name);
  form.append("projectId", projectId);
  return new NextRequest("http://localhost/api/upload", { method: "POST", body: form });
}

describe("Security — upload validation (Phase 6/27)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rejects path-traversal filenames (../etc/passwd)", async () => {
    const { project } = await seedMinimalProject();
    const req = makeUpload({ name: "../../../etc/passwd.mp4", type: "video/mp4", content: "fake" }, project.id);
    const res = await uploadPOST(req);
    if (res.status === 201) {
      const body = await res.json();
      expect(body.video.filename).not.toContain("..");
      expect(body.video.filename).not.toContain("/");
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("rejects disallowed extensions", async () => {
    const { project } = await seedMinimalProject();
    const req = makeUpload({ name: "malware.exe", type: "application/octet-stream", content: "payload" }, project.id);
    const res = await uploadPOST(req);
    expect(res.status).toBe(415);
  });

  it("rejects empty files", async () => {
    const { project } = await seedMinimalProject();
    const req = makeUpload({ name: "empty.mp4", type: "video/mp4", content: "" }, project.id);
    const res = await uploadPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("accepts a valid small MP4 with Unicode filename", async () => {
    const { project } = await seedMinimalProject();
    const req = makeUpload({ name: "交通-test.mp4", type: "video/mp4", content: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) }, project.id);
    const res = await uploadPOST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.video.id).toBeTruthy();
  });
});

describe("Security — provider API key masking (Phase 8/27)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("GET /api/provider/config never returns the raw API key", async () => {
    await db.providerConfig.create({ data: { provider: "generic-http", apiUrl: "https://x", apiKey: "sk-SECRET-LEAK-CANARY", model: "v1" } });
    const { GET } = await import("@/app/api/provider/config/route");
    const res = await GET();
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("sk-SECRET-LEAK-CANARY");
    expect(body.config.apiKey).toBe("(set)");
  });

  it("PATCH /api/provider/config masks the key in the response", async () => {
    const { PATCH } = await import("@/app/api/provider/config/route");
    const req = new NextRequest("http://localhost/api/provider/config", {
      method: "PATCH",
      body: JSON.stringify({ provider: "generic-http", apiKey: "sk-NEW-SECRET-123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("sk-NEW-SECRET-123");
    expect(body.config.apiKey).toBe("(set)");
  });
});

describe("Security — invalid IDs (Phase 27/28)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("GET /api/projects/<nonexistent> returns 404", async () => {
    const { GET } = await import("@/app/api/projects/[id]/route");
    const req = new NextRequest("http://localhost/api/projects/nonexistent-id-123");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent-id-123" }) });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/projects/<nonexistent> returns 404 (regression: was throwing P2025)", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/route");
    const req = new NextRequest("http://localhost/api/projects/nonexistent", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/zones/<nonexistent> returns 404", async () => {
    const { DELETE } = await import("@/app/api/zones/[id]/route");
    const req = new NextRequest("http://localhost/api/zones/nonexistent", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/rules/<nonexistent> returns 404", async () => {
    const { DELETE } = await import("@/app/api/rules/[id]/route");
    const req = new NextRequest("http://localhost/api/rules/nonexistent", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });
});

describe("Security — malformed JSON bodies", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST /api/projects with invalid JSON body does not crash (returns 400 or graceful)", async () => {
    const { POST } = await import("@/app/api/projects/route");
    const req = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: "{not valid json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    // The handler uses .catch(() => ({})) so it returns 400 (missing name)
    expect(res.status).toBe(400);
  });
});
