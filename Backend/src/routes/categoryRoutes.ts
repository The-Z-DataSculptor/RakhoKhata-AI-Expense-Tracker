// Backend/src/routes/categoryRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import {
  getWorkspaceCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
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
   === SECTION 2: CATEGORY ROUTES ===
   ========================================================================== */
const router = Router();

/**
 * GET /api/categories
 * Fetches all categories for a specified workspace (workspaceId query parameter required).
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent database query
 * starvation attacks, and `ensureOnboardingCompleted` to enforce profile initialization.
 */
router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getWorkspaceCategories
);

/**
 * POST /api/categories
 * Creates a new custom category within a workspace.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to block automated script
 * spam from flooding database tables with excess category entities.
 */
router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createCategory
);

/**
 * PUT /api/categories/:id
 * Updates an existing custom category by ID.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to prevent rapid mutation
 * spam and database table lock contention.
 */
router.put(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  updateCategory
);

/**
 * DELETE /api/categories/:id
 * Deletes a custom category and safely reassigns linked transactions to "Unassigned".
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to prevent repeated API calls
 * from triggering heavy database transactions in parallel.
 */
router.delete(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  deleteCategory
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */