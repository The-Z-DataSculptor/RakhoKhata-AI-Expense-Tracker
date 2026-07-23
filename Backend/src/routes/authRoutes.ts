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
} from "../controllers/vaultAuthController";
import {
  verifyTokenGuard,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";
import {
  strictAuthLimiter,
  globalApiLimiter,
  writeActionsLimiter,
} from "../middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SECURITY RATE LIMITERS ===
   ========================================================================== */

/**
 * WHY THIS FIX WAS MADE: Uses the authenticated user ID (req.user.userId) as the rate limit key.
 * This prevents users sharing a public IP (e.g., corporate Wi-Fi or VPN) from locking each other out.
 */
const pinAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes cooldown window
  max: 10, // Maximum 10 failed PIN attempts per user
  statusCode: 429,
  skip: () => process.env.DISABLE_RATE_LIMIT === "true",
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.userId) {
      return `pin_user_${authReq.user.userId}`;
    }
    if (authReq.user?.id) {
      return `pin_user_${authReq.user.id}`;
    }
    return `pin_ip_${req.ip || "127.0.0.1"}`;
  },
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

// WHY THIS FIX WAS MADE: Attached verifyTokenGuard so logout events retain authenticated session context.
router.post("/logout", verifyTokenGuard, logoutUser);
router.get("/me", verifyTokenGuard, getMe);

// Profile & credential management
// WHY THIS FIX WAS MADE: Applied writeActionsLimiter to profile updates to prevent payload flood spam.
router.put("/update-profile", verifyTokenGuard, writeActionsLimiter, updateProfile);

// WHY THIS FIX WAS MADE: Protected password changes with strictAuthLimiter to block password brute-forcing.
router.post("/change-password", verifyTokenGuard, strictAuthLimiter, changePassword);

// WHY THIS FIX WAS MADE: Protected onboarding updates with writeActionsLimiter.
router.put("/complete-onboarding", verifyTokenGuard, writeActionsLimiter, completeOnboarding);

// Password reset flow (public routes)
router.post("/forgot-password", strictAuthLimiter, requestPasswordReset);
router.post("/reset-password", strictAuthLimiter, resetForgottenPassword);

// Email verification (public route)
router.post("/verify-email", strictAuthLimiter, verifyEmail);

// Google OAuth 2.0 endpoints
// WHY THIS FIX WAS MADE: Protected OAuth initiation and callback endpoints with globalApiLimiter.
router.get("/google", globalApiLimiter, redirectToGoogle);
router.get("/google/callback", globalApiLimiter, handleGoogleCallback);

// Exchange rates proxy
// WHY THIS FIX WAS MADE: Protected public proxy with globalApiLimiter to shield external API key quotas.
router.get("/exchange-rates", globalApiLimiter, getExchangeRates);
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
   === SECTION 5: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 5 END === */