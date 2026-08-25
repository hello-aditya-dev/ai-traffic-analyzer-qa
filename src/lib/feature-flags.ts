/**
 * Feature flags — a single configuration object.
 * Intentionally NOT a SaaS flagging platform; just a simple object.
 */
export const featureFlags = {
  rtsp: true,
  reports: true,
  pdfExport: true,
  excelExport: true,
  aiProviderModules: true,
  advancedAnalytics: true,
  demoMode: true,
} as const;

export type FeatureFlags = typeof featureFlags;
