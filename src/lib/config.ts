/**
 * Central application configuration.
 * Values resolve from environment variables with sensible defaults so the
 * product runs out-of-the-box with `AI_PROVIDER=mock` and no API key.
 *
 * IMPORTANT: getters read process.env lazily so that:
 *   - tests can override env per-test,
 *   - the Settings UI's persisted ProviderConfig can be reflected by setting
 *     process.env on save (see /api/provider/config PATCH which calls
 *     resetProviderCache() — note: full runtime provider swap still requires a
 *     process restart in V1; documented in QA_REPORT.md).
 */
function num(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(key: string, fallback: string): string {
  const v = process.env[key];
  return v === undefined || v === "" ? fallback : v;
}

export const config = {
  get aiProvider(): string {
    return str("AI_PROVIDER", "mock");
  },
  get aiApiBaseUrl(): string {
    return str("AI_API_BASE_URL", "");
  },
  get aiApiKey(): string {
    return str("AI_API_KEY", "");
  },
  get aiModel(): string {
    return str("AI_MODEL", "");
  },
  get videoStoragePath(): string {
    return str("VIDEO_STORAGE_PATH", "./storage/videos");
  },
  get outputStoragePath(): string {
    return str("OUTPUT_STORAGE_PATH", "./storage/outputs");
  },
  get maxUploadMb(): number {
    return num("MAX_UPLOAD_MB", 1024);
  },
  get defaultFrameRate(): number {
    return num("DEFAULT_FRAME_RATE", 2);
  },
  get timeout(): number {
    return num("AI_TIMEOUT", 30);
  },
  get retries(): number {
    return num("AI_RETRIES", 3);
  },
  get databaseUrl(): string {
    return str("DATABASE_URL", "file:./db/custom.db");
  },
  /** App metadata (static) */
  appVersion: "1.0.0",
  get environment(): string {
    return str("NODE_ENV", "development");
  },
} as const;

export type AppConfig = typeof config;
