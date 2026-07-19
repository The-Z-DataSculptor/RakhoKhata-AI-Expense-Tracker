// Backend/src/routes/transactionRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
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
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MIDDLEWARE CONFIGURATION ===
   ========================================================================== */
const router = Router();

// Memory‑only storage for receipt images – no files are written to disk
const memoryUploadEngine = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum upload size
  },
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: TRANSACTION ROUTES ===
   ========================================================================== */

// Fetch all transactions for a workspace (workspaceId query parameter required)
router.get("/", verifyTokenGuard, getWorkspaceTransactions);

// Create a single new transaction
router.post("/", verifyTokenGuard, createTransaction);

// Bulk import multiple transactions
router.post("/bulk", verifyTokenGuard, bulkCreateTransactions);

// Scan a receipt image using AI (accepts multipart form with field "receipt")
router.post(
  "/scan",
  verifyTokenGuard,
  memoryUploadEngine.single("receipt"),
  scanReceipt
);

// Delete a transaction by its ID
router.delete("/:id", verifyTokenGuard, deleteTransaction);

// Export transactions as Excel
router.get("/export/excel", verifyTokenGuard, exportTransactionsExcel);

// Export transactions as PDF
router.get("/export/pdf", verifyTokenGuard, exportTransactionsPdf);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 4 END === */