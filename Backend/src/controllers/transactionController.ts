// src/controllers/transactionController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { GoogleGenAI } from "@google/genai";

// Data contracts for inbound transaction entries
interface InboundTransactionInput {
  originalAmount: string | number;
  originalCurrency: string;
  baseAmountUSD: string | number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  date: string;
  categoryId: string;
}

// Shape for a single transaction creation request body
interface CreateTransactionRequestBody {
  originalAmount: string;
  originalCurrency: string;
  baseAmountUSD: string;
  type: string;
  description: string;
  date: string;
  workspaceId: string;
  categoryId: string;
}

// Shape for the bulk import request body
interface BulkImportRequestBody {
  workspaceId: string;
  transactions: InboundTransactionInput[];
}

// Minimal file interface (avoids dependency on Express.Multer namespace)
interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
  size?: number;
}

// Request with Multer file (for receipt scanning)
interface AuthenticatedRequestWithFile extends AuthenticatedRequest {
  file?: MulterFile;
}

// Metrics extracted from receipt by AI
interface ExtractedReceiptMetrics {
  merchant: string;
  date: string;
  totalAmount: number;
  currency: string;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Build a standardised error object that never exposes internal details.
 */
function safeError(message: string): { error: string } {
  return { error: message };
}

/**
 * Check that a transaction type string is strictly "INCOME" or "EXPENSE".
 */
function isValidTransactionType(type: string): type is "INCOME" | "EXPENSE" {
  return type === "INCOME" || type === "EXPENSE";
}

/**
 * Safely parse a date string into a Date object.
 * Returns null if the string is invalid.
 */
function parseDateSafely(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

// ---------------------------------------------------------------------------
// CREATE SINGLE TRANSACTION
// ---------------------------------------------------------------------------
export const createTransaction = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const body = req.body as CreateTransactionRequestBody;
    const {
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      type,
      description,
      date,
      workspaceId,
      categoryId,
    } = body;

    // Check required fields
    if (
      !originalAmount ||
      !originalCurrency ||
      baseAmountUSD === undefined ||
      !type ||
      !date ||
      !workspaceId ||
      !categoryId
    ) {
      res.status(400).json(safeError("Missing required transaction parameters."));
      return;
    }

    if (!isValidTransactionType(type)) {
      res.status(400).json(safeError("Type must be INCOME or EXPENSE."));
      return;
    }

    // Validate the date
    const parsedDate = parseDateSafely(date);
    if (!parsedDate) {
      res.status(400).json(safeError("Invalid date format."));
      return;
    }

    // Verify workspace ownership
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json(safeError("Access denied."));
      return;
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        originalAmount: parseFloat(originalAmount),
        originalCurrency: originalCurrency.toUpperCase(),
        baseAmountUSD: parseFloat(baseAmountUSD),
        type,
        description: description || "",
        date: parsedDate,
        workspaceId,
        categoryId,
      },
      include: { category: true },
    });

    res.status(201).json({
      message: "Transaction logged successfully!",
      transaction,
    });
  } catch (error: unknown) {
    console.error("Create Transaction Error:", error);
    res.status(500).json(safeError("Internal server error."));
  }
};

// ---------------------------------------------------------------------------
// BULK IMPORT TRANSACTIONS
// ---------------------------------------------------------------------------
export const bulkCreateTransactions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const { workspaceId, transactions } = req.body as BulkImportRequestBody;

    if (
      !workspaceId ||
      !Array.isArray(transactions) ||
      transactions.length === 0
    ) {
      res.status(400).json(
        safeError("Missing workspace ID or batch transactions array.")
      );
      return;
    }

    // Verify workspace ownership
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json(safeError("Access denied."));
      return;
    }

    // Validate each entry
    for (let i = 0; i < transactions.length; i++) {
      const entry = transactions[i];
      if (
        entry.originalAmount === undefined ||
        entry.originalAmount === null ||
        isNaN(Number(entry.originalAmount))
      ) {
        res.status(400).json(
          safeError(`Row ${i + 1}: invalid or missing originalAmount.`)
        );
        return;
      }
      if (!entry.originalCurrency || String(entry.originalCurrency).trim() === "") {
        res.status(400).json(
          safeError(`Row ${i + 1}: missing originalCurrency.`)
        );
        return;
      }
      if (
        entry.baseAmountUSD === undefined ||
        entry.baseAmountUSD === null ||
        isNaN(Number(entry.baseAmountUSD))
      ) {
        res.status(400).json(
          safeError(`Row ${i + 1}: invalid or missing baseAmountUSD.`)
        );
        return;
      }
      if (!entry.type || (entry.type !== "INCOME" && entry.type !== "EXPENSE")) {
        res.status(400).json(
          safeError(`Row ${i + 1}: type must be INCOME or EXPENSE.`)
        );
        return;
      }
      if (!entry.date || String(entry.date).trim() === "") {
        res.status(400).json(safeError(`Row ${i + 1}: missing date.`));
        return;
      }
      const parsedDate = parseDateSafely(String(entry.date));
      if (!parsedDate) {
        res.status(400).json(safeError(`Row ${i + 1}: invalid date format.`));
        return;
      }
      if (!entry.categoryId || String(entry.categoryId).trim() === "") {
        res.status(400).json(safeError(`Row ${i + 1}: missing categoryId.`));
        return;
      }
    }

    // Insert all in a single transaction
    const insertedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const entry of transactions) {
        await tx.transaction.create({
          data: {
            originalAmount: Number(entry.originalAmount),
            originalCurrency: entry.originalCurrency.toUpperCase(),
            baseAmountUSD: Number(entry.baseAmountUSD),
            type: entry.type,
            description: entry.description || "",
            date: parseDateSafely(entry.date) as Date, // already validated
            workspaceId,
            categoryId: entry.categoryId,
          },
        });
        count++;
      }
      return count;
    });

    res.status(201).json({
      message: `Successfully imported ${insertedCount} transactions.`,
    });
  } catch (error: unknown) {
    console.error("Bulk Import Pipeline Crash:", error);
    res.status(500).json(safeError("Internal server error during bulk import."));
  }
};

