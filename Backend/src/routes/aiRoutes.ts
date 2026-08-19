// Backend/src/routes/aiRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import {
  askAI,
  getAiCompanionGreeting,
  executeAiCompanionAnalysis,
} from "../controllers/aiController";
import {
  verifyTokenGuard,
  ensureOnboardingCompleted,
} from "../middleware/authMiddleware";
import { aiApiLimiter } from "../middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTE CONFIGURATIONS ===
   ========================================================================== */
const router = Router();

// Apply auth first so req.user is guaranteed to be set before the rate limiter evaluates the user key
router.use(verifyTokenGuard);
router.use(ensureOnboardingCompleted);
router.use(aiApiLimiter);

// Route: Interactive Chat / Power Queries
router.post("/ask", askAI);

// Route: Daily Personalized Greeting (Dashboard + AI Insights Hub)
router.post("/greeting", getAiCompanionGreeting);

// Route: Timeline Scoped Ledger Audits (Today / Week / Month)
router.post("/execute-analysis", executeAiCompanionAnalysis);

/* === SECTION 2 END === */

export default router;