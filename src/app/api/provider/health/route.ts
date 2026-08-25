import { NextRequest, NextResponse } from "next/server";
import { getProvider, PROVIDER_LABELS } from "@/providers/registry";
import { config } from "@/lib/config";

export async function GET() {
  const provider = getProvider();
  const health = await provider.healthCheck();
  return NextResponse.json({
    provider: provider.name,
    label: PROVIDER_LABELS[provider.name] ?? provider.name,
    health,
    configured: {
      aiProvider: config.aiProvider,
      aiApiBaseUrl: config.aiApiBaseUrl ? "(set)" : "(not set)",
      aiApiKey: config.aiApiKey ? "(set)" : "(not set)",
      aiModel: config.aiModel || "(default)",
      defaultFrameRate: config.defaultFrameRate,
    },
  });
}
