// Backend/src/services/notificationService.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import cron from "node-cron";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

const BATCH_SIZE = 200;
const CLEANUP_BATCH_SIZE = 500;

type RecurringCategoryPayload = Prisma.CategoryGetPayload<{
  select: {
    id: true;
    name: true;
    dueDay: true;
    reminderDays: true;
    workspace: {
      select: { userId: true };
    };
  };
}>;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

function logError(message: string, detail: unknown): void {
  console.error(message, detail);
}

function isReminderDueOnDate(
  dueDay: number,
  reminderDays: number,
  referenceDate: Date
): boolean {
  const targetYear = referenceDate.getUTCFullYear();
  const targetMonth = referenceDate.getUTCMonth();

  const lastDayCurrentMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const actualDueDayCurrentMonth = Math.min(dueDay, lastDayCurrentMonth);
  const dueDateCurrentMonth = new Date(Date.UTC(targetYear, targetMonth, actualDueDayCurrentMonth));

  const reminderDateCurrentMonth = new Date(dueDateCurrentMonth);
  reminderDateCurrentMonth.setUTCDate(reminderDateCurrentMonth.getUTCDate() - reminderDays);

  const lastDayNextMonth = new Date(Date.UTC(targetYear, targetMonth + 2, 0)).getUTCDate();
  const actualDueDayNextMonth = Math.min(dueDay, lastDayNextMonth);
  const dueDateNextMonth = new Date(Date.UTC(targetYear, targetMonth + 1, actualDueDayNextMonth));

  const reminderDateNextMonth = new Date(dueDateNextMonth);
  reminderDateNextMonth.setUTCDate(reminderDateNextMonth.getUTCDate() - reminderDays);

  const matchesCurrentMonthReminder =
    referenceDate.getUTCFullYear() === reminderDateCurrentMonth.getUTCFullYear() &&
    referenceDate.getUTCMonth() === reminderDateCurrentMonth.getUTCMonth() &&
    referenceDate.getUTCDate() === reminderDateCurrentMonth.getUTCDate();

  const matchesNextMonthReminder =
    referenceDate.getUTCFullYear() === reminderDateNextMonth.getUTCFullYear() &&
    referenceDate.getUTCMonth() === reminderDateNextMonth.getUTCMonth() &&
    referenceDate.getUTCDate() === reminderDateNextMonth.getUTCDate();

  return matchesCurrentMonthReminder || matchesNextMonthReminder;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Creates an immediate in-app dashboard notification for security/system events.
 */
export async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  sourceType: string = "SECURITY_ALERT"
): Promise<void> {
  try {
    const idempotencyKey = `${sourceType.toLowerCase()}_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        sourceType,
        idempotencyKey,
      },
    });
  } catch (error: unknown) {
    logError("[Notification Service] Failed to create in-app notification:", error);
  }
}

/**
 * Dispatches an in-app notification confirming a successful Vault PIN reset.
 */
export async function createVaultPinResetNotification(userId: string): Promise<void> {
  await createInAppNotification(
    userId,
    "🔐 Vault PIN Reset",
    "Your 4-digit Investment Vault security PIN was successfully reset.",
    "VAULT_PIN_RESET"
  );
}

/**
 * Scans the database using cursor-based batching for recurring bills due for a reminder today.
 */
export async function generateBillReminders(): Promise<void> {
  const today = new Date();
  const currentMonth = today.getUTCMonth() + 1;
  const currentYear = today.getUTCFullYear();

  console.log(
    `[Notification Service] Starting daily bill reminder sweep on ${today.toUTCString()}...`
  );

  try {
    let notificationsCreated = 0;
    let cursor: string | undefined = undefined;
    let hasMoreRecords = true;

    while (hasMoreRecords) {
      const queryOptions: Prisma.CategoryFindManyArgs = {
        where: {
          isRecurring: true,
          dueDay: { not: null },
          reminderDays: { not: null },
        },
        select: {
          id: true,
          name: true,
          dueDay: true,
          reminderDays: true,
          workspace: {
            select: { userId: true },
          },
        },
        take: BATCH_SIZE,
        orderBy: { id: "asc" },
      };

      if (cursor) {
        queryOptions.skip = 1;
        queryOptions.cursor = { id: cursor };
      }

      const recurringCategories: RecurringCategoryPayload[] =
        (await prisma.category.findMany(queryOptions)) as unknown as RecurringCategoryPayload[];

      if (recurringCategories.length === 0) {
        hasMoreRecords = false;
        break;
      }

      for (const category of recurringCategories) {
        if (category.dueDay === null || category.reminderDays === null) {
          continue;
        }

        const dueDay = category.dueDay;
        const reminderDays = category.reminderDays;
        const userId = category.workspace.userId;

        if (isReminderDueOnDate(dueDay, reminderDays, today)) {
          const title = `Upcoming Bill: ${category.name}`;
          const message = `Your recurring payment for ${category.name} is due in ${reminderDays} days (on day ${dueDay} of this month).`;
          const idempotencyKey = `bill_reminder_${category.id}_${userId}_${currentMonth}_${currentYear}`;

          try {
            await prisma.notification.upsert({
              where: { idempotencyKey },
              update: {},
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

      cursor = recurringCategories[recurringCategories.length - 1].id;
      if (recurringCategories.length < BATCH_SIZE) {
        hasMoreRecords = false;
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
 * Deletes notifications older than 30 days in chunks to prevent database table locks.
 */
export async function cleanupOldNotifications(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  try {
    let totalDeleted = 0;
    let continueDeleting = true;

    while (continueDeleting) {
      const recordsToPurge = await prisma.notification.findMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
        },
        select: { id: true },
        take: CLEANUP_BATCH_SIZE,
      });

      if (recordsToPurge.length === 0) {
        continueDeleting = false;
        break;
      }

      const idsToDelete = recordsToPurge.map((item) => item.id);
      const deleteResult = await prisma.notification.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });

      totalDeleted += deleteResult.count;

      if (recordsToPurge.length < CLEANUP_BATCH_SIZE) {
        continueDeleting = false;
      }
    }

    if (totalDeleted > 0) {
      console.log(
        `[Notification Service] Automated cleanup: Purged ${totalDeleted} historical notifications.`
      );
    }
  } catch (error: unknown) {
    logError("[Notification Service] Error running notification cleanup:", error);
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: SCHEDULER INITIALIZATION ===
   ========================================================================== */

export function initNotificationScheduler(): void {
  cron.schedule(
    "0 0 * * *",
    async () => {
      await generateBillReminders();
    },
    { timezone: "UTC" }
  );

  cron.schedule(
    "0 1 * * 0",
    async () => {
      await cleanupOldNotifications();
    },
    { timezone: "UTC" }
  );

  console.log("[Notification Service] Background cron schedulers initialized (UTC).");
}
/* === SECTION 4 END === */