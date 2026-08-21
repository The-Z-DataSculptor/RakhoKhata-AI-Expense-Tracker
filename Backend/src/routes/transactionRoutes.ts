// Backend/src/routes/transactionRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import multer from "multer";
import {
  createTransaction,
  updateTransaction,
  bulkCreateTransactions,
  scanReceipt,
  getWorkspaceTransactions,
  deleteTransaction,
  getTrashedTransactions,
  restoreTransaction,
  permanentDeleteTransaction,
  emptyWorkspaceTrash,
} from "../controllers/transactionController";
import {
  exportTransactionsExcel,
  exportTransactionsPdf,
} from "../controllers/exportController";
import {
  verifyTokenGuard,
  ensureOnboardingCompleted,
} from "../middleware/authMiddleware";
import {
  globalApiLimiter,
  writeActionsLimiter,
  aiApiLimiter,
} from "../middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MIDDLEWARE & MULTER CONFIGURATION ===
   ========================================================================== */
const router = Router();

const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

const memoryUploadEngine = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_RECEIPT_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      callback(null, true);
    } else {
      callback(
        new Error("Invalid file type. Only JPEG, PNG, WEBP, HEIC, and PDF files are allowed.")
      );
    }
  },
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RECYCLE BIN & TRASH ROUTES ===
   ========================================================================== */

router.get(
  "/trash",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getTrashedTransactions
);

router.delete(
  "/trash/empty",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  emptyWorkspaceTrash
);

router.post(
  "/:id/restore",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  restoreTransaction
);

router.delete(
  "/:id/permanent",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  permanentDeleteTransaction
);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: CORE TRANSACTION ROUTES ===
   ========================================================================== */

router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getWorkspaceTransactions
);

router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createTransaction
);

router.put(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  updateTransaction
);

router.post(
  "/bulk",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  bulkCreateTransactions
);

router.post(
  "/scan",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  aiApiLimiter,
  memoryUploadEngine.single("receipt"),
  scanReceipt
);

router.delete(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  deleteTransaction
);

router.get(
  "/export/excel",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  exportTransactionsExcel
);

router.get(
  "/export/pdf",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  exportTransactionsPdf
);
/* === SECTION 4 END === */

export default router;