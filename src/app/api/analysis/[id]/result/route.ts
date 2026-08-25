import { NextRequest, NextResponse } from "next/server";
import { getAnalysisResult } from "@/lib/analysis-service";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await getAnalysisResult(id);
  if (!result) return NextResponse.json({ error: "Result not ready" }, { status: 404 });
  return NextResponse.json({ result });
}
