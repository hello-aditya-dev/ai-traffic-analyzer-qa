import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const analysis = await db.analysisRun.findUnique({
    where: { id },
    include: {
      video: true,
      project: { include: { zones: true, rules: true } },
      events: { orderBy: { timestamp: "asc" } },
      tracks: { orderBy: { firstSeen: "asc" } },
    },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ analysis });
}
