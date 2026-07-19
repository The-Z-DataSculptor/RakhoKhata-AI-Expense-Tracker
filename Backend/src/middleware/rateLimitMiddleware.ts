// Backend/src/middleware/rateLimitMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import rateLimit from "express-rate-limit";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Minimal interface to represent the request object for our
 * development bypass helper. This avoids using the 'any' type.
 */
interface MinimalRequest {
  ip?: string;
  connection?: {
    remoteAddress?: string;
  };
  // Express‑rate‑limit attaches additional properties,
  // but we only need the IP address for the check.
}

/**
 * Determines whether the request originates from a local development
 * environment. This allows bypassing rate limits during local testing.
 */
function isDevelopment(req: MinimalRequest): boolean {
  // The IP address may be stored in req.ip or req.connection.remoteAddress
  const ip = req.ip || req.connection?.remoteAddress || "";

  return (
    process.env.NODE_ENV === "development" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.includes("localhost")
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Global safety limiter that applies to general dashboard requests.
 * Increased to 1,000 requests per 15 minutes to accommodate complex single‑page applications.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  skip: (req) => isDevelopment(req as MinimalRequest),
  message: {
    error:
      "Too many dashboard network requests. Security cooldown active, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict authentication limiter for login, signup, and PIN operations.
 * Protects against brute‑force attacks.
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => isDevelopment(req as MinimalRequest),
  message: {
    error:
      "Too many failed login or security authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI API limiter for Gemini‑powered endpoints.
 * Prevents excessive calls that would exhaust API credits or quotas.
 */
export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  skip: (req) => isDevelopment(req as MinimalRequest),
  message: {
    error:
      "You have reached your hourly limit for AI financial insights. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Mutation safety limiter that protects write operations (POST, PUT, DELETE).
 * Stops automated scripts from flooding the database with junk entries.
 */
export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150,
  skip: (req) => isDevelopment(req as MinimalRequest),
  message: {
    error:
      "You are updating database records too rapidly. Please slow down and try again in 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 3 END === */