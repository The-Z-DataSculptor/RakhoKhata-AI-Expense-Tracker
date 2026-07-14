// Backend/src/routes/aiRoutes.ts
import { Router } from "express";
import { askAI } from "../controllers/aiController";
import { verifyTokenGuard } from "../middleware/authMiddleware";

const router = Router();

// Protected route – only authenticated users can ask the AI
router.post("/ask", verifyTokenGuard, askAI);

export default router;