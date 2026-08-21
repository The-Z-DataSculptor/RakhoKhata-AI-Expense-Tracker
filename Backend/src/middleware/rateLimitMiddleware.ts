// Backend/src/middleware/rateLimitMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * Normalizes IP strings safely against reverse-proxy headers and IPv6 mapping
 */
export function extractClientIp(req: Request): string {
  let candidateIp = req.ip || req.socket?.remoteAddress || "127.0.0.1";

  if (typeof candidateIp === "string") {
    candidateIp = candidateIp.trim();
    // Normalize IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
    if (candidateIp.startsWith("::ffff:")) {
      candidateIp = candidateIp.substring(7);
    }
    try {
      return ipKeyGenerator(candidateIp);
    } catch {
      return candidateIp;
    }
  }

  return "127.0.0.1";
}

export function getUserOrIpKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;

  if (authReq.user?.userId) {
    return `user_${authReq.user.userId}`;
  }
  if (authReq.user?.id) {
    return `user_${authReq.user.id}`;
  }

  return `ip_${extractClientIp(req)}`;
}

function shouldSkipLimiter(): boolean {
  return process.env.DISABLE_RATE_LIMIT === "true";
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RATE LIMITER MIDDLEWARES ===
   ========================================================================== */

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

export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  statusCode: 429,
  skip: shouldSkipLimiter,
  keyGenerator: getUserOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: buildErrorResponse(
    "You have reached your hourly limit of 20 AI operations. Please try again in an hour."
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
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