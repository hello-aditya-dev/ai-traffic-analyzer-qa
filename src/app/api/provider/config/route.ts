import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const cfg = await db.providerConfig.findFirst();
  // SECURITY: never return the raw API key to the client. Mask it like PATCH does.
  const masked = cfg ? { ...cfg, apiKey: cfg.apiKey ? "(set)" : null } : null;
  return NextResponse.json({ config: masked });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const existing = await db.providerConfig.findFirst();
  const data = {
    provider: body.provider ? String(body.provider) : existing?.provider ?? "mock",
    apiUrl: body.apiUrl !== undefined ? (body.apiUrl ? String(body.apiUrl) : null) : existing?.apiUrl,
    // Never return the real key in API responses; store only if a non-empty value is sent.
    apiKey: body.apiKey !== undefined && body.apiKey !== "" ? String(body.apiKey) : existing?.apiKey,
    model: body.model !== undefined ? (body.model ? String(body.model) : null) : existing?.model,
    timeout: body.timeout !== undefined ? Number(body.timeout) : existing?.timeout ?? 30,
    retries: body.retries !== undefined ? Number(body.retries) : existing?.retries ?? 3,
    frameRate: body.frameRate !== undefined ? Number(body.frameRate) : existing?.frameRate ?? 2,
    confidence: body.confidence !== undefined ? Number(body.confidence) : existing?.confidence ?? 0.5,
    maxFrames: body.maxFrames !== undefined ? Number(body.maxFrames) : existing?.maxFrames ?? 5000,
    resolution: body.resolution !== undefined ? String(body.resolution) : existing?.resolution ?? "720p",
  };
  let cfg;
  if (existing) {
    cfg = await db.providerConfig.update({ where: { id: existing.id }, data });
  } else {
    cfg = await db.providerConfig.create({ data });
  }
  return NextResponse.json({ config: { ...cfg, apiKey: cfg.apiKey ? "(set)" : null } });
}
