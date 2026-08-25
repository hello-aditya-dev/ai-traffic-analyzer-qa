/**
 * Helpers for integration tests that need a clean database.
 * Each `resetDb()` call wipes all tables so tests are isolated.
 */
import { db } from "@/lib/db";

export async function resetDb() {
  // Order matters for FK constraints; delete leaf-first.
  await db.event.deleteMany();
  await db.track.deleteMany();
  await db.report.deleteMany();
  await db.analysisRun.deleteMany();
  await db.rule.deleteMany();
  await db.zone.deleteMany();
  await db.camera.deleteMany();
  await db.videoAsset.deleteMany();
  await db.project.deleteMany();
  await db.providerConfig.deleteMany();
}

export async function seedMinimalProject() {
  const project = await db.project.create({
    data: {
      name: "QA Test Project",
      description: "Created by integration test",
      location: "Testville",
    },
  });
  const video = await db.videoAsset.create({
    data: {
      projectId: project.id,
      filename: "qa-test.mp4",
      filePath: "data/samples/qa-test.mp4",
      duration: 120,
      width: 1280,
      height: 720,
      fps: 30,
      frameCount: 3600,
      status: "READY",
    },
  });
  return { project, video };
}
