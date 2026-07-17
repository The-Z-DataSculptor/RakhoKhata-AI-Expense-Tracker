// Backend/src/services/emailService.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & INITIALIZATION ===
   ========================================================================== */
import { Resend } from "resend";

// 🚀 BULLETPROOF RUNTIME FIX: Type the global scope properly to pull the real .env strings
interface GlobalNodeEnv {
  process: {
    env: Record<string, string | undefined>;
  };
}
const globalEnv = (globalThis as unknown as GlobalNodeEnv);

// Extract the key cleanly from the real running environment stack layer
const apiKey = globalEnv.process?.env?.RESEND_API_KEY;

if (!apiKey) {
  console.warn("⚠️ WARNING: RESEND_API_KEY is undefined. Handshake calls will fail.");
}

// Instantiate the official developer client instance with a verified key fallback
const resend = new Resend(apiKey || "MOCK_KEY_TO_PREVENT_CRASH");

// 🔒 THE SANDBOX CONSTANTS: Pre-configured tracking bounds
const SANDBOX_SENDER = "RakhoKhata <onboarding@resend.dev>";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: THE TRANSACTIONAL CORE FLOWS ===
   ========================================================================== */

/**
 * Dispatches a temporary secure password reset token link out to a user
 * @param recipientEmail The verified signup box of the target user account
 * @param userName The clean string display name of the customer
 * @param resetLink The unique dynamic url token tracking string parameter
 */
export const sendPasswordResetEmail = async (
  recipientEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> => {
  try {
    // Fail fast locally if we know the API key is completely missing
    if (!apiKey) {
      console.error("❌ Resend Aborted: Cannot transmit email because RESEND_API_KEY is not configured.");
      return false;
    }

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

    // Await the direct response from the server before logging success metrics
    const response = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: "🔒 Reset your RakhoKhata Password",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend API Transport Core Error:", response.error);
      return false;
    }

    console.log(`✉️ Password reset email dispatched cleanly. Ticket ID: ${response.data?.id}`);
    return true;
  } catch (err) {
    console.error("❌ Critical fault inside the core mailing engine pipeline:", err);
    return false;
  }
};

/**
 * Sends a welcome email with a link to confirm the user's email address
 */
export const sendVerificationEmail = async (
  recipientEmail: string,
  userName: string,
  verifyLink: string
): Promise<boolean> => {
  try {
    if (!apiKey) {
      console.error("❌ Resend Aborted: Cannot transmit email because RESEND_API_KEY is not configured.");
      return false;
    }

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

    const response = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: "👋 Verify your RakhoKhata Account",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend API Verification Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Welcome verification email sent cleanly. Ticket ID: ${response.data?.id}`);
    return true;
  } catch (err) {
    console.error("❌ Critical fault inside the verification email pipeline:", err);
    return false;
  }
};

/**
 * Sends an immediate alert email when important security settings change
 */
export const sendSecurityAlertEmail = async (
  recipientEmail: string,
  userName: string,
  changeLabel: string
): Promise<boolean> => {
  try {
    if (!apiKey) {
      console.error("❌ Resend Aborted: Cannot transmit email because RESEND_API_KEY is not configured.");
      return false;
    }

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

    const response = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: `⚠️ Security Alert: ${changeLabel} changed`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend API Security Alert Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Security alert email sent cleanly. Ticket ID: ${response.data?.id}`);
    return true;
  } catch (err) {
    console.error("❌ Critical fault inside the security alert pipeline:", err);
    return false;
  }
};

/**
 * 🚀 NEW: Sends a helpful automated reminder for an upcoming bill or fixed recurring payment
 */
export const sendBillReminderEmail = async (
  recipientEmail: string,
  userName: string,
  categoryName: string,
  dueDay: number,
  daysLeft: number
): Promise<boolean> => {
  try {
    if (!apiKey) {
      console.error("❌ Resend Aborted: Cannot transmit email because RESEND_API_KEY is not configured.");
      return false;
    }

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

    const response = await resend.emails.send({
      from: SANDBOX_SENDER,
      to: [recipientEmail],
      subject: `🔔 Reminder: Your ${categoryName} payment is due soon!`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Bill Reminder Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Bill reminder email sent to ${recipientEmail} for category [${categoryName}]`);
    return true;
  } catch (err) {
    console.error("❌ Critical fault inside the bill reminder email pipeline:", err);
    return false;
  }
};
/* === SECTION 2 END === */