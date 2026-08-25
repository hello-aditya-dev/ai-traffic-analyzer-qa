/**
 * Provider registry — resolves the active VisionProvider from config.
 * Application code imports `getProvider()` and never references a concrete
 * provider class directly.
 */
import { config } from "@/lib/config";
import { MockProvider } from "@/providers/mock";
import { GenericHttpProvider } from "@/providers/generic-http";
import { LocalInferenceProvider } from "@/providers/local-inference";
import type { VisionProvider } from "@/providers/vision-provider";

let cached: VisionProvider | null = null;

export function getProvider(): VisionProvider {
  if (cached) return cached;
  const name = config.aiProvider.toLowerCase();
  switch (name) {
    case "generic-http":
      cached = new GenericHttpProvider();
      break;
    case "local-inference":
      cached = new LocalInferenceProvider();
      break;
    case "mock":
    default:
      cached = new MockProvider();
      break;
  }
  return cached;
}

export function resetProviderCache() {
  cached = null;
}

export const PROVIDER_LABELS: Record<string, string> = {
  mock: "Mock / Demo (no API key)",
  "generic-http": "Generic HTTP Vision Provider",
  "local-inference": "Local Inference Server (extension point)",
};
