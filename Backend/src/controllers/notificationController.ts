// Backend/src/controllers/notificationController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

// Safe error response to avoid leaking internal state
function buildSafeError(message: string): { error: string } {
  return { error: message };
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

// ---------------------------------------------------------------------------
// GET USER NOTIFICATIONS
// ---------------------------------------------------------------------------
export const getUserNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized."));
      return;
    }

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

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
    });

    res.status(200).json({ notifications });
  } catch (error: unknown) {
    console.error(
      "[Notification Controller] Error fetching notifications:",
      error
    );
    res
      .status(500)
      .json(buildSafeError("Failed to fetch notifications."));
  }
};

// ---------------------------------------------------------------------------
// MARK SINGLE NOTIFICATION AS READ
// ---------------------------------------------------------------------------
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const notificationId = String(req.params.id);

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized."));
      return;
    }

    // Verify ownership of the notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (
      !notification ||
      notification.userId !== userId
    ) {
      res
        .status(404)
        .json(
          buildSafeError(
            "Notification not found or access denied."
          )
        );
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res
      .status(200)
      .json({
        message: "Notification marked as read.",
        notification: updated,
      });
  } catch (error: unknown) {
    console.error(
      "[Notification Controller] Error marking notification as read:",
      error
    );
    res
      .status(500)
      .json(
        buildSafeError(
          "Failed to update notification status."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// MARK ALL NOTIFICATIONS AS READ
// ---------------------------------------------------------------------------
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized."));
      return;
    }

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

    res
      .status(200)
      .json({
        message: "All notifications marked as read.",
        count: updated.count,
      });
  } catch (error: unknown) {
    console.error(
      "[Notification Controller] Error marking all as read:",
      error
    );
    res
      .status(500)
      .json(
        buildSafeError(
          "Failed to update notifications."
        )
      );
  }
};
/* === SECTION 3 END === */