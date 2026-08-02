// Backend/src/workers/verificationReminderWorker.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import cron from "node-cron";
import crypto from "crypto";
import { prisma } from "../db";
import { sendVerificationEmail } from "../services/emailService";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

function logReminder(message: string): void {
  console.log(`[VerificationReminder] ${message}`);
}

function logReminderError(message: string, detail?: unknown): void {
  console.error(`[VerificationReminder] ${message}`, detail ?? "");
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE ===
   ========================================================================== */

/**
 * Finds unverified users created more than 24 hours ago who haven't
 * been reminded yet, and sends them a fresh verification email and an
 * in‑app notification.
 *
 * WHY THIS FIX WAS MADE:
 * - Gives users a second chance before account deletion at 48 hours.
 * - Uses the existing Notification table with unique idempotency keys
 *   to guarantee exactly‑once delivery.
 */
async function sendReminders(): Promise<void> {
  logReminder("Starting verification reminder sweep...");

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Users who are unverified, older than 24h, and have no reminder notification yet
    const usersToRemind = await prisma.user.findMany({
      where: {
        isEmailVerified: false,
        createdAt: { lt: twentyFourHoursAgo },
        notifications: {
          none: {
            sourceType: "VERIFICATION_REMINDER",
          },
        },
      },
      select: { id: true, email: true, name: true },
    });

    for (const user of usersToRemind) {
      // 1. Generate a fresh verification token (invalidates any previous ones)
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.verificationToken.deleteMany({
        where: { identifier: user.email, type: "EMAIL_VERIFICATION" },
      });

      await prisma.verificationToken.create({
        data: {
          tokenHash,
          type: "EMAIL_VERIFICATION",
          identifier: user.email,
          expiresAt: tokenExpiration,
        },
      });

      // 2. Create in‑app notification (idempotent via unique key)
      const idempotencyKey = `verify_reminder_${user.id}`;
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Verify your email address",
          message:
            "Your account will be deleted in 24 hours if you don't verify. Click the button below to resend the verification email.",
          sourceType: "VERIFICATION_REMINDER",
          sourceId: user.id,
          idempotencyKey,
        },
      });

      // 3. Send reminder email
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${rawToken}`;
      await sendVerificationEmail(user.email, user.name, verificationUrl).catch(
        (err) => logReminderError(`Failed to send reminder to ${user.email}`, err)
      );
    }

    logReminder(`Reminders sent to ${usersToRemind.length} users.`);
  } catch (error: unknown) {
    logReminderError("Error during reminder sweep:", error);
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: SCHEDULER INITIALIZATION ===
   ========================================================================== */

/**
 * Initializes the cron job that sends verification reminders every hour.
 */
export function initVerificationReminderCron(): void {
  logReminder("Verification reminder cron scheduler loaded (UTC).");

  cron.schedule(
    "0 * * * *",   // every hour at minute 0
    async () => {
      logReminder("Running verification reminder check...");
      await sendReminders();
    },
    { timezone: "UTC" }
  );
}
/* === SECTION 4 END === */