// Backend/src/services/emailService.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Resend } from "resend";

// Ambient type declaration safeguard in case @types/node is missing during local dev
declare const process: {
  env: Record<string, string | undefined>;
};

// Resend API response contract
interface ResendSendResponse {
  data?: { id: string } | null;
  error?: { message: string; name: string } | null;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

const resendApiKey = process.env.RESEND_API_KEY;

// Initialize Resend client safely
const resend = new Resend(resendApiKey || "MOCK_KEY_TO_PREVENT_CRASH");

// Configurable sender address via environment variable (EMAIL_FROM)
const DEFAULT_SENDER =
  process.env.EMAIL_FROM || "RakhoKhaata Security <no-reply@rakhokhaata.com>";

/**
 * Escapes special HTML characters in user inputs to prevent HTML injection.
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes URL parameters to prevent javascript: URI injection in email buttons.
 */
function sanitizeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "#";
  } catch {
    return "#";
  }
}

/**
 * Masks recipient email addresses in server console logs to prevent PII leaks.
 */
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const maskedLocal =
    local.length > 2
      ? `${local[0]}***${local[local.length - 1]}`
      : "***";
  return `${maskedLocal}@${domain}`;
}

/**
 * Verifies if Resend API key is present before attempting network delivery.
 */
function isResendConfigured(): boolean {
  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email dispatch skipped.");
    return false;
  }
  return true;
}

/**
 * Simple email syntax check to avoid sending requests with invalid recipient addresses.
 */
function isValidEmail(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Sends a password reset email containing a secure multi-use token link.
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  if (!isValidEmail(recipientEmail)) {
    console.error("❌ Invalid recipient email provided for password reset.");
    return false;
  }

  const safeName = escapeHtml(userName);
  const safeLink = sanitizeUrl(resetLink);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #6366f1; margin-bottom: 20px;">Reset Your RakhoKhaata Password</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>We received a request to reset the password for your account.</p>
      <p>Click the secure button below to choose a new password. This link will expire in <strong>15 minutes</strong>:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${safeLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset My Password
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${safeLink}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">If you did not request this change, please ignore this message.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [recipientEmail.trim()],
      subject: "🔒 Reset your RakhoKhaata Password",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend API Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Password reset email dispatched to [${maskEmail(recipientEmail)}]. ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    console.error("❌ Critical fault inside password reset email pipeline:", error);
    return false;
  }
}

/**
 * Sends an account email verification message during user registration.
 */
export async function sendVerificationEmail(
  recipientEmail: string,
  userName: string,
  verifyLink: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  if (!isValidEmail(recipientEmail)) {
    console.error("❌ Invalid recipient email provided for account verification.");
    return false;
  }

  const safeName = escapeHtml(userName);
  const safeLink = sanitizeUrl(verifyLink);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #6366f1; margin-bottom: 20px;">Welcome to RakhoKhaata! 🚀</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>Thank you for creating an account. Please confirm your email address by clicking the button below:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${safeLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Verify My Email
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${safeLink}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">If you didn't sign up for this account, you can safely ignore this message.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [recipientEmail.trim()],
      subject: "👋 Verify your RakhoKhaata Account",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Verification Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Verification email sent to [${maskEmail(recipientEmail)}]. ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    console.error("❌ Critical fault inside verification email pipeline:", error);
    return false;
  }
}

/**
 * Sends an automated security alert when profile security parameters are modified.
 */
export async function sendSecurityAlertEmail(
  recipientEmail: string,
  userName: string,
  changeLabel: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  if (!isValidEmail(recipientEmail)) {
    console.error("❌ Invalid recipient email provided for security alert.");
    return false;
  }

  const safeName = escapeHtml(userName);
  const safeChangeLabel = escapeHtml(changeLabel);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ Security Alert</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is an automated safety alert for your RakhoKhaata account.</p>
      <p>We wanted to let you know that your <strong>${safeChangeLabel}</strong> was recently updated.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">
          If you did NOT make this change, please contact support immediately to lock your account.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">This security notification was generated automatically.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [recipientEmail.trim()],
      subject: `⚠️ Security Alert: ${safeChangeLabel} changed`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Security Alert Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Security alert email sent to [${maskEmail(recipientEmail)}]. ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    console.error("❌ Critical fault inside security alert email pipeline:", error);
    return false;
  }
}

