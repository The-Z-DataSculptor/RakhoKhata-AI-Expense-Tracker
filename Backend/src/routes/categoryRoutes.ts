// Backend/src/routes/categoryRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import {
  getWorkspaceCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CATEGORY ROUTES ===
   ========================================================================== */
const router = Router();

// Fetch all categories for a workspace (workspaceId query parameter required)
router.get("/", verifyTokenGuard, getWorkspaceCategories);

// Create a new category
router.post("/", verifyTokenGuard, createCategory);

// Update an existing category by ID
router.put("/:id", verifyTokenGuard, updateCategory);

// Delete a category and its associated transactions
router.delete("/:id", verifyTokenGuard, deleteCategory);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */