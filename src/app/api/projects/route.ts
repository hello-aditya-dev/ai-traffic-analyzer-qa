import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { videos: true, analyses: true } },
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const project = await db.project.create({
    data: {
      name,
      description: body.description ? String(body.description) : null,
      location: body.location ? String(body.location) : null,
    },
  });
  return NextResponse.json({ project }, { status: 201 });
}
