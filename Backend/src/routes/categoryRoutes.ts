// src/routes/categoryRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { 
  getWorkspaceCategories, 
  createCategory, 
  updateCategory, // 🚀 FIXED: Added the missing controller import
  deleteCategory 
} from "../controllers/categoryController";
import { verifyTokenGuard } from "../middleware/authMiddleware"; // Secure perimeter check guard
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTING HIGHWAY DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Secure Highway: Read all folders associated with an active workspace search query
router.get("/", verifyTokenGuard, getWorkspaceCategories);

// Secure Highway: Add a new custom category folder line item to the platform
router.post("/", verifyTokenGuard, createCategory);

// Secure Highway: Update / Save changes to an existing category folder 
router.put("/:id", verifyTokenGuard, updateCategory); // 🚀 FIXED: Added the missing update highway lane!

// Secure Highway: Tear down a target folder index line item using dynamic path variables
router.delete("/:id", verifyTokenGuard, deleteCategory);
/* === SECTION 2 END === */

export default router;