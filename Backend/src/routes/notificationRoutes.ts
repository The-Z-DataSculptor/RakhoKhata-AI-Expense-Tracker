// Backend/src/routes/notificationRoutes.ts
import { Router } from "express";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead 
} from "../controllers/notificationController";

const router = Router();

// Protect all notification routes with auth middleware
router.get("/", verifyTokenGuard, getUserNotifications);
router.patch("/read-all", verifyTokenGuard, markAllAsRead);
router.patch("/:id/read", verifyTokenGuard, markAsRead);

export default router;