/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse, NextFunction, Request } from "express";
import crypto from "crypto";
import { decrypt } from "paseto-ts/v4";
import { prisma } from "../db";

// Structure of the payload embedded inside the PASETO token
interface TokenPayload {
  userId: string;
  email: string;
  exp?: string;
}

// Custom request type that attaches the decoded user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;      // Added for compatibility across all middlewares
    userId: string;  // Kept for backward compatibility
    email: string;
  };
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

/**
 * Standardized JSON error response builder
 */
function buildSafeError(message: string): { error: string } {
  return { error: message };
}

/**
 * WHY THIS FIX WAS MADE: Generates a 52-character PASERK key and throws an explicit startup error
 * in production if PASETO_SECRET is missing, preventing silent fallbacks to insecure keys.
 */
function derivePasetoKey(): string {
  const secret = process.env.PASETO_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: PASETO_SECRET environment variable is missing!"
      );
    }
    // Safe fallback for local development environment only
    const devFallback =
      "dev_secret_key_must_be_at_least_32_characters_long_for_security";
    const devHash = crypto.createHash("sha256").update(devFallback).digest();
    return `k4.local.${devHash.toString("base64url")}`;
  }

  const hash = crypto.createHash("sha256").update(secret).digest();
  return `k4.local.${hash.toString("base64url")}`;
}

// Memory cache for the derived key to avoid hashing on every single HTTP request
let cachedPasetoKey: string | null = null;

function getPasetoKey(): string {
  if (!cachedPasetoKey) {
    cachedPasetoKey = derivePasetoKey();
  }
  return cachedPasetoKey;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & MIDDLEWARES ===
   ========================================================================== */

/**
 * Middleware that verifies the PASETO session token from cookies.
 * On success, it attaches the user id and email to the request object.
 */
export const verifyTokenGuard = async (
  req: AuthenticatedRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from HTTP-only cookie
    const token = req.cookies?.token;

    if (!token || typeof token !== "string" || !token.trim()) {
      res
        .status(401)
        .json(buildSafeError("Access denied. Active session token missing."));
      return;
    }

    // 2. Decrypt the token using the cached PASETO key
    const { payload } = await decrypt(getPasetoKey(), token);

    // 3. Narrow and validate the payload safely
    const decoded = payload as unknown as TokenPayload;

    // WHY THIS FIX WAS MADE: Explicitly verifies payload integrity so missing userId or email doesn't pollute req.user.
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId ||
      !decoded.email
    ) {
      res
        .status(401)
        .json(buildSafeError("Invalid session token payload structure."));
      return;
    }

    // WHY THIS FIX WAS MADE: Explicitly checks the ISO expiration timestamp claim to reject expired session tokens.
    if (decoded.exp) {
      const expirationDate = new Date(decoded.exp);
      if (!isNaN(expirationDate.getTime()) && expirationDate < new Date()) {
        res
          .status(401)
          .json(
            buildSafeError(
              "Your financial session has expired. Please log in again."
            )
          );
        return;
      }
    }

    // 4. Attach verified user identity to the request context
    req.user = {
      id: String(decoded.userId).trim(),
      userId: String(decoded.userId).trim(),
      email: String(decoded.email).trim().toLowerCase(),
    };

    // 5. Proceed to the next middleware or route handler
    next();
  } catch (error: unknown) {
    console.error("PASETO Verification Guard Exception:", error);

    const errorMessage = String(error);
    if (errorMessage.includes("expired")) {
      res
        .status(401)
        .json(
          buildSafeError(
            "Your financial session has expired. Please log in again."
          )
        );
      return;
    }

    res
      .status(401)
      .json(
        buildSafeError(
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
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json(
          buildSafeError(
            "Unauthorized access. Active user session context missing."
          )
        );
      return;
    }

    // WHY THIS FIX WAS MADE: Queries only the onboarding status to minimize database query overhead.
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboardingCompleted: true },
    });

    if (!userProfile) {
      res
        .status(401)
        .json(buildSafeError("User account no longer exists. Session invalid."));
      return;
    }

    if (!userProfile.isOnboardingCompleted) {
      res
        .status(403)
        .json(
          buildSafeError(
            "Access denied. Please complete your personalized profile onboarding setup first."
          )
        );
      return;
    }

    // User has completed onboarding – continue to requested route
    next();
  } catch (error: unknown) {
    console.error("Onboarding Validation Gate Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error confirming customization status."
        )
      );
  }
};
/* === SECTION 3 END === */