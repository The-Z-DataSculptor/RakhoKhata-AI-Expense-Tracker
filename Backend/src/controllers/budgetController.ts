// src/controllers/budgetController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db"; 
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CREATE OR UPDATE CATEGORY BUDGET ===
   ========================================================================== */
export const createBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limitAmount, startDate, endDate, categoryId, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session token missing." });
      return;
    }

    if (!limitAmount || !startDate || !endDate || !categoryId || !workspaceId) {
      res.status(400).json({ error: "Missing required budget parameter properties." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied. Action verification signature invalid." });
      return;
    }

    const categoryCheck = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryCheck || categoryCheck.workspaceId !== workspaceId) {
      res.status(400).json({ error: "Target category does not exist within this workspace context." });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        limitAmount: parseFloat(limitAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        categoryId,
        workspaceId
      },
      include: {
        category: true 
      }
    });

    res.status(201).json({
      message: "Spending threshold watch rule deployed successfully!",
      budget
    });
  } catch (error) {
    console.error("Create Budget Controller Exception:", error);
    res.status(500).json({ error: "Internal server error establishing budget limit parameters." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FETCH WORKSPACE BUDGETS (WITH PRE-CALCULATED SPENDING) ===
   ========================================================================== */
export const getWorkspaceBudgets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = req.query.workspaceId ? String(req.query.workspaceId) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session invalid." });
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json({ error: "Workspace query parameter tracker identifier is required." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied. Verification credentials invalid for this profile." });
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { workspaceId: targetWorkspaceId },
      include: {
        category: true 
      },
      orderBy: { createdAt: "desc" }
    });

    // UPGRADED: Automatically calculate actual spending for each budget range
    const budgetsWithSpentData = await Promise.all(
      budgets.map(async (budget) => {
        const spentSum = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            date: {
              gte: budget.startDate,
              lte: budget.endDate
            }
          },
          _sum: { amount: true }
        });

        return {
          ...budget,
          spentAmount: spentSum._sum.amount || 0 // Returns 0 if no transactions found
        };
      })
    );

    res.status(200).json({ budgets: budgetsWithSpentData });
  } catch (error) {
    console.error("Fetch Budgets Controller Error:", error);
    res.status(500).json({ error: "Internal server error while extracting budget allocation indexes." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: REMOVE BUDGET WATCH RULE ===
   ========================================================================== */
export const deleteBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access profile tracking." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Budget row path parameter identifier is missing." });
      return;
    }

    const budgetTarget = await prisma.budget.findUnique({
      where: { id: targetId },
      include: { workspace: true }
    });

    if (!budgetTarget) {
      res.status(404).json({ error: "The requested budget restriction card could not be found." });
      return;
    }

    if (budgetTarget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied. Ownership permissions missing." });
      return;
    }

    await prisma.budget.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Budget limit watch rule cleared successfully." });
  } catch (error) {
    console.error("Delete Budget Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running budget layout teardown scripts." });
  }
};
/* === SECTION 4 END === */