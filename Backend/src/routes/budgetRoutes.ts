// src/routes/budgetRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { createBudget, getWorkspaceBudgets, deleteBudget } from "../controllers/budgetController";
import { verifyTokenGuard } from "../middleware/authMiddleware"; // Global security perimeter guard check
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTING HIGHWAY DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Secure Highway: Read all active budget parameters mapped to a specific workspace ID query
router.get("/", verifyTokenGuard, getWorkspaceBudgets);

// Secure Highway: Inject a new category spending ceiling rule into Neon Cloud
router.post("/", verifyTokenGuard, createBudget);

// Secure Highway: Delete an existing budget alert rule card cleanly via dynamic path URL params
router.delete("/:id", verifyTokenGuard, deleteBudget);
/* === SECTION 2 END === */

export default router;