// Backend/src/routes/budgetRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import {
  createBudget,
  getWorkspaceBudgets,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: BUDGET ROUTES ===
   ========================================================================== */
const router = Router();

// Fetch all budgets for a workspace (workspaceId query parameter required)
router.get("/", verifyTokenGuard, getWorkspaceBudgets);

// Create a new budget rule
router.post("/", verifyTokenGuard, createBudget);

// Update an existing budget
router.put("/:id", verifyTokenGuard, updateBudget);

// Delete a budget
router.delete("/:id", verifyTokenGuard, deleteBudget);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */