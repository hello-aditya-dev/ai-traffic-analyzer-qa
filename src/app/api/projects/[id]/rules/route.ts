import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rules = await db.rule.findMany({ where: { projectId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const rule = await db.rule.create({
    data: {
      projectId: id,
      name,
      ruleType: String(body.ruleType || "ZONE_ENTRY"),
      parametersJson: body.parameters ? JSON.stringify(body.parameters) : null,
      enabled: body.enabled !== false,
    },
  });
  return NextResponse.json({ rule }, { status: 201 });
}
