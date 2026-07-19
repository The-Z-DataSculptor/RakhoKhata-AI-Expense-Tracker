// Backend/src/controllers/budgetController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Reusable helper that creates a safe error object
 * without exposing internal details.
 */
function buildSafeError(message: string): { error: string } {
  return { error: message };
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

// ---------------------------------------------------------------------------
// CREATE BUDGET
// ---------------------------------------------------------------------------
export const createBudget = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
      workspaceId,
    } = req.body as Record<string, unknown>;

    // ----- Authentication & input checks -----
    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    const parsedAmount = parseFloat(String(originalAmount));
    if (
      isNaN(parsedAmount) ||
      !startDate ||
      !endDate ||
      !categoryId ||
      !workspaceId
    ) {
      res
        .status(400)
        .json(
          buildSafeError("Missing or invalid required budget parameters.")
        );
      return;
    }

    // ----- Ownership verification -----
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    const categoryCheck = await prisma.category.findUnique({
      where: { id: String(categoryId) },
    });
    if (!categoryCheck || categoryCheck.workspaceId !== String(workspaceId)) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Target category does not exist in this workspace."
          )
        );
      return;
    }

    // ----- Create budget record -----
    const budget = await prisma.budget.create({
      data: {
        originalAmount: parsedAmount,
        originalCurrency: (
          String(originalCurrency || workspaceCheck.currency || "USD")
        ).toUpperCase(),
        baseAmountUSD: parseFloat(
          String(baseAmountUSD ?? originalAmount)
        ),
        startDate: new Date(String(startDate)),
        endDate: new Date(String(endDate)),
        categoryId: String(categoryId),
        workspaceId: String(workspaceId),
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
  } catch (error: unknown) {
    console.error("Create Budget Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error establishing budget limit parameters."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// GET WORKSPACE BUDGETS (WITH SPENDING)
// ---------------------------------------------------------------------------
export const getWorkspaceBudgets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = req.query.workspaceId
      ? String(req.query.workspaceId)
      : undefined;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }
    if (!targetWorkspaceId) {
      res
        .status(400)
        .json(buildSafeError("Workspace query parameter is required."));
      return;
    }

    // Verify workspace ownership
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: { id: true, currency: true, userId: true },
    });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    const workspaceCurrency = workspaceCheck.currency || "USD";

    // Fetch all budgets for the workspace
    const budgets = await prisma.budget.findMany({
      where: { workspaceId: targetWorkspaceId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Compute spent amounts by aggregating transaction originalAmount
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
  } catch (error: unknown) {
    console.error("Fetch Budgets Controller Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error."));
  }
};

// ---------------------------------------------------------------------------
// UPDATE BUDGET
// ---------------------------------------------------------------------------
export const updateBudget = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const budgetId = req.params.id as string;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }
    if (!budgetId) {
      res.status(400).json(buildSafeError("Budget ID is required."));
      return;
    }

    const {
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      startDate,
      endDate,
      categoryId,
    } = req.body as Record<string, unknown>;

    // Verify budget ownership
    const existingBudget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { workspace: true },
    });
    if (!existingBudget || existingBudget.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    // If a new category is provided, verify it belongs to the same workspace
    if (categoryId) {
      const categoryCheck = await prisma.category.findUnique({
        where: { id: String(categoryId) },
      });
      if (
        !categoryCheck ||
        categoryCheck.workspaceId !== existingBudget.workspaceId
      ) {
        res
          .status(400)
          .json(
            buildSafeError("Invalid category for this workspace.")
          );
        return;
      }
    }

    // Build update object – only include defined fields
    const updateData: Record<string, unknown> = {};

    if (originalAmount !== undefined) {
      updateData.originalAmount = parseFloat(String(originalAmount));
    }
    if (originalCurrency !== undefined) {
      updateData.originalCurrency = String(originalCurrency);
    }
    if (baseAmountUSD !== undefined) {
      updateData.baseAmountUSD = parseFloat(String(baseAmountUSD));
    }
    if (startDate !== undefined) {
      updateData.startDate = new Date(String(startDate));
    }
    if (endDate !== undefined) {
      updateData.endDate = new Date(String(endDate));
    }
    if (categoryId !== undefined) {
      updateData.categoryId = String(categoryId);
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: { category: true },
    });

    res.status(200).json({
      message: "Budget updated successfully!",
      budget: updatedBudget,
    });
  } catch (error: unknown) {
    console.error("Update Budget Controller Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error updating budget."));
  }
};

// ---------------------------------------------------------------------------
// DELETE BUDGET
// ---------------------------------------------------------------------------
export const deleteBudget = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id as string;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }
    if (!targetId) {
      res.status(400).json(buildSafeError("Budget ID is missing."));
      return;
    }

    const budgetTarget = await prisma.budget.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });
    if (!budgetTarget || budgetTarget.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    await prisma.budget.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Budget deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete Budget Controller Exception:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error."));
  }
};
/* === SECTION 3 END === */