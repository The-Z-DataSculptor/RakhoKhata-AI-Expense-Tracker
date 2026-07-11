// src/middleware/authMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response, NextFunction, Request } from "express";
import crypto from "crypto";          // Used to derive the matching 52-character secret key layout
import { decrypt } from "paseto-ts/v4"; // Pure TypeScript PASETO v4 local decrypt engine
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TokenPayload {
  userId: string;
  email: string;
}

// Custom interface extending the standard Express Request layout to attach profile data
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: KEY DERIVATION UTILITIES ===
   ========================================================================== */
const PASETO_SECRET = process.env.PASETO_SECRET || "k4.local.abcdefghijklmnopqrstuvwxyz01234567890123456789";

// Generates the matching 52-character key footprint required by paseto-ts 
// to mirror your authController encryption key perfectly.
const getPasetoKey = (): string => {
  const hash = crypto.createHash("sha256").update(PASETO_SECRET).digest();
  const base64url = hash.toString("base64url");
  return `k4.local.${base64url}`;
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: VERIFICATION GUARD MIDDLEWARE ===
   ========================================================================== */
export const verifyTokenGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract the secure token string directly from the cookie container
    const token = req.cookies?.token;

    // 2. Structural Gate: If the token is missing from the cookie slot, deny access instantly
    if (!token) {
      res.status(401).json({ error: "Access denied. Active session token missing." });
      return;
    }

    // 3. Cryptographic Handshake: Decrypt the envelope using the synchronized PASERK key format
    const { payload } = await decrypt(getPasetoKey(), token);
    const decoded = payload as unknown as TokenPayload;

    // 4. Assignment: Attach the verified user metadata safely to the request lifecycle
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    // 5. Handoff: Control passes cleanly to the next controller down the pipeline
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