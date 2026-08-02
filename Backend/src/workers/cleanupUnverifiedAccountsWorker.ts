// Backend/src/workers/cleanupUnverifiedAccountsWorker.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import cron from "node-cron";
import { prisma } from "../db";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

function logCleanup(message: string): void {
  console.log(`[CleanupWorker] ${message}`);
}

function logCleanupError(message: string, detail?: unknown): void {
  console.error(`[CleanupWorker] ${message}`, detail ?? "");
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE ===
   ========================================================================== */

/**
 * Deletes all users whose email is not verified and whose account
 * was created more than **48 hours** ago.
 *
 * WHY 48 HOURS:
 * - Users receive a reminder at 24 hours.
 * - If still unverified after 48 hours, the account is permanently deleted.
 */
async function purgeUnverifiedAccounts(): Promise<void> {
  logCleanup("Starting unverified account sweep (48-hour cutoff)...");

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // 1. Delete users (cascade removes workspaces, transactions, etc.)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isEmailVerified: false,
        createdAt: { lt: fortyEightHoursAgo },
      },
    });

    // 2. Clean orphaned verification tokens that are expired
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        type: "EMAIL_VERIFICATION",
        expiresAt: { lt: new Date() },
      },
    });

    logCleanup(
      `Sweep completed. Removed ${deletedUsers.count} unverified accounts and ${deletedTokens.count} expired tokens.`
    );
  } catch (error: unknown) {
    logCleanupError("Error purging unverified accounts:", error);
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: SCHEDULER INITIALIZATION ===
   ========================================================================== */

/**
 * Initializes the cron job that deletes stale unverified accounts.
 *
 * Runs every hour at minute 0 to keep the database clean.
 */
export function initCleanupCron(): void {
  logCleanup("Unverified account cleanup cron scheduler loaded (UTC).");

  cron.schedule(
    "0 * * * *",
    async () => {
      logCleanup("Running scheduled cleanup of unverified accounts...");
      await purgeUnverifiedAccounts();
    },
    { timezone: "UTC" }
  );
}
/* === SECTION 4 END === */