// Backend/src/controllers/notificationController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & TYPES ===
   ========================================================================== */

// Safety cap for maximum fetched notifications to prevent server memory bloat
const MAX_NOTIFICATIONS_LIMIT = 100;

/**
 * Standardized JSON error response builder
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * WHY THIS IS NEEDED: Prevents HTTP parameter array injection attacks.
 * Safely extracts a single string parameter from query or route inputs.
 */
function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * GET /api/notifications
 * Fetches unread notifications and recent read notifications (last 30 days) for the logged-in user.
 */
export const getUserNotifications = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    // Calculate cutoff date for read notifications (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // WHY THIS FIX WAS MADE: Enforces MAX_NOTIFICATIONS_LIMIT take limit to prevent OOM server crashes.
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        OR: [
          { isRead: false },
          {
            isRead: true,
            createdAt: { gte: thirtyDaysAgo },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: MAX_NOTIFICATIONS_LIMIT,
    });

    res.status(200).json({ notifications });
  } catch (error: unknown) {
    console.error("[Notification Controller] Error fetching notifications:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch notifications."));
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read after verifying user ownership atomically.
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const notificationId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!notificationId) {
      res.status(400).json(buildErrorResponse("Notification ID parameter is required."));
      return;
    }

    // WHY THIS FIX WAS MADE: Atomically checks ownership and updates in a single DB query using updateMany to eliminate TOCTOU race conditions and reduce latency.
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId, // BOLA Protection: Enforces strict user ownership
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      res.status(404).json(buildErrorResponse("Notification not found or access denied."));
      return;
    }

    // Fetch the updated record to return to caller
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    res.status(200).json({
      message: "Notification marked as read.",
      notification: updatedNotification,
    });
  } catch (error: unknown) {
    console.error("[Notification Controller] Error marking notification as read:", error);
    res.status(500).json(buildErrorResponse("Failed to update notification status."));
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the logged-in user as read.
 */
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    // WHY THIS FIX WAS MADE: Filters by userId and isRead: false to only touch unread items owned by the current user.
    const updated = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      message: "All notifications marked as read.",
      count: updated.count,
    });
  } catch (error: unknown) {
    console.error("[Notification Controller] Error marking all as read:", error);
    res.status(500).json(buildErrorResponse("Failed to update notifications."));
  }
};
/* === SECTION 3 END === */