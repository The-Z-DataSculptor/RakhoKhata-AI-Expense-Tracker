// src/middleware/rateLimitMiddleware.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import rateLimit from "express-rate-limit"; // The core network rate-limiting middleware engine
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: GLOBAL SAFETY LIMITER (ALL API ENDPOINTS) ===
   ========================================================================== */
// Standard safety valve to protect the general ecosystem from web crawlers or scraping scripts
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window scale represented in milliseconds
  max: 100,                 // Caps each unique IP address to a maximum of 100 requests per window
  message: {
    error: "Too many network requests originated from this address. Please try again in 15 minutes.",
  },
  standardHeaders: true,    // Returns standard rate limit telemetry indicators in the response headers
  legacyHeaders: false,      // Disables old X-RateLimit headers to keep response envelopes clean
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: STRICT SECURITY LIMITER (AUTHENTICATION HIGHWAYS) ===
   ========================================================================== */
// Strict defense barrier wrapped around endpoints that trigger heavy cryptographic computations (Login, Signup)
export const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour tracking frame window represented in milliseconds
  max: 5,                   // Allows only 5 password verification attempts per hour per IP address
  message: {
    error: "Too many failed login or registration attempts. Security lock active. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 3 END === */