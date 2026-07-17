// src/routes/transactionRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { 
  createTransaction, 
  getWorkspaceTransactions, 
  deleteTransaction 
} from "../controllers/transactionController";
import { exportTransactionsExcel, exportTransactionsPdf } from "../controllers/exportController";
import { verifyTokenGuard } from "../middleware/authMiddleware"; // Secure perimeter check guard
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTING HIGHWAY DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Secure Highway: Fetch transactions matching an active workspace parameter
router.get("/", verifyTokenGuard, getWorkspaceTransactions);

// Secure Highway: Insert a new income or expense log row into the database
router.post("/", verifyTokenGuard, createTransaction);

// Secure Highway: Remove a specific transaction row item via a dynamic path URL parameter
router.delete("/:id", verifyTokenGuard, deleteTransaction);

// 🚀 THE CORRECT HOME: Kept strictly under transaction data tracking routes
router.get("/export/excel", verifyTokenGuard, exportTransactionsExcel);
router.get("/export/pdf", verifyTokenGuard, exportTransactionsPdf);
/* === SECTION 2 END === */

export default router;