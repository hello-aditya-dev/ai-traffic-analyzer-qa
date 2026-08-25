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

  // Build CSV: tracks sheet + events sheet + summary sheet (combined)
  const rows: string[] = [];
  rows.push("# Tracks");
  rows.push("track_id,class,first_seen,last_seen,direction,estimated_speed_kmh,confidence");
  for (const t of result.tracks) {
    rows.push([t.trackId, t.objectType, t.firstSeen.toFixed(2), t.lastSeen.toFixed(2), t.direction, t.estimatedSpeed ?? "", t.averageConfidence.toFixed(2)].join(","));
  }
  rows.push("");
  rows.push("# Events");
  rows.push("event_id,type,severity,timestamp,track_id,metadata");
  for (const e of result.events) {
    rows.push([e.id, e.eventType, e.severity, e.timestamp.toFixed(2), e.trackId ?? "", JSON.stringify(e.metadata ?? {})].join(","));
  }
  rows.push("");
  rows.push("# Summary");
  rows.push("metric,value");
  const s = result.summary;
  rows.push(`total_vehicles,${s.totalVehicles}`);
  rows.push(`cars,${s.cars}`);
  rows.push(`motorcycles,${s.motorcycles}`);
  rows.push(`trucks,${s.trucks}`);
  rows.push(`buses,${s.buses}`);
  rows.push(`bicycles,${s.bicycles}`);
  rows.push(`vans,${s.vans}`);
  rows.push(`inbound,${s.inboundCount}`);
  rows.push(`outbound,${s.outboundCount}`);
  rows.push(`peak_volume,${s.peakVolume}`);
  rows.push(`peak_volume_time_sec,${s.peakVolumeTime}`);
  rows.push(`avg_occupancy,${s.avgOccupancy.toFixed(3)}`);
  rows.push(`total_events,${s.totalEvents}`);
  rows.push(`congestion_level,${s.congestionLevel}`);

  const csv = rows.join("\n");
  const safeName = (analysis.project.name || "analysis").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}-tracks-events.csv"`,
    },
  });
}
