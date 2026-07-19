// Backend/src/controllers/vaultAuthController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Builds a safe error response object that does not leak internal information.
 */
function safeError(message: string): { error: string } {
  return { error: message };
}

/**
 * Validates that the provided PIN is exactly 4 numeric digits.
 */
function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * GET /api/auth/vault/pin-status
 * Checks whether the current user has a vault PIN configured.
 */
export const checkVaultPinStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPin: true },
    });

    if (!user) {
      res.status(404).json(safeError("User account not found."));
      return;
    }

    const hasPin = user.vaultPin !== null && user.vaultPin !== undefined;
    res.status(200).json({ hasPin });
  } catch (error: unknown) {
    console.error("Check Vault PIN Error:", error);
    res.status(500).json(safeError("Unable to verify PIN status."));
  }
};

/**
 * POST /api/auth/vault/pin-setup
 * Creates a new 4‑digit vault PIN for the user.
 */
export const setupVaultPin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const { pin } = req.body as Record<string, unknown>;

    if (!pin || typeof pin !== "string" || !isValidPin(pin)) {
      res.status(400).json(safeError("PIN must be exactly 4 digits."));
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

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
    res.status(500).json(safeError("Failed to set up vault PIN."));
  }
};

/**
 * POST /api/auth/vault/pin-verify
 * Verifies the entered 4‑digit PIN against the stored hash.
 */
export const verifyVaultPin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const { pin } = req.body as Record<string, unknown>;

    if (!pin || typeof pin !== "string" || !isValidPin(pin)) {
      res.status(400).json(safeError("PIN must be exactly 4 digits."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPin: true },
    });

    if (!user) {
      res.status(404).json(safeError("User account not found."));
      return;
    }

    const storedHash = user.vaultPin;
    if (!storedHash) {
      res.status(400).json(safeError("No vault PIN has been set up."));
      return;
    }

    const isValid = await bcrypt.compare(pin, storedHash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: "Incorrect PIN.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vault unlocked.",
    });
  } catch (error: unknown) {
    console.error("Verify Vault PIN Error:", error);
    res.status(500).json(safeError("PIN verification failed."));
  }
};

/**
 * POST /api/auth/vault/pin-disable
 * Removes the vault PIN, disabling the lock.
 */
export const disableVaultPin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    // Delete the PIN by setting it to null
    await prisma.user.update({
      where: { id: userId },
      data: { vaultPin: null },
    });

    res.status(200).json({
      success: true,
      message: "Vault PIN has been removed.",
    });
  } catch (error: unknown) {
    console.error("Disable Vault PIN Error:", error);
    res.status(500).json(safeError("Failed to disable vault PIN."));
  }
};
/* === SECTION 3 END === */