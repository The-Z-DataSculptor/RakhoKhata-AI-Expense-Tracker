// Backend/src/controllers/notificationController.ts
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../db"; // 👈 FIXED: Reuses your global preconfigured database client

/**
 * GET /api/notifications
 * Fetches all unread notifications, plus recently read ones (up to 30 days old).
 */
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        OR: [
          { isRead: false },
          { 
            isRead: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        ]
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("[Notification Controller] Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read.
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // Explicitly cast 'id' as a string to satisfy Prisma's strict type checker
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    // Validate ownership before updating
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      res.status(404).json({ error: "Notification not found or access denied." });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({ message: "Notification marked as read.", notification: updated });
  } catch (error) {
    console.error("[Notification Controller] Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification status." });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications as read for the logged-in user.
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized." });
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

    res.status(200).json({ 
      message: "All notifications marked as read.", 
      count: updated.count 
    });
  } catch (error) {
    console.error("[Notification Controller] Error marking all as read:", error);
    res.status(500).json({ error: "Failed to update notifications." });
  }
};