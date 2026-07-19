// src/controllers/transactionController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { GoogleGenAI } from "@google/genai"; 
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CREATE NEW TRANSACTION ===
   ========================================================================== */
export const createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      originalAmount,      
      originalCurrency,    
      baseAmountUSD,       
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

    if (!originalAmount || !originalCurrency || baseAmountUSD === undefined || !type || !date || !workspaceId || !categoryId) {
      res.status(400).json({ error: "Missing required transaction parameters (including original currency/amount)." });
      return;
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      res.status(400).json({ error: "Classification must be INCOME or EXPENSE." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        originalAmount: parseFloat(originalAmount),
        originalCurrency: originalCurrency.toUpperCase(),
        baseAmountUSD: parseFloat(baseAmountUSD),
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
   === SECTION 2B: AUTOMATED BULK IMPORTING SYSTEM ===
   ========================================================================== */
export const bulkCreateTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workspaceId, transactions } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!workspaceId || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({ error: "Missing workspace identifier context or structured batch transactions data array." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied to target workspace grid ledger." });
      return;
    }

    for (let i = 0; i < transactions.length; i++) {
      const rowItem = transactions[i];

      if (rowItem.originalAmount === undefined || rowItem.originalAmount === null || isNaN(Number(rowItem.originalAmount))) {
        res.status(400).json({ error: `Import failed: Record at row index position ${i + 1} has an invalid or missing originalAmount value.` });
        return;
      }
      
      if (!rowItem.originalCurrency || String(rowItem.originalCurrency).trim() === "") {
        res.status(400).json({ error: `Import failed: Record at row index position ${i + 1} is missing a valid originalCurrency code layout.` });
        return;
      }
      
      if (rowItem.baseAmountUSD === undefined || rowItem.baseAmountUSD === null || isNaN(Number(rowItem.baseAmountUSD))) {
        res.status(400).json({ error: `Import failed: Record at row index position ${i + 1} has an uncalculated or missing baseAmountUSD value tracking key.` });
        return;
      }
      
      if (!rowItem.type || (rowItem.type !== "INCOME" && rowItem.type !== "EXPENSE")) {
        res.status(400).json({ error: `Import failed: Record at row index position ${i + 1} contains an invalid flow type structure: values must be INCOME or EXPENSE.` });
        return;
      }
      
      if (!rowItem.date || String(rowItem.date).trim() === "") {
        res.status(400).json({ error: `Import failed: Record at row index position ${i + 1} is missing an operational timestamp date tracker string.` });
        return;
      }
      
      if (!rowItem.categoryId || String(rowItem.categoryId).trim() === "") {
        res.status(400).json({ error: `Import failed: Record at row index position ${i + 1} is missing a valid relational categoryId identification string.` });
        return;
      }
    }

    const operationsCountResult = await prisma.$transaction(async (tx) => {
      let insertedCount = 0;

      for (const entry of transactions) {
        await tx.transaction.create({
          data: {
            originalAmount: parseFloat(entry.originalAmount),
            originalCurrency: entry.originalCurrency.toUpperCase(),
            baseAmountUSD: parseFloat(entry.baseAmountUSD),
            type: entry.type,
            description: entry.description || "",
            date: new Date(entry.date),
            workspaceId,
            categoryId: entry.categoryId,
          },
        });
        insertedCount++;
      }

      return insertedCount;
    });

    res.status(201).json({
      message: `Successfully batch processed and imported ${operationsCountResult} transactional entries!`,
    });

  } catch (error) {
    console.error("Bulk Ledger Data Import Pipeline Crash:", error);
    res.status(500).json({ error: "Internal processing breakdown during sheet ingestion bulk execution tracking hooks." });
  }
};
/* === SECTION 2B END === */

/* ==========================================================================
   === SECTION 2C: 🚀 AUTOMATED AI RECEIPT SCANNER ENGINE ===
   ========================================================================== */
export const scanReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access security perimeter mismatch." });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No receipt document or image boundary stream detected." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Server Configuration Error: Gemini API credentials token is unassigned." });
      return;
    }

    const aiClient = new GoogleGenAI({ apiKey });
    
    const receiptImagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    };

    const strictSystemPrompt = `
      You are an elite, highly accurate financial accounting ledger parsing system.
      Analyze this provided receipt image or document file carefully. 
      Your task is to extract the following transaction metrics:
      
      1. merchant: The name of the store, business, vendor or service provider. Clean up structural noise (e.g., use "McDonald's" instead of "MCDONALDS STORE #4322").
      2. date: The transaction date formatted string strictly as standard calendar notation (YYYY-MM-DD). If no clear year is visible, assume 2026.
      3. totalAmount: The final consolidated total or balance due figure as a clean numerical decimal float. Avoid individual line items or running values.
      4. currency: The three-letter ISO currency representation code. Look for regional indicators: if you see "Rs", "Rs.", "PR", or "PKR", output "PKR". If you see "$", output "USD". Default to "PKR" if uncertain.
    `;

    // 🚀 FIXED: Swapped out retired model name tracking parameters for Gemini 3.1 Flash-Lite
    const aiResponseEnvelope = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [strictSystemPrompt, receiptImagePart],
      config: {
        responseMimeType: "application/json"
      }
    });

    const outputText = aiResponseEnvelope.text;
    if (!outputText) {
      throw new Error("AI engine executed successfully but returned a void text stream fragment.");
    }

    const jsonMatch = outputText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error(`Failed to isolate structural JSON brackets inside response: ${outputText}`);
    }

    const extractedFinancialMetrics = JSON.parse(jsonMatch[0]);
    res.status(200).json(extractedFinancialMetrics);

  } catch (error: unknown) {
    console.error("\n❌ ============= AI SCAN ENGINE CRASH DETAILS =============");
    console.error(error);
    console.error("============================================================\n");

    const innerMessage = error instanceof Error ? error.message : "Parsing baseline breakdown.";
    res.status(500).json({ 
      error: `AI Scanner Engine experienced an analytical parsing or timeout processing breakdown: ${innerMessage}` 
    });
  }
};
/* === SECTION 2C END === */

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