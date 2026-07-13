// src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getMe, logoutUser } from "../controllers/authController";
import { checkVaultPinStatus, setupVaultPin, verifyVaultPin, disableVaultPin } from "../controllers/vaultAuthController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SPECIFIC SECURITY RATE LIMITERS ===
   ========================================================================== */
const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 7,
  message: {
    error: "Too many login or registration attempts. Brute-force security lock active. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const pinAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

/* ==========================================================================
   === SECTION 4: VAULT PIN SECURITY SUB-ROUTES ===
   ========================================================================== */
router.get("/vault/pin-status", verifyTokenGuard, checkVaultPinStatus);
router.post("/vault/pin-setup", verifyTokenGuard, strictAuthLimiter, setupVaultPin);
router.post("/vault/pin-verify", verifyTokenGuard, pinAttemptLimiter, verifyVaultPin);
router.post("/vault/pin-disable", verifyTokenGuard, pinAttemptLimiter, disableVaultPin);
/* === SECTION 4 END === */

export default router;