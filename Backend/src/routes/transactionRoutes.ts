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

// Allowed MIME types for AI receipt scanning
const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

// Rejects non-supported files at the multipart boundary before buffering into memory
const memoryUploadEngine = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum upload size
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
   === SECTION 3: TRANSACTION & EXPORT ROUTES ===
   ========================================================================== */

/**
 * GET /api/transactions
 * Fetches transactions for a workspace (workspaceId query parameter required).
 */
router.get(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  getWorkspaceTransactions
);

/**
 * POST /api/transactions
 * Creates a single transaction entry.
 */
router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createTransaction
);

/**
 * PUT /api/transactions/:id
 * Updates an existing transaction record (or mass re-assigns category).
 */
router.put(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  updateTransaction
);

/**
 * POST /api/transactions/bulk
 * Imports multiple transactions in a single batch.
 */
router.post(
  "/bulk",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  bulkCreateTransactions
);

/**
 * POST /api/transactions/scan
 * Scans a receipt document/image using Gemini AI vision models.
 * Protected by shared aiApiLimiter.
 */
router.post(
  "/scan",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  aiApiLimiter,
  memoryUploadEngine.single("receipt"),
  scanReceipt
);

/**
 * DELETE /api/transactions/:id
 * Removes a transaction by ID.
 */
router.delete(
  "/:id",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  deleteTransaction
);

/**
 * GET /api/transactions/export/excel
 * Generates and streams an Excel spreadsheet statement.
 */
router.get(
  "/export/excel",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  exportTransactionsExcel
);

/**
 * GET /api/transactions/export/pdf
 * Generates and streams a PDF report document.
 */
router.get(
  "/export/pdf",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  globalApiLimiter,
  exportTransactionsPdf
);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTS ===
   ========================================================================== */
export default router;
/* === SECTION 4 END === */