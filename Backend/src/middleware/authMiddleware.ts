// Backend/src/middleware/authMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse, NextFunction, Request } from "express";
import { prisma } from "../db";
import { decryptSessionToken } from "../utils/sessionToken";

interface TokenPayload {
  userId: string;
  email: string;
  isEmailVerified?: boolean;
  isOnboardingCompleted?: boolean;
  exp?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    isEmailVerified?: boolean;
    isOnboardingCompleted?: boolean;
  };
  file?: any;
  files?: any;
  body: any;
  query: any;
  params: any;
  cookies: any;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

function buildSafeError(message: string): { error: string } {
  return { error: message };
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & MIDDLEWARES ===
   ========================================================================== */

export const verifyTokenGuard = async (
  req: AuthenticatedRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token || typeof token !== "string" || !token.trim()) {
      res
        .status(401)
        .json(buildSafeError("Access denied. Active session token missing."));
      return;
    }

    const decoded = (await decryptSessionToken(token)) as TokenPayload | null;

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

    req.user = {
      id: String(decoded.userId).trim(),
      userId: String(decoded.userId).trim(),
      email: String(decoded.email).trim().toLowerCase(),
      isEmailVerified: decoded.isEmailVerified,
      isOnboardingCompleted: decoded.isOnboardingCompleted,
    };

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

export const ensureEmailVerified = async (
  req: AuthenticatedRequest,
  res: ExpressResponse,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json(buildSafeError("Unauthorized access. Active user session context missing."));
      return;
    }

    if (req.user?.isEmailVerified === true) {
      next();
      return;
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { isEmailVerified: true },
    });

    if (!userProfile) {
      res.status(401).json(buildSafeError("User account no longer exists. Session invalid."));
      return;
    }

    if (!userProfile.isEmailVerified) {
      res.status(403).json(
        buildSafeError(
          "Email not verified. Please check your inbox or request a new verification link."
        )
      );
      return;
    }

    if (req.user) {
      req.user.isEmailVerified = true;
    }

    next();
  } catch (error: unknown) {
    console.error("Email Verification Guard Exception:", error);
    res.status(500).json(buildSafeError("Internal server error verifying email status."));
  }
};

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

    if (req.user?.isOnboardingCompleted === true) {
      next();
      return;
    }

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

    if (req.user) {
      req.user.isOnboardingCompleted = true;
    }

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