// Backend/src/routes/userRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { verifyTokenGuard } from "../middleware/authMiddleware";
import { uploadAvatar } from "../controllers/userController";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UPLOAD CONFIGURATION ===
   ========================================================================== */

// Absolute path to the avatar uploads directory (inside public/)
const avatarUploadDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "avatars"
);

// Create the directory if it does not exist
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

// Disk storage engine: writes files to the local file system
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${extension}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max file size
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: USER ROUTES ===
   ========================================================================== */
const router = Router();

// Upload a new avatar image (protected route)
router.post(
  "/upload-avatar",
  verifyTokenGuard,
  avatarUpload.single("avatar"),
  uploadAvatar
);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 4 END === */