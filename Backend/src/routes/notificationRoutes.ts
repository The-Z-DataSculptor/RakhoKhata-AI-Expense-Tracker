// Backend/src/routes/notificationRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";
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
   === SECTION 2: NOTIFICATION ROUTES ===
   ========================================================================== */
const router = Router();

/**
 * GET /api/notifications
 * Fetches unread and recent read notifications for the authenticated user.
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent frontend UI polling
 * loops from exhausting database connection pools, and `ensureOnboardingCompleted` to enforce account setup.
 */
router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getUserNotifications
);

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the user as read.
 * 
 * WHY THIS FIX WAS MADE: Rate limited with `writeActionsLimiter` to prevent automated scripts
 * from spamming bulk database update transactions.
 */
router.patch(
  "/read-all",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  markAllAsRead
);

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read by ID.
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to mitigate rapid mutation
 * spam and lock contention on target database rows.
 */
router.patch(
  "/:id/read",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  markAsRead
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */