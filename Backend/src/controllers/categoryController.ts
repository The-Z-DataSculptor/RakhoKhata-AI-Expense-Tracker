// Backend/src/controllers/categoryController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";                                   // Core database client link
import { AuthenticatedRequest } from "../middleware/authMiddleware"; // Secure session tracker layout
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: FETCH WORKSPACE CATEGORIES ===
   ========================================================================== */
export const getWorkspaceCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // Type-Safety Guard: Forcing query parameter to a single, clean primitive string layout
    const targetWorkspaceId = req.query.workspaceId ? String(req.query.workspaceId) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session credentials invalid." });
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json({ error: "Workspace query identifier parameter is required." });
      return;
    }

    // Security Gate: Confirm the user actually owns the workspace they are trying to read folders from
    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied. Verification credentials invalid for this profile." });
      return;
    }

    // Pull all category cards matching this workspace, sorting them alphabetically by label name
    const categories = await prisma.category.findMany({
      where: { workspaceId: targetWorkspaceId },
      orderBy: { name: "asc" }
    });

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Fetch Categories Controller Error:", error);
    res.status(500).json({ error: "Internal server error while retrieving categories index." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CREATE CUSTOM CATEGORY ===
   ========================================================================== */
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { 
      name, 
      type, 
      color, 
      workspaceId,
      isRecurring,
      frequency,
      dueDay,
      reminderDays
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access tracking metrics." });
      return;
    }

    // Validation: Require name, allocation type, and workspace map anchor
    if (!name || !name.trim() || !type || !workspaceId) {
      res.status(400).json({ error: "Missing required category parameters." });
      return;
    }

    // Type Check: Ensure the mapping is strictly INCOME, EXPENSE, or BOTH
    if (type !== "INCOME" && type !== "EXPENSE" && type !== "BOTH") {
      res.status(400).json({ error: "Allocation mapping must be strictly INCOME, EXPENSE, or BOTH." });
      return;
    }

    // Security Verification: Confirm that the user owns the workspace container shell
    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied. Action signature verification failed." });
      return;
    }

    // Save the brand new custom folder row directly to Neon Cloud
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        color: color || "#7E7A9C", 
        workspaceId,
        isRecurring: !!isRecurring, 
        frequency: frequency || null,
        dueDay: (dueDay !== undefined && dueDay !== null) ? Number(dueDay) : null,
        reminderDays: (reminderDays !== undefined && reminderDays !== null) ? Number(reminderDays) : null,
      }
    });

    res.status(201).json({
      message: "Custom financial category deployed successfully!",
      category
    });
  } catch (error) {
    console.error("Create Category Controller Exception:", error);
    res.status(500).json({ error: "Internal server error establishing category row mapping." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: UPDATE / RE-SAVE CATEGORY CONTROLLER ===
   ========================================================================== */
export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;
    const { name, type, color, isRecurring, frequency, dueDay, reminderDays } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized data modification attempt." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Target modification category id path reference parameter is required." });
      return;
    }

    // Security Scan: Verify folder exists and matches caller authorization keys
    const targetCategory = await prisma.category.findUnique({
      where: { id: targetId },
      include: { workspace: true }
    });

    if (!targetCategory) {
      res.status(404).json({ error: "Category targeted for synchronization routines was not found." });
      return;
    }

    if (targetCategory.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied. Workspace data alignment match mismatched." });
      return;
    }

    // Execute atomic record updating
    const updatedCategory = await prisma.category.update({
      where: { id: targetId },
      data: {
        name: name !== undefined ? name.trim() : targetCategory.name,
        type: type !== undefined ? type : targetCategory.type,
        color: color !== undefined ? color : targetCategory.color,
        isRecurring: isRecurring !== undefined ? !!isRecurring : targetCategory.isRecurring,
        frequency: frequency !== undefined ? frequency : targetCategory.frequency,
        dueDay: dueDay !== undefined ? (dueDay !== null ? Number(dueDay) : null) : targetCategory.dueDay,
        reminderDays: reminderDays !== undefined ? (reminderDays !== null ? Number(reminderDays) : null) : targetCategory.reminderDays,
      }
    });

    res.status(200).json({
      message: "Data flush routines executed cleanly. Category records synchronized.",
      category: updatedCategory
    });
  } catch (error) {
    console.error("Update Category Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running data flush routines." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: DELETE CATEGORY ===
   ========================================================================== */
export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access parameters." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Category row identifier path parameter is missing." });
      return;
    }

    // Verification Step: Confirm category folder exists and is inside a workspace owned by this caller
    const categoryTarget = await prisma.category.findUnique({
      where: { id: targetId },
      include: { workspace: true }
    });

    if (!categoryTarget) {
      res.status(404).json({ error: "The requested category layout folder could not be found." });
      return;
    }

    if (categoryTarget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied. Workspace ownership match failed." });
      return;
    }

    // 🚀 CRITICAL CASCADE SAFEGUARD FIX: Clear out any dependent transactions first to avoid constraint crashes
    await prisma.transaction.deleteMany({
      where: { categoryId: targetId }
    });

    // Erase the row container block completely from Neon Cloud
    await prisma.category.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Category folder and its rule sets removed successfully." });
  } catch (error) {
    console.error("Delete Category Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running data flush routines." });
  }
};
/* === SECTION 5 END === */