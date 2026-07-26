// Backend/src/controllers/userController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Strict whitelist of permitted avatar image MIME types for defense-in-depth security
const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum allowed file size for user avatar uploads (5 MB in bytes)
const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Request interface extended with optional Multer file object
interface AuthenticatedFileRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & TYPES ===
   ========================================================================== */

/**
 * Standardized JSON error response builder
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * Prevents HTTP path traversal and URL injection attacks.
 * Sanitizes raw filenames to ensure only safe alphanumeric characters and extensions are preserved.
 */
function sanitizeFilename(filename: string): string {
  // Strip path traversal characters (e.g., "../" or "\") and sanitize filename
  const baseName = filename.replace(/^.*[\\/]/, "");
  return encodeURIComponent(baseName);
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * POST /api/users/upload-avatar
 * Uploads a profile avatar image, validates security parameters, and updates user database profile.
 */
export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    // Retrieve file object from request
    const fileRequest = req as AuthenticatedFileRequest;
    const uploadedFile = fileRequest.file;

    if (!uploadedFile || !uploadedFile.filename) {
      res.status(400).json(buildErrorResponse("No valid image file detected in request."));
      return;
    }

    // Enforces MIME type check as a defense-in-depth shield against malicious uploads.
    const fileMimeType = uploadedFile.mimetype ? uploadedFile.mimetype.toLowerCase() : "";
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(fileMimeType)) {
      res.status(400).json(
        buildErrorResponse("Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.")
      );
      return;
    }

    // Validates file size secondary limit to block storage exhaustion attacks.
    if (uploadedFile.size && uploadedFile.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      res.status(400).json(
        buildErrorResponse("File size exceeds maximum threshold of 5 MB.")
      );
      return;
    }

    // Verifies user existence before DB update to prevent Prisma P2025 server crashes.
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatarUrl: true },
    });

    if (!userExists) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    // Construct secure public avatar URL (using environment variables)
    const rawServerUrl = process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || "http://localhost:5000";
    const serverUrl = rawServerUrl.replace(/\/+$/, "");
    const safeFilename = sanitizeFilename(uploadedFile.filename);
    const avatarUrl = `${serverUrl}/uploads/avatars/${safeFilename}`;

    // Update user profile record in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "Profile image updated successfully.",
      avatarUrl: updatedUser.avatarUrl,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Avatar Upload Controller Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error while saving avatar."));
  }
};
/* === SECTION 3 END === */