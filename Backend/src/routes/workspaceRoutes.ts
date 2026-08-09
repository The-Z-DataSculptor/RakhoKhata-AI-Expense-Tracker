// Backend/src/routes/workspaceRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import {
  getUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspaceController";
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
   === SECTION 2: WORKSPACE ROUTES ===
   ========================================================================== */
const router = Router();

/**
 * GET /api/workspaces
 * Fetches all workspaces owned by the authenticated user (auto-initializes defaults if empty).
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent database query starvation
 * during dashboard initialization, and `ensureOnboardingCompleted` to enforce profile setup requirements.
 */
router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getUserWorkspaces
);

/**
 * POST /api/workspaces
 * Creates a new custom workspace for the user and seeds default category templates.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to block automated script spam
 * from executing resource-heavy category seeding queries in parallel.
 */
router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createWorkspace
);

/**
 * PUT /api/workspaces/:id
 * Updates workspace metadata (name or currency).
 * 
 * WHY THIS FIX WAS MADE: Rate limited using `writeActionsLimiter` to prevent database row lock
 * contention caused by rapid mutation calls.
 */
router.put(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  updateWorkspace
);

/**
 * DELETE /api/workspaces/:id
 * Permanently deletes a workspace and cascades deletion across linked records.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to safeguard against malicious
 * bulk-deletion loops from wiping workspace histories.
 */
router.delete(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  deleteWorkspace
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */
