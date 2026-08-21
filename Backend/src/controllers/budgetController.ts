// Backend/src/controllers/budgetController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONTRACTS ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/* ==========================================================================
   === SECTION 2: TYPES & HELPER UTILITIES ===
   ========================================================================== */

interface CreateBudgetInput {
  originalAmount: number;
  originalCurrency?: string;
  baseAmountUSD?: number;
  startDate: string;
  endDate: string;
  categoryId: string;
  workspaceId: string;
}

interface UpdateBudgetInput {
  originalAmount?: number;
  originalCurrency?: string;
  baseAmountUSD?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

function isValidDate(dateString: string): boolean {
  const parsedDate = new Date(dateString);
  return !isNaN(parsedDate.getTime());
}

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

export const createBudget = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const {
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
      workspaceId,
    } = req.body as CreateBudgetInput;

    if (!originalAmount || !startDate || !endDate || !categoryId || !workspaceId) {
      res.status(400).json(buildErrorResponse("Missing required budget parameters."));
      return;
    }

    const parsedAmount = Number(originalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json(buildErrorResponse("Budget amount must be a positive number."));
      return;
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      res.status(400).json(buildErrorResponse("Invalid start or end date format."));
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      res.status(400).json(buildErrorResponse("Start date must be strictly before end date."));
      return;
    }

    const [workspace, category] = await Promise.all([
      prisma.workspace.findFirst({
        where: { id: String(workspaceId), userId: userId },
      }),
      prisma.category.findFirst({
        where: { id: String(categoryId), workspaceId: String(workspaceId) },
      }),
    ]);

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied to the specified workspace."));
      return;
    }

    if (!category) {
      res.status(400).json(buildErrorResponse("Category does not exist in this workspace."));
      return;
    }

    const targetCurrency = (originalCurrency || workspace.currency || "PKR").toUpperCase();

    // Guard against 1:1 USD fallback bugs when creating non-USD budgets
    let usdAmount: number;
    if (baseAmountUSD !== undefined && !isNaN(Number(baseAmountUSD))) {
      usdAmount = Number(baseAmountUSD);
    } else if (targetCurrency === "USD") {
      usdAmount = parsedAmount;
    } else {
      usdAmount = parsedAmount; // Fallback only when explicitly provided in USD
    }

    const budget = await prisma.budget.create({
      data: {
        originalAmount: parsedAmount,
        originalCurrency: targetCurrency,
        baseAmountUSD: usdAmount,
        startDate: start,
        endDate: end,
        categoryId: String(categoryId),
        workspaceId: String(workspaceId),
      },
      include: {
        category: true,
        workspace: { select: { currency: true } },
      },
    });

    res.status(201).json({
      message: "Budget limit established successfully!",
      budget,
    });
  } catch (error: unknown) {
    console.error("Create Budget Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error creating budget."));
  }
};

