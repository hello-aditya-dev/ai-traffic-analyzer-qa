import { NextRequest, NextResponse } from "next/server";
import { getAnalysisResult } from "@/lib/analysis-service";
import { generateHtmlReport } from "@/lib/report-generator";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get("analysisId");
  const title = searchParams.get("title") || undefined;
  const author = searchParams.get("author") || undefined;
  const companyName = searchParams.get("companyName") || undefined;
  if (!analysisId) return NextResponse.json({ error: "analysisId required" }, { status: 400 });

  const result = await getAnalysisResult(analysisId);
  const analysis = await db.analysisRun.findUnique({ where: { id: analysisId }, include: { video: true, project: true } });
  if (!result || !analysis) return NextResponse.json({ error: "Result not found" }, { status: 404 });

  const html = generateHtmlReport({
    analysisId,
    projectName: analysis.project.name,
    projectLocation: analysis.project.location,
    projectDescription: analysis.project.description,
    videoFilename: analysis.video.filename,
    videoDuration: analysis.video.duration,
    videoWidth: analysis.video.width,
    videoHeight: analysis.video.height,
    videoFps: analysis.video.fps,
    provider: analysis.provider,
    startedAt: analysis.startedAt,
    completedAt: analysis.completedAt,
    result,
    title,
    author,
    companyName,
  });

  // Record report generation
  await db.report.create({
    data: {
      projectId: analysis.projectId,
      analysisId: analysis.id,
      format: "html",
      path: `reports/${analysis.id}`,
      title: title || analysis.project.name,
      author,
      companyName,
    },
  });

  const safeName = (analysis.project.name || "traffic-report").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeName}-report.html"`,
    },
  });
}
