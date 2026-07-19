// Backend/src/services/notificationService.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import cron from "node-cron";
import { prisma } from "../db";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Helper to log error details without exposing to clients.
 */
function logError(message: string, detail: unknown): void {
  console.error(message, detail);
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Scans the database for recurring bills due for a reminder today and
 * creates notifications for each one, using an idempotency key to
 * prevent duplicate alerts.
 */
export async function generateBillReminders(): Promise<void> {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1; // 1‑12
  const currentYear = today.getFullYear();

  console.log(
    `[Notification Service] Starting daily bill reminder sweep on ${today.toLocaleDateString()}...`
  );

  try {
    // 1. Fetch all recurring categories that have reminder settings
    const recurringCategories = await prisma.category.findMany({
      where: {
        isRecurring: true,
        dueDay: { not: null },
        reminderDays: { not: null },
      },
      include: {
        workspace: true,
      },
    });

    let notificationsCreated = 0;

    for (const category of recurringCategories) {
      // TypeScript knows dueDay and reminderDays are non‑null here
      const dueDay = category.dueDay as number;
      const reminderDays = category.reminderDays as number;
      const userId = category.workspace.userId;

      // 2. Calculate the target day for the reminder
      let targetNotificationDay = dueDay - reminderDays;
      if (targetNotificationDay <= 0) {
        targetNotificationDay = 1; // Fallback to the first day of the month
      }

      // If today matches the target, create a notification
      if (currentDay === targetNotificationDay) {
        const title = `Upcoming Bill: ${category.name}`;
        const message = `Your recurring payment for ${category.name} is due in ${reminderDays} days (on day ${dueDay} of this month).`;

        // 3. Build a globally unique idempotency key
        const idempotencyKey = `bill_reminder_${category.id}_${userId}_${currentMonth}_${currentYear}`;

        try {
          await prisma.notification.upsert({
            where: { idempotencyKey },
            update: {}, // Do nothing if it already exists
            create: {
              userId,
              title,
              message,
              sourceType: "BILL_REMINDER",
              sourceId: category.id,
              idempotencyKey,
            },
          });
          notificationsCreated++;
        } catch (dbError: unknown) {
          logError(
            `[Notification Service] Failed to upsert reminder for category ${category.id}:`,
            dbError
          );
        }
      }
    }

    console.log(
      `[Notification Service] Sweep complete. Created/Verified ${notificationsCreated} notifications.`
    );
  } catch (error: unknown) {
    logError("[Notification Service] Error running bill reminder sweep:", error);
  }
}

/**
 * Deletes notifications older than 30 days to keep the table lean.
 */
export async function cleanupOldNotifications(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    if (deleted.count > 0) {
      console.log(
        `[Notification Service] Automated cleanup: Purged ${deleted.count} historical notifications.`
      );
    }
  } catch (error: unknown) {
    logError("[Notification Service] Error running cleanup:", error);
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: SCHEDULER INITIALIZATION ===
   ========================================================================== */

/**
 * Starts the background cron jobs that run daily and weekly.
 */
export function initNotificationScheduler(): void {
  // Daily bill reminder sweep at midnight
  cron.schedule("0 0 * * *", async () => {
    await generateBillReminders();
  });

  // Weekly cleanup of old notifications every Sunday at 1:00 AM
  cron.schedule("0 1 * * 0", async () => {
    await cleanupOldNotifications();
  });

  console.log("[Notification Service] Background cron schedulers loaded successfully.");
}
/* === SECTION 4 END === */