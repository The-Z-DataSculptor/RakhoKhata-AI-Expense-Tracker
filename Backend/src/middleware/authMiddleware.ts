// Backend/src/middleware/authMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response, NextFunction, Request } from "express";
import crypto from "crypto"; 
import { decrypt } from "paseto-ts/v4"; 
import { prisma } from "../db"; // 🚀 ADDED: Required to look up live profile checkpoint states
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: KEY DERIVATION UTILITIES ===
   ========================================================================== */
const PASETO_SECRET = process.env.PASETO_SECRET || "k4.local.abcdefghijklmnopqrstuvwxyz01234567890123456789";

const getPasetoKey = (): string => {
  const hash = crypto.createHash("sha256").update(PASETO_SECRET).digest();
  const base64url = hash.toString("base64url");
  return `k4.local.${base64url}`;
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: VERIFICATION GUARD MIDDLEWARE (SESSION CHECK) ===
   ========================================================================== */
export const verifyTokenGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ error: "Access denied. Active session token missing." });
      return;
    }

    const { payload } = await decrypt(getPasetoKey(), token);
    const decoded = payload as unknown as TokenPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();

  } catch (error) {
    console.error("PASETO Verification Guard Exception:", error);
    
    const errorString = String(error);
    if (errorString.includes("expired")) {
      res.status(403).json({ error: "Your financial session has expired. Please log in again." });
      return;
    }
    
    res.status(403).json({ error: "Session authentication failed or token has been tampered with." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: 🚀 NEW: ONBOARDING ACCESSIBILITY GUARD ===
   ========================================================================== */
/**
 * Security Guard that blocks users from accessing financial engines (ledger records,
 * budgets, asset vaults) if they haven't finished the onboarding questionnaire form.
 */
export const ensureOnboardingCompleted = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Active user session context missing." });
      return;
    }

    // Pull the real-time onboarding milestone checkpoint from Postgres
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboardingCompleted: true }
    });

    // If account doesn't exist or hasn't finished onboarding, block the request data line
    if (!userProfile || !userProfile.isOnboardingCompleted) {
      res.status(403).json({ 
        error: "Access denied. Please complete your personalized profile onboarding setup first." 
      });
      return;
    }

    // User passed the gate! Continue onto the data controller safely
    next();

  } catch (error) {
    console.error("Onboarding Validation Gate Exception:", error);
    res.status(500).json({ error: "Internal server error confirming customization status." });
  }
};
/* === SECTION 5 END === */