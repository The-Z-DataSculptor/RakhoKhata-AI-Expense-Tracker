// src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import rateLimit from "express-rate-limit"; // Built-in node engine wrapper to throttle malicious threat actors
import { registerUser, loginUser, getMe, logoutUser } from "../controllers/authController"; 
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SPECIFIC SECURITY RATE LIMITERS ===
   ========================================================================== */
// Strict defensive shield targeting endpoints executing heavy cryptographic computations (bcrypt hashing)
const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour time window tracking index represented in milliseconds
  max: 7,                   // FIXED: Limits the unique IP footprint to exactly 7 attempts per hour window scale
  message: {
    error: "Too many login or registration attempts. Brute-force security lock active. Please try again in an hour.",
  },
  standardHeaders: true,    // Retains standard telemetry limits reporting transparency inside client response headers
  legacyHeaders: false,     // Disables older X-RateLimit headers to keep network data payloads concise
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: ROUTE DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Public Route: http://localhost:5000/api/auth/signup
// Guarded: Throttles registration flooding to prevent fake user inflation attacks
router.post("/signup", strictAuthLimiter, registerUser);

// Public Route: http://localhost:5000/api/auth/login
// Guarded: Limits brute-force cracking attempts to shield CPU hash cycles from spike loops
router.post("/login", strictAuthLimiter, loginUser);

// Public Route: http://localhost:5000/api/auth/logout
// Drops an expired blank cookie to securely clear the session tracking out of browser memory cache instantly
router.post("/logout", logoutUser);

// Protected Route: http://localhost:5000/api/auth/me
// BY THE BOOK: The request stream must pass the verifyTokenGuard verification gate
// before Express delivers execution context over to the getMe profile controller.
router.get("/me", verifyTokenGuard, getMe);
/* === SECTION 3 END === */

export default router;