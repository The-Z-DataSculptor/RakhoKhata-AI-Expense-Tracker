// src/controllers/workspaceController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS AND SETUP ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";                                       // Core database client link
import { AuthenticatedRequest } from "../middleware/authMiddleware"; // Secure session tracker layout
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CATEGORY SEEDER HELPER (THE AUTOMATIC SETUP ENGINE) ===
   ========================================================================== */
// Beginner-friendly helper function that builds 6 standard starter folders for any workspace ID
const seedDefaultCategoriesForWorkspace = async (workspaceId: string): Promise<void> => {
  const starterCategories = [
    // Income Streams (Visual Accent Theme: Greens and Blues)
    { name: "Salary", type: "INCOME", color: "#10B981", workspaceId },
    { name: "Investments", type: "INCOME", color: "#3B82F6", workspaceId },
    
    // Expense Streams (Visual Accent Theme: Oranges, Reds, Purples, Pinks)
    { name: "Food & Groceries", type: "EXPENSE", color: "#F97316", workspaceId },
    { name: "Rent & Housing", type: "EXPENSE", color: "#EF4444", workspaceId },
    { name: "Utilities", type: "EXPENSE", color: "#8B5CF6", workspaceId },
    { name: "Entertainment", type: "EXPENSE", color: "#EC4899", workspaceId }
  ];

  // Batch-insert the categories directly into Neon Cloud
  await prisma.category.createMany({
    data: starterCategories
  });
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FETCH USER WORKSPACES (WITH LAZY-SEEDER FALLBACK) ===
   ========================================================================== */
export const getUserWorkspaces = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session cookie invalid." });
      return;
    }

    // 1. Look up all existing workspaces assigned to this user account
    let workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    // 2. FALLBACK GUARD: If an older profile holds 0 workspaces, build them right now!
    if (workspaces.length === 0) {
      // Create 'Personal' workspace node
      const personalSpace = await prisma.workspace.create({
        data: { name: "Personal", currency: "USD", userId }
      });
      // Instantly seed its default baseline folders
      await seedDefaultCategoriesForWorkspace(personalSpace.id);

      // Create 'Business' workspace node
      const businessSpace = await prisma.workspace.create({
        data: { name: "Business", currency: "USD", userId }
      });
      // Instantly seed its default baseline folders
      await seedDefaultCategoriesForWorkspace(businessSpace.id);

      // Re-query the database to pull down the newly minted entries with their actual cloud UUIDs
      workspaces = await prisma.workspace.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" }
      });
    }

    res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Fetch Workspaces Controller Exception:", error);
    res.status(500).json({ error: "Internal server error while syncing workspace layers." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: CREATE CUSTOM WORKSPACE ===
   ========================================================================== */
export const createWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, currency } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Identity token missing." });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Workspace label text is required." });
      return;
    }

    // 1. Log the new workspace container shell row inside Neon Cloud
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        currency: currency || "USD", // System universal fallback standard
        userId
      }
    });

    // 2. TRIGGER SEEDER: Populate the new custom workspace with starter folders instantly
    await seedDefaultCategoriesForWorkspace(newWorkspace.id);

    res.status(201).json({
      message: "Workspace created and seeded successfully!",
      workspace: newWorkspace
    });
  } catch (error) {
    console.error("Create Workspace Controller Exception:", error);
    res.status(500).json({ error: "Internal server error deploying workspace matrix." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: CASCADE DELETE WORKSPACE ===
   ========================================================================== */
export const deleteWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access tracking parameters." });
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json({ error: "Workspace target identifier query parameter missing." });
      return;
    }

    // Confirm workspace ownership before running destructive commands
    const workspaceTarget = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
    if (!workspaceTarget || workspaceTarget.userId !== userId) {
      res.status(403).json({ error: "Access denied. Action signature verification failed." });
      return;
    }

    // Execute standard database record removal
    await prisma.workspace.delete({ where: { id: targetWorkspaceId } });

    res.status(200).json({ message: "Workspace tracking container cleared successfully." });
  } catch (error) {
    console.error("Delete Workspace Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running data flush routines." });
  }
};
/* === SECTION 5 END === */