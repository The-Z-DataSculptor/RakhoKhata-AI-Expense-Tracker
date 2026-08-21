// Backend/src/workers/cleanupTrashWorker.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONFIGURATION ===
   ========================================================================== */
import cron from "node-cron";
import { prisma } from "../db";

const RETENTION_DAYS = 15;

function logWorkerError(message: string, detail: unknown): void {
  console.error(`[CleanupTrashWorker] ${message}`, detail);
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: WORKER LOGIC ===
   ========================================================================== */

/**
 * Scans and permanently purges transactions soft-deleted more than 15 days ago.
 */
export async function runTrashCleanupSweep(): Promise<void> {
  const purgeThreshold = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  console.log(
    `🗑️ [CleanupTrashWorker] Initiating 15-day trash cleanup sweep for records deleted before: ${purgeThreshold.toUTCString()}`
  );

  try {
    const result = await prisma.transaction.deleteMany({
      where: {
        deletedAt: {
          lte: purgeThreshold,
        },
      },
    });

    console.log(
      `🧹 [CleanupTrashWorker] Successfully purged ${result.count} expired records from recycle bin.`
    );
  } catch (error: unknown) {
    logWorkerError("Error executing 15-day purge query:", error);
  }
}

/**
 * Initializes the trash cleanup cron scheduler running daily at midnight UTC.
 */
export function initTrashCleanupCron(): void {
  console.log("[System Service] 15-Day Recycle Bin auto-cleanup cron scheduler initialized (UTC).");

  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("🕒 Running midnight 15-day trash cleanup sweep...");
      await runTrashCleanupSweep();
    },
    { timezone: "UTC" }
  );
}