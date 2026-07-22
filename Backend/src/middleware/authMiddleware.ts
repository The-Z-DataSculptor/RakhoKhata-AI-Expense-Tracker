// Backend/src/middleware/authMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response, NextFunction, Request } from "express";
import crypto from "crypto";
import { decrypt } from "paseto-ts/v4";
import { prisma } from "../db";

// Structure of the payload embedded inside the PASETO token
interface TokenPayload {
  userId: string;
  email: string;
}

// Custom request type that attaches the decoded user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;      // 🚀 Added 'id' for compatibility across all middlewares
    userId: string;  // Kept 'userId' for backward compatibility
    email: string;
  };
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Generates the symmetric key required by PASETO (v4.local) using the application secret.
 * The key must be exactly 52 characters long starting with "k4.local.".
 */
function derivePasetoKey(): string {
  const secret =
    process.env.PASETO_SECRET ||
    "k4.local.abcdefghijklmnopqrstuvwxyz01234567890123456789";
  const hash = crypto.createHash("sha256").update(secret).digest();
  const base64url = hash.toString("base64url");
  return `k4.local.${base64url}`;
}

/**
 * Builds a safe error object. No internal details are ever exposed.
 */
function safeError(message: string): { error: string } {
  return { error: message };
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Middleware that verifies the PASETO session token from cookies.
 * On success, it attaches the user id and email to the request object.
 */
export const verifyTokenGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from HTTP‑only cookie
    const token = req.cookies?.token;

    if (!token) {
      res
        .status(401)
        .json(safeError("Access denied. Active session token missing."));
      return;
    }

    // 2. Decrypt the token using the derived PASETO key
    const { payload } = await decrypt(derivePasetoKey(), token);

    // 3. Narrow the payload to our known TokenPayload interface
    const decoded = payload as unknown as TokenPayload;

    // 4. Attach the verified user information to the request for downstream handlers
    // 🚀 Provides both 'id' and 'userId' to prevent property mismatch bugs
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
    };

    // 5. Proceed to the next middleware or route handler
    next();
  } catch (error: unknown) {
    console.error("PASETO Verification Guard Exception:", error);

    const errorMessage = String(error);
    if (errorMessage.includes("expired")) {
      res
        .status(403)
        .json(
          safeError(
            "Your financial session has expired. Please log in again."
          )
        );
      return;
    }

    res
      .status(403)
      .json(
        safeError(
          "Session authentication failed or token has been tampered with."
        )
      );
  }
};

/**
 * Middleware that blocks access if the user has not completed the onboarding process.
 * Must be placed after `verifyTokenGuard`.
 */
export const ensureOnboardingCompleted = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json(
          safeError("Unauthorized access. Active user session context missing.")
        );
      return;
    }

    // Look up the onboarding status directly from the database
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboardingCompleted: true },
    });

    if (!userProfile || !userProfile.isOnboardingCompleted) {
      res
        .status(403)
        .json(
          safeError(
            "Access denied. Please complete your personalized profile onboarding setup first."
          )
        );
      return;
    }

    // User has completed onboarding – continue to the requested route
    next();
  } catch (error: unknown) {
    console.error("Onboarding Validation Gate Exception:", error);
    res
      .status(500)
      .json(
        safeError("Internal server error confirming customization status.")
      );
  }
};
/* === SECTION 3 END === */