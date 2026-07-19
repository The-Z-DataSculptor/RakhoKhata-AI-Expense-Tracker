// src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  updateProfile,
  changePassword,
  requestPasswordReset,   
  resetForgottenPassword, 
  verifyEmail,            
  redirectToGoogle,     
  handleGoogleCallback, 
  completeOnboarding,
  getExchangeRates, // 🚀 ADDED: Imports your secure server-side rates proxy handler
} from "../controllers/authController";
import { checkVaultPinStatus, setupVaultPin, verifyVaultPin, disableVaultPin } from "../controllers/vaultAuthController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import { strictAuthLimiter } from "../middleware/rateLimitMiddleware";
import rateLimit from "express-rate-limit";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SPECIFIC SECURITY RATE LIMITERS ===
   ========================================================================== */
const pinAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => process.env.NODE_ENV === "development",
  message: {
    error: "Excessive PIN entry attempts detected. Vault securely locked for 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: ROUTE DEFINITIONS ===
   ========================================================================== */
const router = Router();

router.post("/signup", strictAuthLimiter, registerUser);
router.post("/login", strictAuthLimiter, loginUser);
router.post("/logout", logoutUser);
router.get("/me", verifyTokenGuard, getMe);

// Profile update and password change
router.put("/update-profile", verifyTokenGuard, updateProfile);
router.post("/change-password", verifyTokenGuard, changePassword);

// 🚀 WELCOME GATE CHANNELS: Expose protected API tunnel for capturing user onboarding metrics
router.put("/complete-onboarding", verifyTokenGuard, completeOnboarding);

// 🚀 RECOVERY SECURE API CHANNELS: Completely exposed publicly outside token authentication perimeters
router.post("/forgot-password", strictAuthLimiter, requestPasswordReset);
router.post("/reset-password", strictAuthLimiter, resetForgottenPassword);

// 🚀 ONBOARDING LINK CHANNELS: Expose public activation link route mapping
router.post("/verify-email", strictAuthLimiter, verifyEmail);

// 🚀 UNIFIED GOOGLE OAUTH 2.0 ROUTE CHANNELS: Completely open public entry pipelines
router.get("/google", redirectToGoogle);
router.get("/google/callback", handleGoogleCallback);

// 🚀 LIVE EXCHANGE RATES API PROXY: Public channel for browser-side currency context tracking layers
router.get("/exchange-rates", getExchangeRates);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: VAULT PIN SECURITY SUB-ROUTES ===
   ========================================================================== */
router.get("/vault/pin-status", verifyTokenGuard, checkVaultPinStatus);
router.post("/vault/pin-setup", verifyTokenGuard, strictAuthLimiter, setupVaultPin);
router.post("/vault/pin-verify", verifyTokenGuard, pinAttemptLimiter, verifyVaultPin);
router.post("/vault/pin-disable", verifyTokenGuard, pinAttemptLimiter, disableVaultPin);
/* === SECTION 4 END === */

export default router;