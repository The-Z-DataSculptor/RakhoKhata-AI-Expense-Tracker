// Backend/src/routes/investmentRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import {
  createInvestmentAsset,
  getWorkspaceInvestments,
  updateInvestmentAsset,
  deleteInvestmentAsset,
} from "../controllers/investmentController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: INVESTMENT VAULT ROUTES ===
   ========================================================================== */
const router = Router();

// Fetch all investments for a workspace (workspaceId query parameter required)
router.get("/", verifyTokenGuard, getWorkspaceInvestments);

// Add a new investment asset
router.post("/", verifyTokenGuard, createInvestmentAsset);

// Update an existing investment asset by ID
router.put("/:id", verifyTokenGuard, updateInvestmentAsset);

// Delete an investment asset
router.delete("/:id", verifyTokenGuard, deleteInvestmentAsset);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */