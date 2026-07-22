// Backend/src/middleware/rateLimitMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import rateLimit from "express-rate-limit";
import { Request } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UTILITIES ===
   ========================================================================== */

const isDev = process.env.NODE_ENV === "development";

const userOrIpKey = (req: Request) => {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.userId || authReq.user?.id || req.ip || "unknown";
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RATE LIMITERS ===
   ========================================================================== */

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  skip: () => isDev,
  message: {
    error: "Too many dashboard requests. Security cooldown active, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skip: () => isDev,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many failed security attempts. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  skip: () => isDev,
  keyGenerator: userOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: {
    error: "You have reached your hourly limit of 15 AI financial insights. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150,
  skip: () => isDev,
  keyGenerator: userOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: {
    error: "You are updating records too rapidly. Please slow down and try again in 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 3 END === */