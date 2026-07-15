// Backend/src/services/notificationService.ts
import cron from "node-cron";
import { prisma } from "../db"; // 👈 FIXED: Reuses your global preconfigured database client

/**
 * Sweeps the database for recurring bills that need reminders and creates notifications.
 * Designed to be run automatically once a day.
 */
export async function generateBillReminders(): Promise<void> {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();

  console.log(`[Notification Service] Starting daily bill reminder sweep on ${today.toLocaleDateString()}...`);

  try {
    // 1. Find all active categories where the user wants recurring reminders
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
      const dueDay = category.dueDay!;
      const reminderDays = category.reminderDays!;
      const userId = category.workspace.userId;

      // 2. Calculate the target reminder date.
      // Example: Rent due on 10th, notify 3 days before. Target day to notify is the 7th.
      let targetNotificationDay = dueDay - reminderDays;

      // Handle month roll-over edge cases gracefully (e.g., due on the 2nd, remind 3 days before)
      if (targetNotificationDay <= 0) {
        // Fallback to simple matching if target date falls into previous month, 
        // or let it fire on the 1st of the current month.
        targetNotificationDay = 1;
      }

      // If today is the designated reminder day, prepare the alert
      if (currentDay === targetNotificationDay) {
        const title = `Upcoming Bill: ${category.name}`;
        const message = `Your recurring payment for ${category.name} is due in ${reminderDays} days (on day ${dueDay} of this month).`;
        
        // 3. SECURE IDEMPOTENCY KEY
        // Formulated to be globally unique: category + user + month + year
        // This stops database duplicate writes even if the scheduler runs twice.
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
        } catch (dbError) {
          // Log individual record insert errors (e.g., unique constraint failures) without crashing the whole sweep
          console.error(`[Notification Service] Failed to upsert reminder for category ${category.id}:`, dbError);
        }
      }
    }

    console.log(`[Notification Service] Sweep complete. Created/Verified ${notificationsCreated} notifications.`);
  } catch (error) {
    console.error("[Notification Service] Error running bill reminder sweep:", error);
  }
}

/**
 * Automates the cleanup of notifications older than 30 days.
 * Keeps your database fast and lightweight.
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
      console.log(`[Notification Service] Automated cleanup: Purged ${deleted.count} historical notifications older than 30 days.`);
    }
  } catch (error) {
    console.error("[Notification Service] Error running historical notification cleanup:", error);
  }
}

/**
 * INITIALIZE THE CRON SCHEDULER
 * Sets up cron jobs to run quietly in the background of your server.
 */
export function initNotificationScheduler(): void {
  // Job 1: Daily Bill Sweep - Runs every single day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    await generateBillReminders();
  });

  // Job 2: Weekly Database Cleanup - Runs every Sunday at 1:00 AM
  cron.schedule("0 1 * * 0", async () => {
    await cleanupOldNotifications();
  });

  console.log("[Notification Service] Background cron schedulers loaded successfully.");
}