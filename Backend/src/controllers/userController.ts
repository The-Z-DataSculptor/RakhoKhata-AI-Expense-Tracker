// Backend/src/controllers/userController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Simple shape for the uploaded file object (Multer)
interface UploadedFile {
  filename: string;
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
}

// Extend the authenticated request to carry the uploaded file
interface AuthenticatedFileRequest extends AuthenticatedRequest {
  file?: UploadedFile;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Returns a safe error object that never leaks internal details.
 */
function safeError(message: string): { error: string } {
  return { error: message };
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * POST /api/user/avatar
 * Uploads a user avatar image, saves its public URL to the database.
 */
export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    // Safely retrieve the uploaded file from the request
    const fileRequest = req as AuthenticatedFileRequest;
    const uploadedFile = fileRequest.file;

    if (!uploadedFile) {
      res.status(400).json(safeError("No image file detected in the request."));
      return;
    }

    // Build the public URL to the uploaded file
    const serverUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const avatarUrl = `${serverUrl}/uploads/avatars/${uploadedFile.filename}`;

    // Update the user's avatar URL in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    res.status(200).json({
      message: "Profile image updated successfully.",
      avatarUrl: updatedUser.avatarUrl,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Avatar Upload Controller Error:", error);
    res.status(500).json(safeError("Internal server error while saving avatar."));
  }
};
/* === SECTION 3 END === */