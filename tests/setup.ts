/**
 * Vitest global setup.
 *
 * Uses a SEPARATE test database (db/test.db) so the dev database is never
 * touched. The schema is pushed once per test run; each integration test file
 * is responsible for cleaning its own data via the `resetDb` helper.
 *
 * IMPORTANT: this file runs before any test imports PrismaClient, so the
 * PrismaClient singleton picks up the test DATABASE_URL.
 */
import { execSync } from "child_process";

// Force test DB before anything imports PrismaClient.
process.env.DATABASE_URL = "file:" + process.cwd() + "/db/test.db";
process.env.AI_PROVIDER = "mock";
process.env.NODE_ENV = "test";

// Ensure the test schema exists.
let _schemaReady = false;
export async function ensureTestSchema() {
  if (_schemaReady) return;
  try {
    execSync("bunx prisma db push --skip-generate --accept-data-loss", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  } catch {
    // ignore — schema may already be in sync
  }
  _schemaReady = true;
}

// Run schema sync once at import time so it's ready when tests start.
ensureTestSchema();
