// src/routes/transactionRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import multer from "multer"; // 🚀 REQUIRED: Handles binary multi-part file payloads
import { 
  createTransaction, 
  bulkCreateTransactions, 
  scanReceipt, // 🚀 REQUIRED: Links the Gemini extraction logic
  getWorkspaceTransactions, 
  deleteTransaction 
} from "../controllers/transactionController";
import { exportTransactionsExcel, exportTransactionsPdf } from "../controllers/exportController";
import { verifyTokenGuard } from "../middleware/authMiddleware"; 
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MIDDLEWARE ALLOCATION ===
   ========================================================================== */
const router = Router();

// Set up memory buffer storage for raw image streams (keeps disk storage clean)
const memoryUploadEngine = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size roof ceiling protection check
  }
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: ROUTING HIGHWAY DEFINITIONS ===
   ========================================================================== */
// Secure Highway: Fetch transactions matching an active workspace parameter
router.get("/", verifyTokenGuard, getWorkspaceTransactions);

// Secure Highway: Insert a new income or expense log row into the database
router.post("/", verifyTokenGuard, createTransaction);

// DATA BRIDGE: Mounts sheet transaction import bulk tracking maps
router.post("/bulk", verifyTokenGuard, bulkCreateTransactions);

// 🚀 404 FIX: Mount the multipart scanning endpoint to handle raw receipt file processing
router.post(
  "/scan", 
  verifyTokenGuard, 
  memoryUploadEngine.single("receipt"), 
  scanReceipt
);

// Secure Highway: Remove a specific transaction row item via a dynamic path URL parameter
router.delete("/:id", verifyTokenGuard, deleteTransaction);

// Export Highways: Kept under transaction data tracking routes
router.get("/export/excel", verifyTokenGuard, exportTransactionsExcel);
router.get("/export/pdf", verifyTokenGuard, exportTransactionsPdf);
/* === SECTION 3 END === */

export default router;