// ---------------------------------------------------------------------------
// AI RECEIPT SCANNER
// ---------------------------------------------------------------------------
export const scanReceipt = async (
  req: AuthenticatedRequestWithFile,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const uploadedFile = req.file;
    if (!uploadedFile) {
      res.status(400).json(safeError("No receipt image or document uploaded."));
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json(safeError("AI service configuration missing."));
      return;
    }

    // Initialize AI client
    const aiClient = new GoogleGenAI({ apiKey });

    // Prepare the image payload for Gemini
    const receiptImagePart = {
      inlineData: {
        data: uploadedFile.buffer.toString("base64"),
        mimeType: uploadedFile.mimetype,
      },
    };

    // Detailed system prompt for extraction
    const extractionPrompt = `
You are an elite financial receipt parser.
Analyze the provided receipt image and extract the following JSON fields:
- merchant: vendor name (clean up noise, e.g., "MCDONALDS STORE #4322" → "McDonald's")
- date: transaction date in YYYY-MM-DD (assume 2026 if missing)
- totalAmount: final total as a number (ignore individual items)
- currency: three‑letter ISO code. If you see "Rs", "Rs.", "PR", or "PKR" output "PKR". If "$" output "USD". Default to "PKR" otherwise.
`;

    // Call Gemini 3.1 Flash-Lite
    const aiResponse = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [extractionPrompt, receiptImagePart],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = aiResponse.text;
    if (!rawText) {
      res.status(500).json(safeError("AI engine returned empty response."));
      return;
    }

    // Extract JSON object from response
    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      res.status(500).json(safeError("Failed to parse AI response."));
      return;
    }

    const parsedData: unknown = JSON.parse(jsonMatch[0]);

    // Verify the extracted data has required fields
    if (
      parsedData &&
      typeof parsedData === "object" &&
      "merchant" in parsedData &&
      "totalAmount" in parsedData
    ) {
      res.status(200).json(parsedData as ExtractedReceiptMetrics);
    } else {
      res.status(500).json(safeError("AI returned incomplete receipt data."));
    }
  } catch (error: unknown) {
    console.error("AI Scan Engine Crash:", error);
    // Do not expose internal error details to the client
    res.status(500).json(safeError("Receipt scanning failed. Please try again later."));
  }
};

// ---------------------------------------------------------------------------
// FETCH WORKSPACE TRANSACTIONS
// ---------------------------------------------------------------------------
export const getWorkspaceTransactions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = req.query.workspaceId
      ? String(req.query.workspaceId)
      : undefined;

    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json(safeError("Workspace ID is required."));
      return;
    }

    // Verify workspace ownership
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
    });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json(safeError("Access denied."));
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
  } catch (error: unknown) {
    console.error("Fetch Transactions Error:", error);
    res.status(500).json(safeError("Internal server error."));
  }
};

// ---------------------------------------------------------------------------
// DELETE TRANSACTION
// ---------------------------------------------------------------------------
export const deleteTransaction = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(safeError("Transaction ID is required."));
      return;
    }

    // Verify ownership
    const transactionTarget = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!transactionTarget) {
      res.status(404).json(safeError("Transaction not found."));
      return;
    }

    if (transactionTarget.workspace.userId !== userId) {
      res.status(403).json(safeError("Access denied."));
      return;
    }

    await prisma.transaction.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Transaction deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json(safeError("Internal server error."));
  }
};
/* === SECTION 3 END === */