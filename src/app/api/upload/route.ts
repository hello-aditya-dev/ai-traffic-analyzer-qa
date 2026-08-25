import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  const file = form.get("file") as File | null;
  const projectId = String(form.get("projectId") || "");
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const maxSize = config.maxUploadMb * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: `File exceeds ${config.maxUploadMb}MB limit` }, { status: 413 });

  // Validate extension — NEVER trust the browser-provided MIME type.
  const allowed = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowed.includes(ext)) return NextResponse.json({ error: `Unsupported format. Allowed: ${allowed.join(", ")}` }, { status: 415 });

  // Reject empty files.
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });

  // Sanitize filename — strip path components and dangerous chars.
  // Step 1: take only the basename (last path segment) so traversal is impossible.
  const basename = file.name.replace(/[\\/]/g, "/").split("/").pop() || "upload";
  // Step 2: remove anything that is not a safe filename char.
  // Step 3: collapse any remaining ".." sequences (e.g. "..etc") to prevent traversal.
  let safeBase = basename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".").replace(/^\.+/, "");
  if (!safeBase) safeBase = "upload";
  safeBase = safeBase.slice(0, 80);
  const internalId = randomUUID();
  const dir = path.join(process.cwd(), config.videoStoragePath, projectId);
  await mkdir(dir, { recursive: true });
  const storedName = `${internalId}${ext}`;
  const fullPath = path.join(dir, storedName);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  // Persist video asset (metadata defaults; real extraction would use FFprobe/FFmpeg).
  const video = await db.videoAsset.create({
    data: {
      projectId,
      filename: safeBase,
      filePath: `${config.videoStoragePath}/${projectId}/${storedName}`,
      duration: 180,
      width: 1280,
      height: 720,
      fps: 30,
      frameCount: 5400,
      status: "READY",
    },
  });
  return NextResponse.json({ video }, { status: 201 });
}
