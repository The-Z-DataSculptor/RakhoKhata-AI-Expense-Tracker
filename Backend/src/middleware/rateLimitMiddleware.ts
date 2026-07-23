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
 * WHY THIS FIX WAS MADE: Ensures an IP address is ALWAYS successfully extracted, and runs it
 * through express-rate-limit's own `ipKeyGenerator` helper so IPv6 addresses are safely
 * normalized to their containing subnet. Using the raw IP string directly (the old behavior)
 * lets a single IPv6 user rotate through addresses in their assigned block and bypass limits,
 * which is exactly what express-rate-limit's own validator warns about.
 */
function extractClientIp(req: Request): string {
  // 1. Check Express-resolved IP address (populated when 'trust proxy' is configured)
  if (req.ip && typeof req.ip === "string" && req.ip.trim().length > 0) {
    return ipKeyGenerator(req.ip.trim());
  }

  // 2. Fallback to direct socket remote address
  const socketRemoteAddress = req.socket?.remoteAddress;
  if (socketRemoteAddress && typeof socketRemoteAddress === "string" && socketRemoteAddress.trim().length > 0) {
    return ipKeyGenerator(socketRemoteAddress.trim());
  }

  // 3. Fallback to local loopback address if network interface details are unavailable
  return "127.0.0.1";
}

/**
 * WHY THIS FIX WAS MADE: Generates explicitly prefixed rate-limiting keys (`user_...` vs `ip_...`).
 * Prevents key collision overlap between user ID strings and IP address formats.
 */
function getUserOrIpKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;

  // Prefer authenticated user ID if session is active
  if (authReq.user?.userId) {
    return `user_${authReq.user.userId}`;
  }
  if (authReq.user?.id) {
    return `user_${authReq.user.id}`;
  }

  // Fallback to validated client IP address
  const clientIp = extractClientIp(req);
  return `ip_${clientIp}`;
}

/**
 * WHY THIS FIX WAS MADE: Replaced hardcoded process.env.NODE_ENV checks with a explicit environment check
 * that can be overridden with DISABLE_RATE_LIMIT=true during automated local testing.
 */
function shouldSkipLimiter(): boolean {
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return true;
  }
  return false;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RATE LIMITER MIDDLEWARES ===
   ========================================================================== */

/**
 * Global API Rate Limiter
 * Restricts overall standard HTTP traffic to 1,000 requests per 15-minute window per client IP.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 1000, // Maximum 1000 requests per window
  statusCode: 429,
  skip: shouldSkipLimiter,
  keyGenerator: (req: Request) => `global_${extractClientIp(req)}`,
  message: buildErrorResponse(
    "Too many dashboard requests. Security cooldown active, please try again in 15 minutes."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict Auth Endpoint Limiter
 * Restricts sensitive authentication attempts (login, password reset) to 10 failed requests per 15 minutes per IP.
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Maximum 10 failed attempts
  statusCode: 429,
  skip: shouldSkipLimiter,
  skipSuccessfulRequests: true, // Successful logins do not count toward failure threshold
  keyGenerator: (req: Request) => `auth_${extractClientIp(req)}`,
  message: buildErrorResponse(
    "Too many failed security attempts. Please wait 15 minutes before trying again."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI Service Integration Rate Limiter
 * Restricts expensive AI document/receipt scan operations to 15 calls per hour per authenticated user or IP.
 */
export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 15, // Maximum 15 AI requests per hour
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
 * Database Write Operation Rate Limiter
 * Protects mutation endpoints (create/update/delete) from flood spamming (150 requests per 5 minutes per user/IP).
 */
export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 150, // Maximum 150 write operations per window
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