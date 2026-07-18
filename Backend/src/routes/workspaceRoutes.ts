// src/routes/workspaceRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { 
  getUserWorkspaces, 
  createWorkspace, 
  updateWorkspace, // 🚀 FIXED: Imported the update controller
  deleteWorkspace 
} from "../controllers/workspaceController";
import { verifyTokenGuard } from "../middleware/authMiddleware"; // Secure perimeter controller validation guard
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: INTERFACES AND ROUTING DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Protected Highway: Fetch active workspace list items for the dashboard profile layout switcher
router.get("/", verifyTokenGuard, getUserWorkspaces);

// Protected Highway: Append a new custom ledger profile instance into the account dashboard view context
router.post("/", verifyTokenGuard, createWorkspace);

// Protected Highway: Update an existing workspace (used to save currency choices permanently)
router.put("/:id", verifyTokenGuard, updateWorkspace); // 🚀 FIXED: Added the missing update lane!

// Protected Highway: Cascade clear an target workspace framework node via dynamic path validation keys
router.delete("/:id", verifyTokenGuard, deleteWorkspace);
/* === SECTION 2 END === */

export default router;