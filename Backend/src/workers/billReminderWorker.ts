// Backend/src/workers/billReminderWorker.ts
import cron from "node-cron";
import { prisma } from "../db";
import { sendBillReminderEmail } from "../services/emailService";

/**
 * Core scanning function that looks for categories needing a bill reminder email
 */
const runBillScanner = async () => {
  try {
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    console.log(`🕒 Scanning upcoming bill records for calendar day: ${currentDayOfMonth}`);

    // Find all categories that have active reminders configured
    const categoriesWithReminders = await prisma.category.findMany({
      where: {
        dueDay: { not: null },
        reminderDays: { not: null },
      },
      include: {
        workspace: {
          include: {
            user: true
          }
        }
      }
    });

    // Type-safe iteration over our loaded relationships
    for (const category of categoriesWithReminders) {
      // Safe check to make sure the category belongs to a workspace with an active user
      const workspace = (category as any).workspace;
      if (!workspace || !workspace.user) continue;

      const user = workspace.user;
      if (!category.dueDay || !category.reminderDays) continue;

      // Calculate how many days are left until the due date arrives
      const daysUntilDue = category.dueDay - currentDayOfMonth;

      // Simple edge fallback if the due day already passed this month
      if (daysUntilDue < 0) continue; 

      // If the countdown matches their exact notification window, fire the email!
      if (daysUntilDue === category.reminderDays) {
        await sendBillReminderEmail(
          user.email,
          user.name,
          category.name,
          category.dueDay,
          daysUntilDue
        ).catch((err: unknown) => {
          console.error(`Failed to send background email to user ${user.id}:`, err);
        });
      }
    }
  } catch (error) {
    console.error("❌ Error running upcoming bill worker loop:", error);
  }
};

/**
 * Initializes the automated daily background checker for bill notifications
 * Runs every single night exactly at midnight (00:00)
 */
export const initBillReminderCron = () => {
  console.log("[Notification Service] Bill reminder background cron scheduler loaded.");

  // Standard production automation routine (Midnight checker)
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 Running standard midnight upcoming bills check...");
    await runBillScanner();
  });
};