// src/routes/budgetRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { createBudget, getWorkspaceBudgets, updateBudget, deleteBudget } from "../controllers/budgetController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTING HIGHWAY DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Secure Highway: Read all active budget parameters mapped to a specific workspace ID query
router.get("/", verifyTokenGuard, getWorkspaceBudgets);

// Secure Highway: Inject a new category spending ceiling rule into Neon Cloud
router.post("/", verifyTokenGuard, createBudget);

// Secure Highway: Update an existing budget rule
router.put("/:id", verifyTokenGuard, updateBudget);

// Secure Highway: Delete an existing budget alert rule card cleanly via dynamic path URL params
router.delete("/:id", verifyTokenGuard, deleteBudget);

export default router;