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

    const parsedAmount = parseFloat(originalAmount);
    if (isNaN(parsedAmount) || !startDate || !endDate || !categoryId || !workspaceId) {
      res.status(400).json({ error: "Missing or invalid required budget parameters." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const categoryCheck = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryCheck || categoryCheck.workspaceId !== workspaceId) {
      res.status(400).json({ error: "Target category does not exist in this workspace." });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        originalAmount: parsedAmount,
        originalCurrency: (originalCurrency || workspaceCheck.currency || "USD").toUpperCase(),
        baseAmountUSD: parseFloat(baseAmountUSD ?? originalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        categoryId,
        workspaceId,
      },
      include: {
        category: true,
        workspace: { select: { currency: true } },
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
   === SECTION 3: FETCH WORKSPACE BUDGETS (WITH PRE‑CALCULATED SPENDING) ===
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
      res.status(400).json({ error: "Workspace query parameter is required." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: { id: true, currency: true, userId: true },
    });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const workspaceCurrency = workspaceCheck.currency || "USD";

    const budgets = await prisma.budget.findMany({
      where: { workspaceId: targetWorkspaceId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    const budgetsWithSpentData = await Promise.all(
      budgets.map(async (budget) => {
        const spentSum = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            workspaceId: targetWorkspaceId,
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: { originalAmount: true },
        });

        return {
          ...budget,
          spentAmount: spentSum._sum.originalAmount || 0,
          originalAmount: budget.originalAmount,
          originalCurrency: budget.originalCurrency || workspaceCurrency,
          baseAmountUSD: budget.baseAmountUSD,
        };
      })
    );

    res.status(200).json({ budgets: budgetsWithSpentData });
  } catch (error) {
    console.error("Fetch Budgets Controller Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: UPDATE BUDGET ===
   ========================================================================== */
export const updateBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const budgetId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!budgetId) {
      res.status(400).json({ error: "Budget ID is required." });
      return;
    }

    const {
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
    } = req.body;

    const existingBudget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { workspace: true },
    });

    if (!existingBudget || existingBudget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    if (categoryId) {
      const categoryCheck = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryCheck || categoryCheck.workspaceId !== existingBudget.workspaceId) {
        res.status(400).json({ error: "Invalid category for this workspace." });
        return;
      }
    }

    const updateData: Record<string, unknown> = {};

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
   === SECTION 5: DELETE BUDGET ===
   ========================================================================== */
export const deleteBudget = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Budget ID is missing." });
      return;
    }

    const budgetTarget = await prisma.budget.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!budgetTarget || budgetTarget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    await prisma.budget.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Budget deleted successfully." });
  } catch (error) {
    console.error("Delete Budget Controller Exception:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 5 END === */