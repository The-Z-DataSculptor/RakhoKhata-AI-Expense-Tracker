// Backend/src/routes/aiRoutes.ts

import { Router } from "express";
import { 
  askAI, 
  getAiCompanionGreeting, 
  executeAiCompanionAnalysis 
} from "../controllers/aiController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import { aiApiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

// Existing open-ended AI assistant query
router.post("/ask", verifyTokenGuard, aiApiLimiter, askAI);

// 🚀 NEW: Get daily companion personalized greeting on load
router.post("/greeting", verifyTokenGuard, getAiCompanionGreeting);

// 🚀 NEW: Run daily analysis (Today, Week, Month) and lock button
router.post("/execute-analysis", verifyTokenGuard, executeAiCompanionAnalysis);

export default router;