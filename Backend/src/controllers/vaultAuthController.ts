// Backend/src/controllers/vaultAuthController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Data contract for setting up or changing a PIN
interface SetupPinInput {
  pin: string;
  currentPin?: string;
}

// Data contract for verifying a PIN
interface VerifyPinInput {
  pin: string;
}

// Data contract for disabling a PIN
interface DisablePinInput {
  pin: string;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

// Standard cost factor for bcrypt password/PIN hashing
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Standardized JSON error response builder
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * WHY THIS IS NEEDED: Ensures inputs are strictly 4 numeric digits.
 * Rejects non-numeric characters, spaces, floats, and invalid string lengths.
 */
function isValidPinFormat(pin: unknown): pin is string {
  if (typeof pin !== "string") {
    return false;
  }
  return /^\d{4}$/.test(pin.trim());
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
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

    // WHY THIS FIX WAS MADE: Selects ONLY the vaultPin column to optimize DB query memory overhead.
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

    const { pin, currentPin } = req.body as SetupPinInput;

    // 1. Validate new PIN format
    if (!isValidPinFormat(pin)) {
      res.status(400).json(buildErrorResponse("New PIN must be exactly 4 digits."));
      return;
    }

    // 2. Fetch user to verify account existence and current PIN status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, vaultPin: true },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    // WHY THIS FIX WAS MADE: If a PIN is already configured, force the user to prove ownership by validating currentPin.
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

    // 3. Hash the new PIN and update database
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

    const { pin } = req.body as VerifyPinInput;

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

    // Compare provided PIN against stored hash
    const isMatch = await bcrypt.compare(pin, user.vaultPin);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: "Incorrect PIN.",
      });
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

    const { pin } = req.body as DisablePinInput;

    // WHY THIS FIX WAS MADE: Prevents unauthorized removal of vault locks by requiring the valid PIN.
    if (!isValidPinFormat(pin)) {
      res.status(400).json(buildErrorResponse("Valid 4-digit PIN is required to disable vault lock."));
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

    if (!user.vaultPin) {
      res.status(400).json(buildErrorResponse("No vault PIN is currently configured."));
      return;
    }

    // Verify PIN before disabling lock
    const isPinCorrect = await bcrypt.compare(pin, user.vaultPin);
    if (!isPinCorrect) {
      res.status(401).json(buildErrorResponse("Incorrect PIN. Vault remains locked."));
      return;
    }

    // Remove PIN protection
    await prisma.user.update({
      where: { id: userId },
      data: { vaultPin: null },
    });

    res.status(200).json({
      success: true,
      message: "Vault PIN has been successfully removed.",
    });
  } catch (error: unknown) {
    console.error("Disable Vault PIN Error:", error);
    res.status(500).json(buildErrorResponse("Failed to disable vault PIN."));
  }
};
/* === SECTION 3 END === */