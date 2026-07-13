// src/routes/investmentRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { 
  createInvestmentAsset, 
  getWorkspaceInvestments, 
  updateInvestmentAsset,  // NEW: Import the update controller
  deleteInvestmentAsset 
} from "../controllers/investmentController";
import { verifyTokenGuard } from "../middleware/authMiddleware"; // Secure session validation perimeter guard
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTING HIGHWAY DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Secure Highway: Read all investment holding records mapped to an active workspace query
router.get("/", verifyTokenGuard, getWorkspaceInvestments);

// Secure Highway: Append a new stock, crypto, or commodity asset line to the active vault
router.post("/", verifyTokenGuard, createInvestmentAsset);

// NEW: Secure Highway: Update an existing investment asset by ID
router.put("/:id", verifyTokenGuard, updateInvestmentAsset);

// Secure Highway: Permanently erase a specific asset holding row using its unique path ID parameter
router.delete("/:id", verifyTokenGuard, deleteInvestmentAsset);
/* === SECTION 2 END === */

export default router;