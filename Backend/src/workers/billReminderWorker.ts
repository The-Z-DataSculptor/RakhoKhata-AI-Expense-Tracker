//K:\Developer\Expense-Tracker\Backend\src\workers\billReminderWorker.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import cron from "node-cron";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { sendBillReminderEmail } from "../services/emailService";

// Batch size threshold for cursor pagination to prevent server memory exhaustion
const BATCH_SIZE = 200;

// WHY THIS WAS ADDED: Explicit type payload for category worker queries to prevent TS inference loops.
type CategoryWorkerPayload = Prisma.CategoryGetPayload<{
  select: {
    id: true;
    name: true;
    dueDay: true;
    reminderDays: true;
    workspace: {
      select: {
        user: {
          select: {
            id: true;
            email: true;
            name: true;
          };
        };
      };
    };
  };
}>;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

/**
 * Log worker errors without exposing sensitive internal details.
 */
function logWorkerError(message: string, detail: unknown): void {
  console.error(`[BillReminderWorker] ${message}`, detail);
}

/**
 * WHY THIS FIX WAS MADE: Replaced primitive subtraction (dueDay - currentDayOfMonth)
 * with UTC Date object math. Primitive subtraction fails when advance reminders cross month boundaries.
 */
function isReminderDueOnDate(
  dueDay: number,
  reminderDays: number,
  referenceDate: Date
): boolean {
  const targetYear = referenceDate.getUTCFullYear();
  const targetMonth = referenceDate.getUTCMonth();

  // 1. Calculate reminder date for current month's due date
  const lastDayCurrentMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0)
  ).getUTCDate();
  const actualDueDayCurrentMonth = Math.min(dueDay, lastDayCurrentMonth);
  const dueDateCurrentMonth = new Date(
    Date.UTC(targetYear, targetMonth, actualDueDayCurrentMonth)
  );

  const reminderDateCurrentMonth = new Date(dueDateCurrentMonth);
  reminderDateCurrentMonth.setUTCDate(
    reminderDateCurrentMonth.getUTCDate() - reminderDays
  );

  // 2. Calculate reminder date for next month's due date (handles reminders falling into the end of current month)
  const lastDayNextMonth = new Date(
    Date.UTC(targetYear, targetMonth + 2, 0)
  ).getUTCDate();
  const actualDueDayNextMonth = Math.min(dueDay, lastDayNextMonth);
  const dueDateNextMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, actualDueDayNextMonth)
  );

  const reminderDateNextMonth = new Date(dueDateNextMonth);
  reminderDateNextMonth.setUTCDate(
    reminderDateNextMonth.getUTCDate() - reminderDays
  );

  // 3. Match reference date against calculated targets
  const matchesCurrentMonthReminder =
    referenceDate.getUTCFullYear() ===
      reminderDateCurrentMonth.getUTCFullYear() &&
    referenceDate.getUTCMonth() === reminderDateCurrentMonth.getUTCMonth() &&
    referenceDate.getUTCDate() === reminderDateCurrentMonth.getUTCDate();

  const matchesNextMonthReminder =
    referenceDate.getUTCFullYear() ===
      reminderDateNextMonth.getUTCFullYear() &&
    referenceDate.getUTCMonth() === reminderDateNextMonth.getUTCMonth() &&
    referenceDate.getUTCDate() === reminderDateNextMonth.getUTCDate();

  return matchesCurrentMonthReminder || matchesNextMonthReminder;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Scans recurring bill categories using cursor pagination, verifies reminder due dates,
 * checks idempotency locks to eliminate duplicate emails, and dispatches reminders.
 *
 * WHY THIS FIX WAS MADE: Exported function to allow manual execution in testing scripts.
 */
export async function runBillScanner(): Promise<void> {
  const today = new Date();
  const currentMonth = today.getUTCMonth() + 1; // 1-12 UTC
  const currentYear = today.getUTCFullYear();

  console.log(
    `🕒 [BillReminderWorker] Starting scan for UTC date: ${today.toUTCString()}`
  );

  try {
    let emailsDispatched = 0;
    let cursor: string | undefined = undefined;
    let hasMoreRecords = true;

    // WHY THIS FIX WAS MADE: Cursor-based pagination prevents Out-Of-Memory (OOM) process crashes
    // by streaming categories in controlled batches rather than loading full tables into RAM.
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
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        take: BATCH_SIZE,
        orderBy: { id: "asc" },
      };

      if (cursor) {
        queryOptions.skip = 1;
        queryOptions.cursor = { id: cursor };
      }

      const categoriesWithReminders: CategoryWorkerPayload[] =
        (await prisma.category.findMany(
          queryOptions
        )) as unknown as CategoryWorkerPayload[];

      if (categoriesWithReminders.length === 0) {
        hasMoreRecords = false;
        break;
      }

      for (const category of categoriesWithReminders) {
        const user = category.workspace?.user;
        if (
          !user ||
          category.dueDay === null ||
          category.reminderDays === null
        ) {
          continue;
        }

        const dueDay = category.dueDay;
        const reminderDays = category.reminderDays;

        // Verify if today matches the target reminder date
        if (isReminderDueOnDate(dueDay, reminderDays, today)) {
          // WHY THIS FIX WAS MADE: Idempotency check prevents duplicate email sends when the worker
          // runs on multiple server instances or restarts mid-execution.
          const idempotencyKey = `bill_email_reminder_${category.id}_${user.id}_${currentMonth}_${currentYear}`;

          const existingNotification = await prisma.notification.findUnique({
            where: { idempotencyKey },
          });

          if (existingNotification) {
            continue; // Already processed today
          }

          // Dispatch email notification
          const emailSent = await sendBillReminderEmail(
            user.email,
            user.name,
            category.name,
            dueDay,
            reminderDays
          ).catch((err: unknown) => {
            logWorkerError(
              `Failed to send background email to user ${user.id}`,
              err
            );
            return false;
          });

          if (emailSent) {
            // Record idempotency lock in database after successful dispatch
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: `Upcoming Bill: ${category.name}`,
                message: `Your payment for ${category.name} is due in ${reminderDays} days.`,
                sourceType: "BILL_REMINDER",
                sourceId: category.id,
                idempotencyKey,
              },
            }).catch((dbErr: unknown) => {
              logWorkerError(
                `Failed to save idempotency record for ${category.id}`,
                dbErr
              );
            });

            emailsDispatched++;
          }
        }
      }

      cursor = categoriesWithReminders[categoriesWithReminders.length - 1].id;
      if (categoriesWithReminders.length < BATCH_SIZE) {
        hasMoreRecords = false;
      }
    }

    console.log(
      `✉️ [BillReminderWorker] Sweep completed. Dispatched ${emailsDispatched} reminder emails.`
    );
  } catch (error: unknown) {
    logWorkerError("Error running upcoming bill worker loop:", error);
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: SCHEDULER INITIALIZATION ===
   ========================================================================== */

/**
 * Initializes the background cron scheduler using UTC timezone constraints.
 */
export function initBillReminderCron(): void {
  console.log(
    "[Notification Service] Bill reminder background cron scheduler loaded (UTC)."
  );

  // WHY THIS FIX WAS MADE: Explicitly configured UTC timezone in node-cron options
  // to ensure consistent execution times regardless of host server deployment location.
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("🕒 Running standard midnight upcoming bills check...");
      await runBillScanner();
    },
    { timezone: "UTC" }
  );
}
/* === SECTION 4 END === */