/**
 * Sends a bill reminder notification email for upcoming recurring obligations.
 */
export async function sendBillReminderEmail(
  recipientEmail: string,
  userName: string,
  categoryName: string,
  dueDay: number,
  daysLeft: number
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  if (!isValidEmail(recipientEmail)) {
    console.error("❌ Invalid recipient email provided for bill reminder.");
    return false;
  }

  const safeName = escapeHtml(userName);
  const safeCategory = escapeHtml(categoryName);
  const safeDueDay = Math.max(1, Math.min(31, Math.floor(dueDay)));
  const safeDaysLeft = Math.max(0, Math.floor(daysLeft));

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #f59e0b; margin-bottom: 20px;">📅 Upcoming Bill Reminder</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is a quick heads-up that your payment for <strong>${safeCategory}</strong> is due soon.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #fef8e6; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px; color: #b45309;">
          <strong>Bill:</strong> ${safeCategory}<br>
          <strong>Due Date:</strong> Day ${safeDueDay} of this month<br>
          <strong>Time Left:</strong> ${safeDaysLeft === 1 ? "Tomorrow!" : `In ${safeDaysLeft} days`}
        </p>
      </div>
      
      <p>Log in to your dashboard to record this payment and keep your financial sheets balanced.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">You received this email because bill reminders are enabled for this category.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [recipientEmail.trim()],
      subject: `🔔 Reminder: ${safeCategory} payment is due soon!`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Bill Reminder Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Bill reminder sent to [${maskEmail(recipientEmail)}] for category [${safeCategory}].`);
    return true;
  } catch (error: unknown) {
    console.error("❌ Critical fault inside bill reminder email pipeline:", error);
    return false;
  }
}

/**
 * Sends an email with a secure link to reset the Investment Vault PIN.
 */
export async function sendVaultPinResetEmail(
  recipientEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  if (!isValidEmail(recipientEmail)) {
    console.error("❌ Invalid recipient email provided for Vault PIN reset.");
    return false;
  }

  const safeName = escapeHtml(userName);
  const safeLink = sanitizeUrl(resetLink);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #10b981; margin-bottom: 20px;">🔐 Reset Investment Vault PIN</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>We received a request to reset your secret 4-digit Investment Vault PIN.</p>
      <p>Click the secure button below to enter a new PIN. This link will expire in <strong>15 minutes</strong>:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${safeLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset Vault PIN
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #10b981; word-break: break-all;">${safeLink}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">If you did not request a PIN reset, please ignore this message.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [recipientEmail.trim()],
      subject: "🔐 Reset Your Investment Vault PIN",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Vault PIN Reset Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Vault PIN reset email dispatched to [${maskEmail(recipientEmail)}]. ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    console.error("❌ Critical fault inside Vault PIN reset email pipeline:", error);
    return false;
  }
}

/**
 * Sends a security alert email when the Vault lock screen is turned off.
 */
export async function sendVaultPinDisabledEmail(
  recipientEmail: string,
  userName: string
): Promise<boolean> {
  if (!isResendConfigured()) return false;

  if (!isValidEmail(recipientEmail)) {
    console.error("❌ Invalid recipient email provided for Vault PIN disabled alert.");
    return false;
  }

  const safeName = escapeHtml(userName);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h2 style="color: #dc2626; margin-bottom: 20px;">🛡️ Investment Vault Unlocked</h2>
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>Your 4-digit Investment Vault password screen lock was recently turned off.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">
          If you did NOT turn off your vault security, please log in immediately and re-enable your PIN in Settings.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">This security notice was generated automatically.</p>
    </div>
  `;

  try {
    const response: ResendSendResponse = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [recipientEmail.trim()],
      subject: "🛡️ Security Alert: Investment Vault Lock Disabled",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Vault PIN Disabled Transport Error:", response.error);
      return false;
    }

    console.log(`✉️ Vault PIN disabled alert sent to [${maskEmail(recipientEmail)}]. ID: ${response.data?.id}`);
    return true;
  } catch (error: unknown) {
    console.error("❌ Critical fault inside Vault PIN disabled alert pipeline:", error);
    return false;
  }
}
/* === SECTION 3 END === */