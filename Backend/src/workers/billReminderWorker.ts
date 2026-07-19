// Backend/src/workers/billReminderWorker.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import cron from "node-cron";
import { prisma } from "../db";
import { sendBillReminderEmail } from "../services/emailService";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Helper function to log errors without exposing details to clients.
 */
function logWorkerError(message: string, detail: unknown): void {
  console.error(`[BillReminderWorker] ${message}`, detail);
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Scans the database for recurring categories whose configured reminder day
 * matches today, and sends a bill reminder email to the workspace owner.
 */
async function runBillScanner(): Promise<void> {
  try {
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    console.log(`🕒 Scanning upcoming bill records for calendar day: ${currentDayOfMonth}`);

    // 1. Fetch all categories that have both a due day and reminder days configured
    const categoriesWithReminders = await prisma.category.findMany({
      where: {
        dueDay: { not: null },
        reminderDays: { not: null },
      },
      include: {
        workspace: {
          include: {
            user: true, // owner of the workspace
          },
        },
      },
    });

    // 2. Iterate through each category
    for (const category of categoriesWithReminders) {
      const workspace = category.workspace;
      const user = workspace?.user;

      // Skip if workspace or user is missing (should not happen normally)
      if (!workspace || !user) continue;

      // TypeScript now knows dueDay and reminderDays are non‑null
      const dueDay = category.dueDay as number;
      const reminderDays = category.reminderDays as number;

      // Calculate how many days remain until the due date
      const daysUntilDue = dueDay - currentDayOfMonth;

      // If the due date has already passed this month, ignore
      if (daysUntilDue < 0) continue;

      // If the remaining days exactly match the reminder window, send an email
      if (daysUntilDue === reminderDays) {
        await sendBillReminderEmail(
          user.email,
          user.name,
          category.name,
          dueDay,
          daysUntilDue
        ).catch((err: unknown) => {
          logWorkerError(
            `Failed to send background email to user ${user.id}`,
            err
          );
        });
      }
    }
  } catch (error: unknown) {
    logWorkerError("Error running upcoming bill worker loop:", error);
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: CRON JOB INITIALIZATION ===
   ========================================================================== */

/**
 * Starts the daily cron job that triggers the bill scanner at midnight.
 */
export function initBillReminderCron(): void {
  console.log(
    "[Notification Service] Bill reminder background cron scheduler loaded."
  );

  // Run the scanner every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 Running standard midnight upcoming bills check...");
    await runBillScanner();
  });
}
/* === SECTION 4 END === */