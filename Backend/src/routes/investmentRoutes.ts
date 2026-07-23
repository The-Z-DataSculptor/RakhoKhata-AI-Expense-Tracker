// Backend/src/routes/investmentRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import {
  createInvestmentAsset,
  getWorkspaceInvestments,
  updateInvestmentAsset,
  deleteInvestmentAsset,
} from "../controllers/investmentController";
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
   === SECTION 2: INVESTMENT VAULT ROUTES ===
   ========================================================================== */
const router = Router();

/**
 * GET /api/investments
 * Fetches all investment assets for a workspace (workspaceId query parameter required).
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent read-query DoS attacks,
 * and `ensureOnboardingCompleted` to enforce mandatory profile configuration.
 */
router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getWorkspaceInvestments
);

/**
 * POST /api/investments
 * Logs a new investment asset position in the user's workspace vault.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to block automated bot scripts
 * from flooding the database with fake investment entries.
 */
router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createInvestmentAsset
);

/**
 * PUT /api/investments/:id
 * Updates an existing investment asset entry by ID.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to prevent database table lock
 * contention caused by rapid mutation requests.
 */
router.put(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  updateInvestmentAsset
);

/**
 * DELETE /api/investments/:id
 * Permanently removes an investment asset entry from the vault.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to prevent malicious bulk-deletion
 * loops from wiping portfolio history.
 */
router.delete(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  deleteInvestmentAsset
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */