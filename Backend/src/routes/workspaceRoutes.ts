// Backend/src/routes/workspaceRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Router } from "express";
import {
  getUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspaceController";
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: WORKSPACE ROUTES ===
   ========================================================================== */
const router = Router();

// Fetch all workspaces belonging to the authenticated user
router.get("/", verifyTokenGuard, getUserWorkspaces);

// Create a new workspace
router.post("/", verifyTokenGuard, createWorkspace);

// Update an existing workspace (name, currency)
router.put("/:id", verifyTokenGuard, updateWorkspace);

// Cascade delete a workspace and all its data
router.delete("/:id", verifyTokenGuard, deleteWorkspace);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT ===
   ========================================================================== */
export default router;
/* === SECTION 3 END === */