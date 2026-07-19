// Backend/src/services/emailService.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Resend } from "resend";

// Resend‑specific response shape (simplified)
interface ResendSendResponse {
  data?: { id: string } | null;
  error?: { message: string; name: string } | null;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

// The Resend client – initialised even if the API key is missing to avoid crashes,
// but all send functions will log an error and return false in that case.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey || "MOCK_KEY_TO_PREVENT_CRASH");

// Sandbox sender – must be verified in Resend’s dashboard during development
const SANDBOX_SENDER = "RakhoKhata <onboarding@resend.dev>";

/**
 * Builds a safe error object for internal logging; never exposed to clients.
 */
function logError(message: string, detail: unknown): void {
  console.error(message, detail);
}

/**
 * Checks if the Resend API key is configured and logs a warning if not.
 */
function isResendConfigured(): boolean {
  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY is missing. All email sending will be skipped.");
    return false;
  }
  return true;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Sends a password reset email to the user.
 * Returns `true` on success, `false` on failure.
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #6366f1; margin-bottom: 20px;">Reset Your RakhoKhata Password</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We received a request to reset the password for your account. No worries, these things happen!</p>
      <p>Click the secure button below to choose a new password. This link will expire in <strong>15 minutes</strong>:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset My Password
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link directly into your web browser:</p>
      <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${resetLink}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">If you did not request this change, please ignore this message. Your account remains entirely secure.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: "🔒 Reset your RakhoKhata Password",
      html: htmlContent,
    });

    if (response.error) {
      logError("❌ Resend API Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Password reset email dispatched. Ticket ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    logError("❌ Critical fault inside password reset pipeline:", error);
    return false;
  }
}

/**
 * Sends a welcome email with an email verification link.
 */
export async function sendVerificationEmail(
  recipientEmail: string,
  userName: string,
  verifyLink: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #6366f1; margin-bottom: 20px;">Welcome to RakhoKhata! 🚀</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Thank you for creating an account with us. Before you can use your financial workspaces, please confirm your email address by clicking the button below:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verifyLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Verify My Email
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your web browser:</p>
      <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${verifyLink}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">If you didn't sign up for this account, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: "👋 Verify your RakhoKhata Account",
      html: htmlContent,
    });

    if (response.error) {
      logError("❌ Resend Verification Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Welcome verification email sent. Ticket ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    logError("❌ Critical fault inside verification pipeline:", error);
    return false;
  }
}

/**
 * Sends an immediate security alert when sensitive account settings are changed.
 */
export async function sendSecurityAlertEmail(
  recipientEmail: string,
  userName: string,
  changeLabel: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ Security Alert</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>This is an automated safety alert for your RakhoKhata account.</p>
      <p>We wanted to let you know that your <strong>${changeLabel}</strong> was recently changed.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">
          If you did NOT make this change, please contact our support team immediately to protect your account.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">This is a security notification sent to protect your personal account profile information.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: `⚠️ Security Alert: ${changeLabel} changed`,
      html: htmlContent,
    });

    if (response.error) {
      logError("❌ Resend Security Alert Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Security alert email sent. Ticket ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    logError("❌ Critical fault inside security alert pipeline:", error);
    return false;
  }
}

/**
 * Sends a bill reminder email for an upcoming recurring payment.
 */
export async function sendBillReminderEmail(
  recipientEmail: string,
  userName: string,
  categoryName: string,
  dueDay: number,
  daysLeft: number
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #f59e0b; margin-bottom: 20px;">📅 Upcoming Bill Reminder</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>This is a quick heads-up from RakhoKhata to let you know that your monthly payment for <strong>${categoryName}</strong> is coming up.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #fef8e6; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px; color: #b45309;">
          <strong>Bill:</strong> ${categoryName}<br>
          <strong>Due Date:</strong> Day ${dueDay} of this month<br>
          <strong>Time Left:</strong> ${daysLeft === 1 ? "Tomorrow!" : `In ${daysLeft} days`}
        </p>
      </div>
      
      <p>Log into your app dashboard to check your funds and mark it down once paid so your budget sheets stay completely balanced.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">You received this automated reminder because you set up bill notifications for this category.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: `🔔 Reminder: Your ${categoryName} payment is due soon!`,
      html: htmlContent,
    });

    if (response.error) {
      logError("❌ Resend Bill Reminder Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Bill reminder email sent for category [${categoryName}]`);
    return true;
  } catch (error: unknown) {
    logError("❌ Critical fault inside bill reminder pipeline:", error);
    return false;
  }
}
/* === SECTION 3 END === */