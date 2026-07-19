// Backend/src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router, Request } from "express";
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
  getExchangeRates,
} from "../controllers/authController";
import {
  checkVaultPinStatus,
  setupVaultPin,
  verifyVaultPin,
  disableVaultPin,
} from "../controllers/vaultAuthController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import { strictAuthLimiter } from "../middleware/rateLimitMiddleware";
import rateLimit from "express-rate-limit";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SECURITY RATE LIMITERS ===
   ========================================================================== */

/**
 * PIN verification limiter – prevents brute‑forcing of the vault PIN.
 * Bypassed in local development environments.
 */
const pinAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skip: (req: Request) => process.env.NODE_ENV === "development",
  message: {
    error:
      "Excessive PIN entry attempts detected. Vault securely locked for 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: AUTHENTICATION ROUTES ===
   ========================================================================== */
const router = Router();

// Local authentication endpoints
router.post("/signup", strictAuthLimiter, registerUser);
router.post("/login", strictAuthLimiter, loginUser);
router.post("/logout", logoutUser);
router.get("/me", verifyTokenGuard, getMe);

// Profile & credential management
router.put("/update-profile", verifyTokenGuard, updateProfile);
router.post("/change-password", verifyTokenGuard, changePassword);
router.put("/complete-onboarding", verifyTokenGuard, completeOnboarding);

// Password reset flow (public routes)
router.post("/forgot-password", strictAuthLimiter, requestPasswordReset);
router.post("/reset-password", strictAuthLimiter, resetForgottenPassword);

// Email verification (public)
router.post("/verify-email", strictAuthLimiter, verifyEmail);

// Google OAuth 2.0 (public entry points)
router.get("/google", redirectToGoogle);
router.get("/google/callback", handleGoogleCallback);

// Exchange rates proxy (public, for frontend currency context)
router.get("/exchange-rates", getExchangeRates);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: VAULT PIN ROUTES ===
   ========================================================================== */
router.get("/vault/pin-status", verifyTokenGuard, checkVaultPinStatus);
router.post("/vault/pin-setup", verifyTokenGuard, strictAuthLimiter, setupVaultPin);
router.post("/vault/pin-verify", verifyTokenGuard, pinAttemptLimiter, verifyVaultPin);
router.post("/vault/pin-disable", verifyTokenGuard, pinAttemptLimiter, disableVaultPin);
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 5 END === */