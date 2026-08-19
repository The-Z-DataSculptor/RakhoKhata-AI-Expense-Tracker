// Backend/src/middleware/rateLimitMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response as ExpressResponse } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

/**
 * Standardized JSON error response builder matching application-wide conventions
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * Extracts and normalizes client IP for IPv4 and IPv6 subnet clustering
 */
export function extractClientIp(req: Request): string {
  // 1. Express-resolved IP
  if (req.ip && typeof req.ip === "string" && req.ip.trim().length > 0) {
    return ipKeyGenerator(req.ip.trim());
  }

  // 2. Socket remote address fallback
  const socketRemoteAddress = req.socket?.remoteAddress;
  if (socketRemoteAddress && typeof socketRemoteAddress === "string" && socketRemoteAddress.trim().length > 0) {
    return ipKeyGenerator(socketRemoteAddress.trim());
  }

  // 3. Fallback
  return "127.0.0.1";
}

/**
 * Single-pool identifier: Binds limits to the authenticated user ID regardless of IP/network changes.
 * Falls back to IP only if the user is unauthenticated.
 */
export function getUserOrIpKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;

  if (authReq.user?.userId) {
    return `user_${authReq.user.userId}`;
  }
  if (authReq.user?.id) {
    return `user_${authReq.user.id}`;
  }

  const clientIp = extractClientIp(req);
  return `ip_${clientIp}`;
}

/**
 * Skips limiter during test automation or when explicitly disabled via env
 */
function shouldSkipLimiter(): boolean {
  return process.env.DISABLE_RATE_LIMIT === "true";
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RATE LIMITER MIDDLEWARES ===
   ========================================================================== */

/**
 * Global API Rate Limiter (1,000 req / 15 min per IP)
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  statusCode: 429,
  skip: shouldSkipLimiter,
  keyGenerator: (req: Request) => `global_${extractClientIp(req)}`,
  validate: { keyGeneratorIpFallback: false },
  message: buildErrorResponse(
    "Too many dashboard requests. Security cooldown active, please try again in 15 minutes."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict Auth Limiter (10 failed attempts / 15 min)
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  statusCode: 429,
  skip: shouldSkipLimiter,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => `auth_${extractClientIp(req)}`,
  validate: { keyGeneratorIpFallback: false },
  message: buildErrorResponse(
    "Too many failed security attempts. Please wait 15 minutes before trying again."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Master Unified AI Service Rate Limiter
 * Shared 15 calls/hour cap across:
 * - AI Greetings (Dashboard & Insights)
 * - Timeline Audits (Today, Week, Month)
 * - Interactive AI Q&A / Power Queries
 * - OCR Receipt & Document Scanners
 */
export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 15, // Strictly 15 combined AI operations per hour
  statusCode: 429,
  skip: shouldSkipLimiter,
  keyGenerator: getUserOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: buildErrorResponse(
    "You have reached your hourly limit of 15 AI financial insights. Please try again in an hour."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Database Mutations Limiter (150 write ops / 5 min)
 */
export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 150,
  statusCode: 429,
  skip: shouldSkipLimiter,
  keyGenerator: getUserOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: buildErrorResponse(
    "You are updating records too rapidly. Please slow down and try again in 5 minutes."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 3 END === */