export const getWorkspaceBudgets = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.query.workspaceId ? String(req.query.workspaceId) : undefined;

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!workspaceId) {
      res.status(400).json(buildErrorResponse("Workspace ID query parameter is required."));
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: userId },
      select: { id: true, currency: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied to specified workspace."));
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { workspaceId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    if (budgets.length === 0) {
      res.status(200).json({ budgets: [] });
      return;
    }

    const categoryIds = Array.from(new Set(budgets.map((b) => b.categoryId)));
    const minStartDate = new Date(Math.min(...budgets.map((b) => b.startDate.getTime())));
    const maxEndDate = new Date(Math.max(...budgets.map((b) => b.endDate.getTime())));

    // Exclude soft-deleted transactions from budget calculations
    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId,
        categoryId: { in: categoryIds },
        deletedAt: null,
        type: "EXPENSE",
        date: {
          gte: minStartDate,
          lte: maxEndDate,
        },
      },
      select: {
        categoryId: true,
        baseAmountUSD: true,
        date: true,
      },
    });

    const budgetsWithSpentData = budgets.map((budget) => {
      const matchingSpentUSD = transactions
        .filter((tx) => {
          const txDate = new Date(tx.date).getTime();
          return (
            tx.categoryId === budget.categoryId &&
            txDate >= budget.startDate.getTime() &&
            txDate <= budget.endDate.getTime()
          );
        })
        .reduce((sum, tx) => sum + Number(tx.baseAmountUSD || 0), 0);

      return {
        id: budget.id,
        originalAmount: Number(budget.originalAmount),
        originalCurrency: budget.originalCurrency || workspace.currency,
        baseAmountUSD: Number(budget.baseAmountUSD),
        spentAmount: Math.round((matchingSpentUSD + Number.EPSILON) * 100) / 100,
        startDate: budget.startDate,
        endDate: budget.endDate,
        category: budget.category,
        workspaceId: budget.workspaceId,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };
    });

    res.status(200).json({ budgets: budgetsWithSpentData });
  } catch (error: unknown) {
    console.error("Get Workspace Budgets Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error fetching budgets."));
  }
};

export const updateBudget = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const budgetId = req.params.id as string;

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!budgetId) {
      res.status(400).json(buildErrorResponse("Budget ID parameter is required."));
      return;
    }

    const {
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
    } = req.body as UpdateBudgetInput;

    const existingBudget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { workspace: true },
    });

    if (!existingBudget || existingBudget.workspace.userId !== userId) {
      res.status(403).json(buildErrorResponse("Access denied or budget not found."));
      return;
    }

    const updatePayload: Record<string, unknown> = {};

    if (originalAmount !== undefined) {
      const parsedAmount = Number(originalAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json(buildErrorResponse("Budget amount must be a positive number."));
        return;
      }
      updatePayload.originalAmount = parsedAmount;
    }

    if (baseAmountUSD !== undefined) {
      const parsedUSD = Number(baseAmountUSD);
      if (!isNaN(parsedUSD)) {
        updatePayload.baseAmountUSD = parsedUSD;
      }
    }

    if (originalCurrency !== undefined) {
      updatePayload.originalCurrency = String(originalCurrency).toUpperCase();
    }

    let newStart = existingBudget.startDate;
    let newEnd = existingBudget.endDate;

    if (startDate !== undefined) {
      if (!isValidDate(startDate)) {
        res.status(400).json(buildErrorResponse("Invalid start date format."));
        return;
      }
      newStart = new Date(startDate);
      updatePayload.startDate = newStart;
    }

    if (endDate !== undefined) {
      if (!isValidDate(endDate)) {
        res.status(400).json(buildErrorResponse("Invalid end date format."));
        return;
      }
      newEnd = new Date(endDate);
      updatePayload.endDate = newEnd;
    }

    if (newStart >= newEnd) {
      res.status(400).json(buildErrorResponse("Start date must be strictly before end date."));
      return;
    }

    if (categoryId !== undefined) {
      const categoryMatch = await prisma.category.findFirst({
        where: { id: String(categoryId), workspaceId: existingBudget.workspaceId },
      });
      if (!categoryMatch) {
        res.status(400).json(buildErrorResponse("Category does not exist in this workspace."));
        return;
      }
      updatePayload.categoryId = String(categoryId);
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: updatePayload,
      include: { category: true },
    });

    res.status(200).json({
      message: "Budget updated successfully!",
      budget: updatedBudget,
    });
  } catch (error: unknown) {
    console.error("Update Budget Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error updating budget."));
  }
};

export const deleteBudget = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildErrorResponse("Budget ID is required."));
      return;
    }

    const budgetTarget = await prisma.budget.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!budgetTarget || budgetTarget.workspace.userId !== userId) {
      res.status(403).json(buildErrorResponse("Access denied or budget not found."));
      return;
    }

    await prisma.budget.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Budget deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete Budget Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error deleting budget."));
  }
};