// src/controllers/workspaceController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS AND SETUP ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CENTRALIZED CATEGORY SEEDER CONFIGURATIONS ===
   ========================================================================== */
// Shared core debt/receivable categories present across ALL workspace types
const CORE_DEBT_CATEGORIES = [
  { name: "Owed to Me (Receivable)", type: "INCOME", color: "#22c55e" },
  { name: "My Debts (Payable)", type: "EXPENSE", color: "#ef4444" }
];

export const SHARED_DEFAULT_PERSONAL_CATEGORIES = [
  { name: "Salary", type: "INCOME", color: "#10B981" },
  { name: "Rent & Housing", type: "EXPENSE", color: "#EF4444" },
  ...CORE_DEBT_CATEGORIES
];

export const SHARED_DEFAULT_BUSINESS_CATEGORIES = [
  { name: "Revenue", type: "INCOME", color: "#10b981" },
  { name: "Payroll", type: "EXPENSE", color: "#f43f5e" },
  ...CORE_DEBT_CATEGORIES
];

const seedDefaultCategoriesForWorkspace = async (workspaceId: string, workspaceName: string): Promise<void> => {
  const isBusiness = workspaceName.toLowerCase() === "business";
  const templates = isBusiness ? SHARED_DEFAULT_BUSINESS_CATEGORIES : SHARED_DEFAULT_PERSONAL_CATEGORIES;

  const starterCategories = templates.map(cat => ({
    ...cat,
    workspaceId
  }));

  await prisma.category.createMany({
    data: starterCategories
  });
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FETCH USER WORKSPACES ===
   ========================================================================== */
export const getUserWorkspaces = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session cookie invalid." });
      return;
    }

    let workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    if (workspaces.length === 0) {
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true }
      });
      
      const preferredCurrency = userProfile?.currency || "PKR";

      const personalSpace = await prisma.workspace.create({
        data: { name: "Personal", currency: preferredCurrency, userId }
      });
      await seedDefaultCategoriesForWorkspace(personalSpace.id, "Personal");

      const businessSpace = await prisma.workspace.create({
        data: { name: "Business", currency: preferredCurrency, userId }
      });
      await seedDefaultCategoriesForWorkspace(businessSpace.id, "Business");

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

    const newWorkspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        currency: currency || "PKR", 
        userId
      }
    });

    await seedDefaultCategoriesForWorkspace(newWorkspace.id, newWorkspace.name);

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
    const targetWorkspaceId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access tracking parameters." });
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json({ error: "Workspace target identifier query parameter missing." });
      return;
    }

    const workspaceTarget = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
    if (!workspaceTarget || workspaceTarget.userId !== userId) {
      res.status(403).json({ error: "Access denied. Action signature verification failed." });
      return;
    }

    await prisma.workspace.delete({ where: { id: targetWorkspaceId } });

    res.status(200).json({ message: "Workspace tracking container cleared successfully." });
  } catch (error) {
    console.error("Delete Workspace Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running data flush routines." });
  }
};
/* === SECTION 5 END === */

/* ==========================================================================
   === SECTION 6: UPDATE WORKSPACE ===
   ========================================================================== */
export const updateWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!workspaceId) {
      res.status(400).json({ error: "Workspace ID required." });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const { name, currency } = req.body;
    const data: Record<string, string> = {};
    if (name) data.name = name.trim();
    if (currency) data.currency = currency;

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data
    });

    res.status(200).json({ message: "Workspace updated successfully.", workspace: updated });
  } catch (error) {
    console.error("Update Workspace Error:", error);
    res.status(500).json({ error: "Internal server error updating workspace." });
  }
};
/* === SECTION 6 END === */