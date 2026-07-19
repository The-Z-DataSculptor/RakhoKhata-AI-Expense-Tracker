// Backend/src/routes/notificationRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: NOTIFICATION ROUTES ===
   ========================================================================== */
const router = Router();

// Fetch all notifications for the authenticated user
router.get("/", verifyTokenGuard, getUserNotifications);

// Mark all unread notifications as read
router.patch("/read-all", verifyTokenGuard, markAllAsRead);

// Mark a single notification as read
router.patch("/:id/read", verifyTokenGuard, markAsRead);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */