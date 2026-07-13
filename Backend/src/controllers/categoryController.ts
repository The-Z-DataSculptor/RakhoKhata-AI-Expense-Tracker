// src/controllers/categoryController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";                                       // Core database client link
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

    // FIXED: No extra mapping needed – Prisma automatically returns all fields including:
    // isFixed, isRecurring, frequency, dueDay, reminderDays

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
      // 👇 NEW: Recurrence fields
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

    // Type Check: Ensure the mapping is strictly INCOME, EXPENSE, or BOTH matching your database rules
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
        color: color || "#7E7A9C", // Fallback hex color if they leave the picker blank
        workspaceId,
        // 👇 NEW: Save recurrence fields with defaults
        isRecurring: isRecurring || false,
        frequency: frequency || null,
        dueDay: dueDay || null,
        reminderDays: reminderDays || null,
        // 👇 isFixed is NOT set here – it's managed separately
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
   === SECTION 4: DELETE CATEGORY ===
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

    // Erase the row container block completely from Neon Cloud
    await prisma.category.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Category folder and its rule sets removed successfully." });
  } catch (error) {
    console.error("Delete Category Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running data flush routines." });
  }
};
/* === SECTION 4 END === */