// src/controllers/budgetController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CREATE BUDGET ===
   ========================================================================== */
export const createBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { 
      limitAmount,
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
      workspaceId 
    } = req.body;

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
        originalAmount: parseFloat(originalAmount || limitAmount),
        originalCurrency: originalCurrency || "USD",
        baseAmountUSD: parseFloat(baseAmountUSD || limitAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        categoryId,
        workspaceId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      message: "Spending threshold watch rule deployed successfully!",
      budget,
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
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const budgetsWithSpentData = await Promise.all(
      budgets.map(async (budget) => {
        const spentSum = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: { baseAmountUSD: true },
        });

        return {
          ...budget,
          spentAmount: spentSum._sum.baseAmountUSD || 0,
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
   === SECTION 4: UPDATE BUDGET (NEW) ===
   ========================================================================== */
export const updateBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const budgetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!budgetId) {
      res.status(400).json({ error: "Budget ID is required." });
      return;
    }

    const {
      limitAmount,
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
    } = req.body;

    // Verify the budget exists and belongs to a workspace owned by the user
    const existingBudget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { workspace: true },
    });

    if (!existingBudget) {
      res.status(404).json({ error: "Budget not found." });
      return;
    }

    if (existingBudget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied. You do not own this budget." });
      return;
    }

    // If a new category is provided, verify it exists in the workspace
    if (categoryId) {
      const categoryCheck = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryCheck || categoryCheck.workspaceId !== existingBudget.workspaceId) {
        res.status(400).json({ error: "Invalid category for this workspace." });
        return;
      }
    }

    // Build update data
    const updateData: any = {};
    if (limitAmount !== undefined) updateData.limitAmount = parseFloat(limitAmount);
    if (originalAmount !== undefined) updateData.originalAmount = parseFloat(originalAmount);
    if (originalCurrency !== undefined) updateData.originalCurrency = originalCurrency;
    if (baseAmountUSD !== undefined) updateData.baseAmountUSD = parseFloat(baseAmountUSD);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: { category: true },
    });

    res.status(200).json({
      message: "Budget updated successfully!",
      budget: updatedBudget,
    });
  } catch (error) {
    console.error("Update Budget Controller Error:", error);
    res.status(500).json({ error: "Internal server error updating budget." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: REMOVE BUDGET WATCH RULE ===
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
      include: { workspace: true },
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
/* === SECTION 5 END === */