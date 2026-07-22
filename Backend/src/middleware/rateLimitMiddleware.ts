// Backend/src/middleware/rateLimitMiddleware.ts

import rateLimit from "express-rate-limit";
import { Request } from "express";

// Extend Request interface to recognize authenticated users
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * Clean development check relying strictly on environment configuration.
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * Key generator that falls back to User ID for authenticated sessions,
 * preventing shared IP lockouts on office/home networks.
 */
const userOrIpKey = (req: Request) => {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.id || req.ip || "unknown";
};

/**
 * Global safety limiter for general dashboard reads.
 */
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

/**
 * Strict authentication limiter for login, signup, and PIN operations.
 * Skips successful attempts so only FAILED attempts trigger the penalty.
 */
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

/**
 * AI API limiter for Gemini-powered endpoints.
 * ⚡ Updated: Lowered limit to 15 requests per hour.
 */
export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // 🚀 Changed from 30 to 15
  skip: () => isDev,
  keyGenerator: userOrIpKey,
  message: {
    error: "You have reached your hourly limit of 15 AI financial insights. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Mutation safety limiter that protects database write operations (POST, PUT, DELETE).
 */
export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150,
  skip: () => isDev,
  keyGenerator: userOrIpKey,
  message: {
    error: "You are updating records too rapidly. Please slow down and try again in 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});