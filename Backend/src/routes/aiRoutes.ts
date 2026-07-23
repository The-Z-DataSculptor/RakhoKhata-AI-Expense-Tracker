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

/**
 * WHY THIS IS NEEDED: All AI endpoints invoke expensive external LLM API calls (Gemini)
 * and rely on user preferences (aiPersona, financialGoal). 
 * Applying `verifyTokenGuard`, `ensureOnboardingCompleted`, and `aiApiLimiter` across 
 * ALL routes guarantees identity verification, context readiness, and API quota protection.
 */

// Route: General AI assistant conversational query
router.post(
  "/ask",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  aiApiLimiter,
  askAI
);

// Route: Fetch daily personalized companion greeting on dashboard load
// WHY THIS FIX WAS MADE: Protected with aiApiLimiter to prevent dashboard refresh spam from exhausting API quotas.
router.post(
  "/greeting",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  aiApiLimiter,
  getAiCompanionGreeting
);

// Route: Run scoped financial analysis (Today, Week, Month)
// WHY THIS FIX WAS MADE: Protected with aiApiLimiter to shield high-token LLM analysis from rate-limit abuse.
router.post(
  "/execute-analysis",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  aiApiLimiter,
  executeAiCompanionAnalysis
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */