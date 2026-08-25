import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "AI Traffic Analyzer API",
    version: "1.0.0",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
