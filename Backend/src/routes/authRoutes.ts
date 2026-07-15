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
  updateProfile,    // NEW
  changePassword    // NEW
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

// NEW: Profile update and password change
router.put("/update-profile", verifyTokenGuard, updateProfile);
router.post("/change-password", verifyTokenGuard, changePassword);

/* ==========================================================================
   === SECTION 4: VAULT PIN SECURITY SUB-ROUTES ===
   ========================================================================== */
router.get("/vault/pin-status", verifyTokenGuard, checkVaultPinStatus);
router.post("/vault/pin-setup", verifyTokenGuard, strictAuthLimiter, setupVaultPin);
router.post("/vault/pin-verify", verifyTokenGuard, pinAttemptLimiter, verifyVaultPin);
router.post("/vault/pin-disable", verifyTokenGuard, pinAttemptLimiter, disableVaultPin);
/* === SECTION 4 END === */

export default router;