// Backend/src/routes/userRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  verifyTokenGuard,
  ensureOnboardingCompleted,
} from "../middleware/authMiddleware";
import { writeActionsLimiter } from "../middleware/rateLimitMiddleware";
import { uploadAvatar } from "../controllers/userController";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UPLOAD CONFIGURATION ===
   ========================================================================== */

// Whitelist of strictly permitted avatar image MIME types
const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Map of validated MIME types to safe file extensions to prevent extension spoofing
const MIME_TO_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Absolute path to the avatar uploads directory inside public/
const avatarUploadDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "avatars"
);

// WHY THIS FIX WAS MADE: Wraps directory creation in a try-catch block to prevent uncaught boot exceptions.
try {
  if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
  }
} catch (error) {
  console.error("[User Routes] Failed to initialize avatar upload directory:", error);
}

// Disk storage engine configuration with secure filename generation
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, avatarUploadDir);
  },
  filename: (_req, file, callback) => {
    // WHY THIS FIX WAS MADE: Generates a unique filename and assigns extensions strictly based on
    // validated MIME type rather than trusting user-controlled file.originalname.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeExtension = MIME_TO_EXTENSION_MAP[file.mimetype.toLowerCase()] || ".jpg";
    callback(null, `avatar-${uniqueSuffix}${safeExtension}`);
  },
});

// WHY THIS FIX WAS MADE: Configured a strict fileFilter to reject non-image payloads before writing to disk.
const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3 MB maximum file size limit
  },
  fileFilter: (_req, file, callback) => {
    const normalizedMime = file.mimetype.toLowerCase();
    if (ALLOWED_AVATAR_MIME_TYPES.includes(normalizedMime)) {
      callback(null, true);
    } else {
      callback(
        new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF images are permitted.")
      );
    }
  },
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: USER ROUTES ===
   ========================================================================== */
const router = Router();

/**
 * POST /api/user/upload-avatar
 * Uploads and updates a user's profile avatar image.
 * 
 * WHY THIS FIX WAS MADE: Protected with `ensureOnboardingCompleted` to enforce profile initialization,
 * and `writeActionsLimiter` to shield server disk storage from automated upload spam attacks.
 */
router.post(
  "/upload-avatar",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  avatarUpload.single("avatar"),
  uploadAvatar
);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 4 END === */