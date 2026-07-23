// Backend/src/routes/budgetRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import {
  createBudget,
  getWorkspaceBudgets,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetController";
import {
  verifyTokenGuard,
  ensureOnboardingCompleted,
} from "../middleware/authMiddleware";
import {
  globalApiLimiter,
  writeActionsLimiter,
} from "../middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: BUDGET ROUTES ===
   ========================================================================== */
const router = Router();

/**
 * GET /api/budgets
 * Fetches all budget rules for a workspace (requires workspaceId query parameter).
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent database query
 * starvation attacks, and `ensureOnboardingCompleted` to enforce account setup prerequisites.
 */
router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getWorkspaceBudgets
);

/**
 * POST /api/budgets
 * Creates a new budget limit rule for a category inside a workspace.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to block automated script
 * spam from flooding database tables with duplicate budget records.
 */
router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createBudget
);

/**
 * PUT /api/budgets/:id
 * Updates target amount or configuration for an existing budget rule.
 * 
 * WHY THIS FIX WAS MADE: Rate limited using `writeActionsLimiter` to prevent race conditions
 * and rapid mutation lock contention on database rows.
 */
router.put(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  updateBudget
);

/**
 * DELETE /api/budgets/:id
 * Deletes a budget rule record from the target workspace.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to safeguard against bulk-deletion
 * attacks or repeated API deletion triggers.
 */
router.delete(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  deleteBudget
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */