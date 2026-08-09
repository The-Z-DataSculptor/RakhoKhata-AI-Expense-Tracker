// Backend/src/routes/transactionRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Router } from "express";
import multer from "multer";
import {
  createTransaction,
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

// WHY THIS FIX WAS MADE: Added fileFilter to reject non-supported files at the multipart boundary before buffering memory.
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
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent database query starvation
 * and `ensureOnboardingCompleted` to enforce profile initialization.
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
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to block automated script
 * spam from flooding database tables.
 */
router.post(
  "/",
  verifyTokenGuard,
  ensureOnboardingCompleted,
  writeActionsLimiter,
  createTransaction
);

/**
 * POST /api/transactions/bulk
 * Imports multiple transactions in a single batch.
 * 
 * WHY THIS FIX WAS MADE: Rate limited using `writeActionsLimiter` to prevent database
 * lock contention during heavy batch writes.
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
 * 
 * WHY THIS FIX WAS MADE: Protected with `aiApiLimiter` BEFORE parsing multipart files to shield server RAM
 * and Gemini API key quotas from abuse.
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
 * 
 * WHY THIS FIX WAS MADE: Protected with `writeActionsLimiter` to safeguard against bulk deletion spam.
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
 * 
 * WHY THIS FIX WAS MADE: Rate limited using `globalApiLimiter` to prevent CPU-intensive spreadsheet
 * generation from overloading server memory.
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
 * 
 * WHY THIS FIX WAS MADE: Protected with `globalApiLimiter` to prevent PDF render streaming
 * from blocking Node.js event loops.
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
