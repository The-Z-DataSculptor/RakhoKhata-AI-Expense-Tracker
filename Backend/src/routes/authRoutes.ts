// Backend/src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import rateLimit from "express-rate-limit";
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
  requestVaultPinReset,
  resetVaultPinWithToken,
} from "../controllers/vaultAuthController";
import {
  verifyTokenGuard,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";
import {
  strictAuthLimiter,
  globalApiLimiter,
  writeActionsLimiter,
  getUserOrIpKey,
} from "../middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SECURITY RATE LIMITERS ===
   ========================================================================== */
const pinAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  statusCode: 429,
  skip: () => process.env.DISABLE_RATE_LIMIT === "true",
  keyGenerator: (req) => `pin_${getUserOrIpKey(req)}`,
  validate: { keyGeneratorIpFallback: false },
  message: {
    error: "Excessive PIN entry attempts detected. Vault securely locked for 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: AUTHENTICATION & PROFILE ROUTES ===
   ========================================================================== */
const router = Router();

// Local authentication endpoints
router.post("/signup", strictAuthLimiter, registerUser);
router.post("/login", strictAuthLimiter, loginUser);

router.post("/logout", verifyTokenGuard, logoutUser);
router.get("/me", verifyTokenGuard, getMe);

// Profile & credential management
router.put("/update-profile", verifyTokenGuard, writeActionsLimiter, updateProfile);
router.post("/change-password", verifyTokenGuard, strictAuthLimiter, changePassword);

// Complete onboarding (supports both PUT and POST)
router.put("/complete-onboarding", verifyTokenGuard, writeActionsLimiter, completeOnboarding);
router.post("/complete-onboarding", verifyTokenGuard, writeActionsLimiter, completeOnboarding);

// Password reset flow (supports both /forgot-password and /request-password-reset)
router.post("/forgot-password", strictAuthLimiter, requestPasswordReset);
router.post("/request-password-reset", strictAuthLimiter, requestPasswordReset);
router.post("/reset-password", strictAuthLimiter, resetForgottenPassword);

// Email verification (public route)
router.post("/verify-email", strictAuthLimiter, verifyEmail);

// Google OAuth 2.0 endpoints
router.get("/google", globalApiLimiter, redirectToGoogle);
router.get("/google/callback", globalApiLimiter, handleGoogleCallback);

// Exchange rates proxy
router.get("/exchange-rates", globalApiLimiter, getExchangeRates);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: VAULT PIN ROUTES ===
   ========================================================================== */
router.get("/vault/pin-status", verifyTokenGuard, checkVaultPinStatus);
router.post("/vault/pin-setup", verifyTokenGuard, strictAuthLimiter, setupVaultPin);
router.post("/vault/pin-verify", verifyTokenGuard, pinAttemptLimiter, verifyVaultPin);
router.post("/vault/pin-disable", verifyTokenGuard, pinAttemptLimiter, disableVaultPin);

// Registered missing PIN reset endpoints to handle reset link requests
router.post("/vault/pin-request-reset", verifyTokenGuard, strictAuthLimiter, requestVaultPinReset);
router.post("/vault/pin-reset-confirm", strictAuthLimiter, resetVaultPinWithToken);
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 5 END === */