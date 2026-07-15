// src/middleware/rateLimitMiddleware.ts

import rateLimit from "express-rate-limit";

/**
 * UTILITY: Localhost bypass rule
 * Skip rate limiting entirely if the request is originating from local development environments.
 */
const isDevelopment = (req: any): boolean => {
  const ip = req.ip || req.connection.remoteAddress || "";
  return (
    process.env.NODE_ENV === "development" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.includes("localhost")
  );
};

/* ==========================================================================
   === SECTION 2: GLOBAL SAFETY LIMITER (GENERAL DASHBOARD HIGHWAYS) ===
   ========================================================================== */
/**
 * Global general-use limiter.
 * Covers general reading, workspace changes, transaction list loads, and notification checks.
 * Increased to a highly realistic limit of 1,000 requests per 15 minutes.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                // 👈 UPGRADED: 1,000 requests is realistic for complex single-page apps
  skip: isDevelopment,      // 👈 BYPASS: Never locks you out while you write code locally
  message: {
    error: "Too many dashboard network requests. Security cooldown active, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================================================
   === SECTION 3: STRICT SECURITY LIMITER (AUTHENTICATION HIGHWAYS) ===
   ========================================================================== */
/**
 * Defense system wrapped around Login, Signup, and PIN changes.
 * Keeps password hashing algorithms from maxing out your CPU under a brute-force attack.
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (shorter, fairer block window)
  max: 10,                  // 👈 UPGRADED: 10 attempts (more forgiving for typos)
  skip: isDevelopment,
  message: {
    error: "Too many failed login or security authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================================================
   === SECTION 4: AI & GEMINI CONTROLLER LIMITER (AI INSIGHTS) ===
   ========================================================================== */
/**
 * Protection layer specifically for Gemini AI API processing.
 * Prevents rapid looping calls to external AI servers which would exhaust API rate limits or credits.
 */
export const aiApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour tracking frame
  max: 30,                  // 👈 Limits users to 30 AI questions/insights per hour
  skip: isDevelopment,
  message: {
    error: "You have reached your hourly limit for AI financial insights. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================================================
   === SECTION 5: MUTATION SAFETY LIMITER (DATA WRITES) ===
   ========================================================================== */
/**
 * Soft defense for operations that write data to the Neon database cloud (POST, PUT, DELETE).
 * Prevents script automation spamming your transaction/category tables with junk data.
 */
export const writeActionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 150,                 // 👈 Max 150 creations/updates/deletions every 5 minutes
  skip: isDevelopment,
  message: {
    error: "You are updating database records too rapidly. Please slow down and try again in 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});