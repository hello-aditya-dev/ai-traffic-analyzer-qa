import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [projects, videos, analyses, events, tracks] = await Promise.all([
    db.project.count(),
    db.videoAsset.count(),
    db.analysisRun.count(),
    db.event.count(),
    db.track.count(),
  ]);
  const completedAnalyses = await db.analysisRun.count({ where: { status: "COMPLETED" } });
  const recentAnalyses = await db.analysisRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { project: true, video: true },
  });
  const recentEvents = await db.event.findMany({
    orderBy: { timestamp: "desc" },
    take: 8,
    include: { analysis: { include: { project: true } } },
  });

  // Aggregate vehicle class totals across all completed analyses
  const allAnalyses = await db.analysisRun.findMany({
    where: { status: "COMPLETED" },
    include: { tracks: true, events: true },
  });
  const classCounts: Record<string, number> = {};
  for (const a of allAnalyses) for (const t of a.tracks) classCounts[t.objectType] = (classCounts[t.objectType] || 0) + 1;
  const dirCounts: Record<string, number> = {};
  for (const a of allAnalyses) for (const t of a.tracks) dirCounts[t.direction] = (dirCounts[t.direction] || 0) + 1;
  const eventCounts: Record<string, number> = {};
  for (const a of allAnalyses) for (const e of a.events) eventCounts[e.eventType] = (eventCounts[e.eventType] || 0) + 1;

  return NextResponse.json({
    counts: { projects, videos, analyses, completedAnalyses, events, tracks },
    classCounts,
    dirCounts,
    eventCounts,
    recentAnalyses,
    recentEvents,
  });
}
