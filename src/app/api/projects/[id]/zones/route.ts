import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const zones = await db.zone.findMany({ where: { projectId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ zones });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const zone = await db.zone.create({
    data: {
      projectId: id,
      name,
      polygon: JSON.stringify(body.polygon || []),
      zoneType: String(body.zoneType || "zone"),
      color: String(body.color || "#10b981"),
    },
  });
  return NextResponse.json({ zone }, { status: 201 });
}
