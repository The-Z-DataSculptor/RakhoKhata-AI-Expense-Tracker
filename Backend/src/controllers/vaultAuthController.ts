// Backend/src/controllers/vaultAuthController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  sendVaultPinResetEmail,
  sendVaultPinDisabledEmail,
} from "../services/emailService";
import { createVaultPinResetNotification } from "../services/notificationService";

const APP_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BCRYPT_SALT_ROUNDS = 10;

interface SetupPinInput {
  pin: string;
  currentPin?: string;
}

interface VerifyPinInput {
  pin: string;
}

interface DisablePinInput {
  pin: string;
}

interface ResetPinTokenInput {
  token: string;
  newPin: string;
}

function buildErrorResponse(message: string): { error: string; success: boolean } {
  return { error: message, success: false };
}

function isValidPinFormat(pin: unknown): pin is string {
  if (typeof pin !== "string") {
    return false;
  }
  return /^\d{4}$/.test(pin.trim());
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * GET /api/auth/vault/pin-status
 * Checks whether the logged-in user currently has a vault PIN configured.
 */
export const checkVaultPinStatus = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPin: true },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    const hasPin = Boolean(user.vaultPin);
    res.status(200).json({ hasPin });
  } catch (error: unknown) {
    console.error("Check Vault PIN Error:", error);
    res.status(500).json(buildErrorResponse("Unable to verify PIN status."));
  }
};

/**
 * POST /api/auth/vault/pin-setup
 * Configures a new 4-digit PIN, requiring current PIN verification if one is already set.
 */
export const setupVaultPin = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const body = req.body as SetupPinInput;
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    const currentPin = typeof body.currentPin === "string" ? body.currentPin.trim() : "";

    if (!isValidPinFormat(pin)) {
      res.status(400).json(buildErrorResponse("New PIN must be exactly 4 digits."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, vaultPin: true },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    if (user.vaultPin) {
      if (!currentPin || !isValidPinFormat(currentPin)) {
        res.status(400).json(buildErrorResponse("Current PIN is required to change vault settings."));
        return;
      }

      const isCurrentPinValid = await bcrypt.compare(currentPin, user.vaultPin);
      if (!isCurrentPinValid) {
        res.status(401).json(buildErrorResponse("Incorrect current PIN."));
        return;
      }
    }

    const hashedPin = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { vaultPin: hashedPin },
    });

    res.status(201).json({
      success: true,
      message: "Vault PIN configured successfully.",
    });
  } catch (error: unknown) {
    console.error("Setup Vault PIN Error:", error);
    res.status(500).json(buildErrorResponse("Failed to set up vault PIN."));
  }
};

/**
 * POST /api/auth/vault/pin-verify
 * Verifies a 4-digit PIN against the user's stored bcrypt hash.
 */
export const verifyVaultPin = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const body = req.body as VerifyPinInput;
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";

    if (!isValidPinFormat(pin)) {
      res.status(400).json(buildErrorResponse("PIN must be exactly 4 digits."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPin: true },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    if (!user.vaultPin) {
      res.status(400).json(buildErrorResponse("No vault PIN has been configured."));
      return;
    }

    const isMatch = await bcrypt.compare(pin, user.vaultPin);
    if (!isMatch) {
      res.status(401).json(buildErrorResponse("Incorrect PIN."));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vault unlocked successfully.",
    });
  } catch (error: unknown) {
    console.error("Verify Vault PIN Error:", error);
    res.status(500).json(buildErrorResponse("PIN verification failed."));
  }
};

/**
 * POST /api/auth/vault/pin-disable
 * Removes the vault PIN after verifying the user's current PIN for security.
 */
export const disableVaultPin = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const body = req.body as DisablePinInput;
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";

    if (!isValidPinFormat(pin)) {
      res.status(400).json(buildErrorResponse("Valid 4-digit PIN is required to disable vault lock."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, vaultPin: true, email: true, name: true },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    if (!user.vaultPin) {
      res.status(400).json(buildErrorResponse("No vault PIN is currently configured."));
      return;
    }

    const isPinCorrect = await bcrypt.compare(pin, user.vaultPin);
    if (!isPinCorrect) {
      res.status(401).json(buildErrorResponse("Incorrect PIN. Vault remains locked."));
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { vaultPin: null },
    });

    sendVaultPinDisabledEmail(user.email, user.name).catch((err: unknown) =>
      console.error("Async Vault Pin Disabled Email Error:", err)
    );

    res.status(200).json({
      success: true,
      message: "Vault PIN has been successfully removed.",
    });
  } catch (error: unknown) {
    console.error("Disable Vault PIN Error:", error);
    res.status(500).json(buildErrorResponse("Failed to disable vault PIN."));
  }
};

/**
 * POST /api/auth/vault/pin-request-reset
 * Generates a single-use tokenized link and emails it to the user.
 */
export const requestVaultPinReset = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email, type: "PASSWORD_RESET" },
    }).catch(() => {});

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        type: "PASSWORD_RESET",
        identifier: user.email,
        expiresAt,
      },
    });

    const resetUrl = `${APP_FRONTEND_URL}/reset-vault-pin?token=${rawToken}`;
    await sendVaultPinResetEmail(user.email, user.name, resetUrl);

    res.status(200).json({
      success: true,
      message: "Vault PIN reset link sent to your registered email address.",
    });
  } catch (error: unknown) {
    console.error("Request Vault PIN Reset Error:", error);
    res.status(500).json(buildErrorResponse("Unable to send PIN reset email."));
  }
};

/**
 * POST /api/auth/vault/pin-reset-confirm
 * Resets the Vault PIN using the single-use token received in email.
 */
export const resetVaultPinWithToken = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const body = req.body as ResetPinTokenInput;
    const rawToken = typeof body.token === "string" ? body.token.trim() : "";
    const newPin = typeof body.newPin === "string" ? body.newPin.trim() : "";

    if (!rawToken || !isValidPinFormat(newPin)) {
      res.status(400).json(buildErrorResponse("Valid token and 4-digit PIN are required."));
      return;
    }

    const computedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash },
    });

    if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
      res.status(400).json(buildErrorResponse("Invalid or expired PIN reset link."));
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      res.status(400).json(buildErrorResponse("Reset link expired. Please request a new one."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: tokenRecord.identifier } });
    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    const hashedPin = await bcrypt.hash(newPin, BCRYPT_SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { vaultPin: hashedPin },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    await createVaultPinResetNotification(user.id);

    res.status(200).json({
      success: true,
      message: "Vault PIN reset successfully! You can now unlock your vault.",
    });
  } catch (error: unknown) {
    console.error("Reset Vault PIN Token Error:", error);
    res.status(500).json(buildErrorResponse("Failed to reset vault PIN."));
  }
};
/* === SECTION 2 END === */