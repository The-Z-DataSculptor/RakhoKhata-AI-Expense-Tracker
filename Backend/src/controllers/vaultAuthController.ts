// src/controllers/vaultAuthController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CHECK IF PIN INITIALIZED ===
   ========================================================================== */
export const checkVaultPinStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access profile tracking." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPin: true }
    });

    if (!user) {
      res.status(404).json({ error: "User account record not found." });
      return;
    }

    const hasPinConfigured = user.vaultPin !== null && user.vaultPin !== undefined;

    res.status(200).json({ hasPin: hasPinConfigured });
  } catch (error) {
    console.error("Check Vault PIN Error:", error);
    res.status(500).json({ error: "Internal server error reading security parameters." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: INITIAL PIN CREATION ENGINE ===
   ========================================================================== */
export const setupVaultPin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { pin } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access profile tracking." });
      return;
    }

    if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
      res.status(400).json({ error: "PIN must be a strict 4-digit numerical combination." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        vaultPin: hashedPin
      }
    });

    res.status(201).json({
      success: true,
      message: "Secure vault gateway PIN established successfully!"
    });
  } catch (error) {
    console.error("Setup Vault PIN Error:", error);
    res.status(500).json({ error: "Internal server error deploying security parameters." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: UNLOCK VERIFICATION ENGAGEMENT ===
   ========================================================================== */
export const verifyVaultPin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { pin } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access profile tracking." });
      return;
    }

    if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
      res.status(400).json({ error: "PIN must be a 4-digit numerical code." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPin: true }
    });

    if (!user) {
      res.status(404).json({ error: "User account record not found." });
      return;
    }

    const storedHash = user.vaultPin;

    if (!storedHash) {
      res.status(400).json({ error: "No security PIN code established for this account." });
      return;
    }

    const isMatch = await bcrypt.compare(pin, storedHash);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: "Access denied. Invalid security validation code."
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vault unlocked successfully."
    });
  } catch (error) {
    console.error("Verify Vault PIN Error:", error);
    res.status(500).json({ error: "Internal server error verifying PIN." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: PIN DISABLE / REMOVAL ENGINE ===
   ========================================================================== */
export const disableVaultPin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access profile tracking." });
      return;
    }

    // Remove the PIN by setting it to null
    await prisma.user.update({
      where: { id: userId },
      data: {
        vaultPin: null
      }
    });

    res.status(200).json({
      success: true,
      message: "Vault lock disabled successfully."
    });
  } catch (error) {
    console.error("Disable Vault PIN Error:", error);
    res.status(500).json({ error: "Internal server error disabling PIN." });
  }
};
/* === SECTION 5 END === */