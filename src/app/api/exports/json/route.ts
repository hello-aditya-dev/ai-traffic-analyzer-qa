import { NextRequest, NextResponse } from "next/server";
import { getAnalysisResult } from "@/lib/analysis-service";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get("analysisId");
  if (!analysisId) return NextResponse.json({ error: "analysisId required" }, { status: 400 });
  const result = await getAnalysisResult(analysisId);
  const analysis = await db.analysisRun.findUnique({ where: { id: analysisId }, include: { video: true, project: true } });
  if (!result || !analysis) return NextResponse.json({ error: "Result not found" }, { status: 404 });
  const payload = {
    exportedAt: new Date().toISOString(),
    analysis: {
      id: analysis.id,
      provider: analysis.provider,
      status: analysis.status,
      startedAt: analysis.startedAt,
      completedAt: analysis.completedAt,
    },
    project: { id: analysis.project.id, name: analysis.project.name, location: analysis.project.location },
    video: { id: analysis.video.id, filename: analysis.video.filename, duration: analysis.video.duration, width: analysis.video.width, height: analysis.video.height, fps: analysis.video.fps },
    result,
  };
  const safeName = (analysis.project.name || "analysis").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}-result.json"`,
    },
  });
}
