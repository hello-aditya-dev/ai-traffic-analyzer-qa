import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const videoId = searchParams.get("videoId");
  const analyses = await db.analysisRun.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(videoId ? { videoId } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: { video: true, project: true },
  });
  return NextResponse.json({ analyses });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId, videoId, provider, frameRate, confidence, maxFrames, resolution } = body;
  if (!projectId || !videoId) return NextResponse.json({ error: "projectId and videoId required" }, { status: 400 });
  const analysis = await db.analysisRun.create({
    data: {
      projectId,
      videoId,
      provider: provider || "mock",
      status: "QUEUED",
      configurationJson: JSON.stringify({ frameRate, confidence, maxFrames, resolution }),
    },
  });
  return NextResponse.json({ analysis }, { status: 201 });
}
