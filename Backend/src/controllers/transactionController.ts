// src/controllers/transactionController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CREATE NEW TRANSACTION ===
   ========================================================================== */
export const createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      originalAmount,      // amount as entered by user
      originalCurrency,    // e.g., "PKR"
      baseAmountUSD,       // converted to USD (calculated by frontend)
      type,
      description,
      date,
      workspaceId,
      categoryId
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    // Validate required fields
    if (!originalAmount || !originalCurrency || baseAmountUSD === undefined || !type || !date || !workspaceId || !categoryId) {
      res.status(400).json({ error: "Missing required transaction parameters (including original currency/amount)." });
      return;
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      res.status(400).json({ error: "Classification must be INCOME or EXPENSE." });
      return;
    }

    // Security check
    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    // Create transaction – include `amount` for backward compatibility with current Prisma client
    const transaction = await prisma.transaction.create({
      data: {
        originalAmount: parseFloat(originalAmount),
        originalCurrency: originalCurrency.toUpperCase(),
        baseAmountUSD: parseFloat(baseAmountUSD),
        amount: parseFloat(originalAmount),   // <-- needed until schema is migrated and client regenerated
        type,
        description: description || "",
        date: new Date(date),
        workspaceId,
        categoryId,
      },
      include: { category: true },
    });

    res.status(201).json({
      message: "Transaction logged successfully!",
      transaction,
    });
  } catch (error) {
    console.error("Create Transaction Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FETCH WORKSPACE TRANSACTIONS ===
   ========================================================================== */
export const getWorkspaceTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = req.query.workspaceId ? String(req.query.workspaceId) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json({ error: "Workspace ID required." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { workspaceId: targetWorkspaceId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            isFixed: true,
            isRecurring: true,
            frequency: true,
            dueDay: true,
            reminderDays: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: DELETE TRANSACTION ===
   ========================================================================== */
export const deleteTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Transaction ID required." });
      return;
    }

    const transactionTarget = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!transactionTarget) {
      res.status(404).json({ error: "Transaction not found." });
      return;
    }

    if (transactionTarget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    await prisma.transaction.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Transaction deleted successfully." });
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 4 END === */