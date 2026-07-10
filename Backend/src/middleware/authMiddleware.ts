// src/middleware/authMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// This interface defines what properties are hidden inside our signed token cargo payload
interface TokenPayload {
  userId: string;
  email: string;
}

// We extend the default Express Request type to create a clean custom interface
// This safely attaches the verified user metadata to the request cycle
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MIDDLEWARE LOGIC ===
   ========================================================================== */
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const verifyTokenGuard = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Extract the Authorization header string sent by the frontend client
    const authHeader = req.headers.authorization;

    // 2. Check: If the header is missing or doesn't start with 'Bearer ', deny entry
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access denied. No security session token provided." });
      return;
    }

    // 3. Extract the clean token string by splitting off the 'Bearer ' label prefix
    const token = authHeader.split(" ")[1];

    // 4. Verification: Decrypt and check the token signature against our secret vault key
    const decodedPayload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 5. Assignment: Attach the verified identity cargo directly onto the request ticket
    req.user = {
      userId: decodedPayload.userId,
      email: decodedPayload.email,
    };

    // 6. Handoff: The keycard is valid! Tell Express to pass this request to the final controller
    next();

  } catch (error) {
    console.error("Security Guard Middleware Exception:", error);
    
    // If the token was altered by an attacker or expired, return a clean error code
    res.status(403).json({ error: "Session expired or invalid token keycard authentication." });
  }
};
/* === SECTION 3 END === */