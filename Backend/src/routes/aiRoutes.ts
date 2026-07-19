// Backend/src/routes/aiRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import {
  askAI,
  getAiCompanionGreeting,
  executeAiCompanionAnalysis,
} from "../controllers/aiController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import { aiApiLimiter } from "../middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTE CONFIGURATIONS ===
   ========================================================================== */
const router = Router();

// Route: General AI assistant query (rate limited for AI calls)
router.post("/ask", verifyTokenGuard, aiApiLimiter, askAI);

// Route: Fetch daily companion greeting on dashboard load
router.post("/greeting", verifyTokenGuard, getAiCompanionGreeting);

// Route: Run scoped financial analysis (Today, Week, Month) and lock button
router.post("/execute-analysis", verifyTokenGuard, executeAiCompanionAnalysis);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */