// Backend/src/controllers/transactionController.ts


/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import "multer";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { GoogleGenAI } from "@google/genai";

const MAX_TRANSACTIONS_FETCH_LIMIT = 500;
const MAX_BULK_IMPORT_BATCH_SIZE = 1000;

const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

interface InboundTransactionInput {
  originalAmount: string | number;
  originalCurrency: string;
  baseAmountUSD: string | number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  date: string;
  categoryId: string;
}

interface CreateTransactionRequestBody {
  originalAmount: string | number;
  originalCurrency: string;
  baseAmountUSD: string | number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  date: string;
  workspaceId: string;
  categoryId: string;
}

interface UpdateTransactionRequestBody {
  amount?: string | number;
  originalAmount?: string | number;
  originalCurrency?: string;
  baseAmountUSD?: string | number;
  type?: "INCOME" | "EXPENSE";
  description?: string;
  date?: string;
  categoryId?: string;
}

interface BulkImportRequestBody {
  workspaceId: string;
  transactions: InboundTransactionInput[];
}

interface ExtractedReceiptMetrics {
  merchant: string;
  date: string;
  totalAmount: number;
  currency: string;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & UTILITIES ===
   ========================================================================== */

function buildSafeError(message: string): { error: string } {
  return { error: message };
}

function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function parseNonNegativeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num) || num < 0) {
    return undefined;
  }
  return num;
}

function isValidTransactionType(type: unknown): type is "INCOME" | "EXPENSE" {
  return type === "INCOME" || type === "EXPENSE";
}

function parseDateSafely(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * POST /api/transactions
 */
export const createTransaction = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    const body = req.body as CreateTransactionRequestBody;
    const sanitizedWorkspaceId = extractSingleString(body.workspaceId);
    const sanitizedCategoryId = extractSingleString(body.categoryId);
    const sanitizedCurrency = extractSingleString(body.originalCurrency)?.toUpperCase();
    const sanitizedDescription = body.description ? String(body.description).trim() : "";

    const parsedOriginalAmount = parseNonNegativeNumber(body.originalAmount);
    const parsedBaseAmountUSD = parseNonNegativeNumber(body.baseAmountUSD);

    if (
      parsedOriginalAmount === undefined ||
      parsedBaseAmountUSD === undefined ||
      !sanitizedCurrency ||
      !isValidTransactionType(body.type) ||
      !body.date ||
      !sanitizedWorkspaceId ||
      !sanitizedCategoryId
    ) {
      res.status(400).json(buildSafeError("Missing or invalid transaction parameters."));
      return;
    }

    const parsedDate = parseDateSafely(String(body.date));
    if (!parsedDate) {
      res.status(400).json(buildSafeError("Invalid date format provided."));
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: sanitizedWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    const categoryMatch = await prisma.category.findFirst({
      where: { id: sanitizedCategoryId, workspaceId: sanitizedWorkspaceId },
      select: { id: true },
    });

    if (!categoryMatch) {
      res.status(400).json(buildSafeError("Target category does not exist in this workspace."));
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        originalAmount: parsedOriginalAmount,
        originalCurrency: sanitizedCurrency,
        baseAmountUSD: parsedBaseAmountUSD,
        type: body.type,
        description: sanitizedDescription,
        date: parsedDate,
        workspaceId: sanitizedWorkspaceId,
        categoryId: sanitizedCategoryId,
        deletedAt: null,
      },
      include: { category: true },
    });

    res.status(201).json({
      message: "Transaction logged successfully!",
      transaction,
    });
  } catch (error: unknown) {
    console.error("Create Transaction Error:", error);
    res.status(500).json(buildSafeError("Internal server error logging transaction."));
  }
};

/**
 * PUT /api/transactions/:id
 */
export const updateTransaction = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildSafeError("Transaction ID is required."));
      return;
    }

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!existingTransaction || existingTransaction.workspace.userId !== userId) {
      res.status(404).json(buildSafeError("Transaction not found or access denied."));
      return;
    }

    const body = req.body as UpdateTransactionRequestBody;
    const updateData: Record<string, unknown> = {};

    if (body.originalAmount !== undefined) {
      const parsed = parseNonNegativeNumber(body.originalAmount);
      if (parsed === undefined) {
        res.status(400).json(buildSafeError("Invalid originalAmount value."));
        return;
      }
      updateData.originalAmount = parsed;
    }

    if (body.amount !== undefined) {
      const parsed = parseNonNegativeNumber(body.amount);
      if (parsed !== undefined) {
        updateData.originalAmount = parsed;
      }
    }

    if (body.baseAmountUSD !== undefined) {
      const parsed = parseNonNegativeNumber(body.baseAmountUSD);
      if (parsed === undefined) {
        res.status(400).json(buildSafeError("Invalid baseAmountUSD value."));
        return;
      }
      updateData.baseAmountUSD = parsed;
    }

    if (body.originalCurrency !== undefined) {
      const curr = extractSingleString(body.originalCurrency)?.toUpperCase();
      if (!curr) {
        res.status(400).json(buildSafeError("Invalid currency code provided."));
        return;
      }
      updateData.originalCurrency = curr;
    }

    if (body.type !== undefined) {
      if (!isValidTransactionType(body.type)) {
        res.status(400).json(buildSafeError("Type must be INCOME or EXPENSE."));
        return;
      }
      updateData.type = body.type;
    }

    if (body.description !== undefined) {
      updateData.description = String(body.description).trim();
    }

    if (body.date !== undefined) {
      const parsedDate = parseDateSafely(String(body.date));
      if (!parsedDate) {
        res.status(400).json(buildSafeError("Invalid date format provided."));
        return;
      }
      updateData.date = parsedDate;
    }

    if (body.categoryId !== undefined) {
      const catId = extractSingleString(body.categoryId);
      if (!catId) {
        res.status(400).json(buildSafeError("Invalid category ID provided."));
        return;
      }

      const categoryMatch = await prisma.category.findFirst({
        where: { id: catId, workspaceId: existingTransaction.workspaceId },
        select: { id: true },
      });

      if (!categoryMatch) {
        res.status(400).json(buildSafeError("Category does not belong to this workspace."));
        return;
      }

      updateData.categoryId = catId;
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: targetId },
      data: updateData,
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
    });

    res.status(200).json({
      message: "Transaction updated successfully.",
      transaction: updatedTransaction,
    });
  } catch (error: unknown) {
    console.error("Update Transaction Error:", error);
    res.status(500).json(buildSafeError("Internal server error updating transaction."));
  }
};

/**
 * POST /api/transactions/bulk
 */
export const bulkCreateTransactions = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    const { workspaceId, transactions } = req.body as BulkImportRequestBody;
    const sanitizedWorkspaceId = extractSingleString(workspaceId);

    if (!sanitizedWorkspaceId || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json(buildSafeError("Missing workspace ID or batch transactions array."));
      return;
    }

    if (transactions.length > MAX_BULK_IMPORT_BATCH_SIZE) {
      res.status(400).json(
        buildSafeError(`Batch size exceeds maximum limit of ${MAX_BULK_IMPORT_BATCH_SIZE} entries per import.`)
      );
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: sanitizedWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    const preparedRecords: Array<{
      originalAmount: number;
      originalCurrency: string;
      baseAmountUSD: number;
      type: "INCOME" | "EXPENSE";
      description: string;
      date: Date;
      workspaceId: string;
      categoryId: string;
      deletedAt: null;
    }> = [];

    const referencedCategoryIds = new Set<string>();

    for (let i = 0; i < transactions.length; i++) {
      const entry = transactions[i];
      const rowNum = i + 1;

      const parsedAmount = parseNonNegativeNumber(entry.originalAmount);
      if (parsedAmount === undefined) {
        res.status(400).json(buildSafeError(`Row ${rowNum}: invalid or missing originalAmount.`));
        return;
      }

      const parsedUsd = parseNonNegativeNumber(entry.baseAmountUSD);
      if (parsedUsd === undefined) {
        res.status(400).json(buildSafeError(`Row ${rowNum}: invalid or missing baseAmountUSD.`));
        return;
      }

      const currency = extractSingleString(entry.originalCurrency)?.toUpperCase();
      if (!currency) {
        res.status(400).json(buildSafeError(`Row ${rowNum}: missing originalCurrency.`));
        return;
      }

      if (!isValidTransactionType(entry.type)) {
        res.status(400).json(buildSafeError(`Row ${rowNum}: type must be INCOME or EXPENSE.`));
        return;
      }

      const parsedDate = parseDateSafely(String(entry.date));
      if (!parsedDate) {
        res.status(400).json(buildSafeError(`Row ${rowNum}: invalid date format.`));
        return;
      }

      const categoryId = extractSingleString(entry.categoryId);
      if (!categoryId) {
        res.status(400).json(buildSafeError(`Row ${rowNum}: missing categoryId.`));
        return;
      }

      referencedCategoryIds.add(categoryId);

      preparedRecords.push({
        originalAmount: parsedAmount,
        originalCurrency: currency,
        baseAmountUSD: parsedUsd,
        type: entry.type,
        description: entry.description ? String(entry.description).trim() : "",
        date: parsedDate,
        workspaceId: sanitizedWorkspaceId,
        categoryId: categoryId,
        deletedAt: null,
      });
    }

    const validCategories = await prisma.category.findMany({
      where: {
        id: { in: Array.from(referencedCategoryIds) },
        workspaceId: sanitizedWorkspaceId,
      },
      select: { id: true },
    });

    if (validCategories.length !== referencedCategoryIds.size) {
      res.status(400).json(
        buildSafeError("One or more referenced category IDs do not exist in this workspace.")
      );
      return;
    }

    const batchResult = await prisma.transaction.createMany({
      data: preparedRecords,
    });

    res.status(201).json({
      message: `Successfully imported ${batchResult.count} transactions.`,
      count: batchResult.count,
    });
  } catch (error: unknown) {
    console.error("Bulk Import Pipeline Crash:", error);
    res.status(500).json(buildSafeError("Internal server error during bulk import."));
  }
};

/**
 * POST /api/transactions/scan-receipt
 */
export const scanReceipt = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    const uploadedFile = req.file;
    if (!uploadedFile || !uploadedFile.buffer) {
      res.status(400).json(buildSafeError("No receipt image or document file uploaded."));
      return;
    }

    if (!ALLOWED_RECEIPT_MIME_TYPES.includes(uploadedFile.mimetype.toLowerCase())) {
      res.status(400).json(
        buildSafeError("Invalid file type. Please upload a JPEG, PNG, WEBP, or PDF document.")
      );
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.status(500).json(buildSafeError("AI receipt scanner service is not configured on server."));
      return;
    }

    const aiClient = new GoogleGenAI({ apiKey });

    const receiptImagePart = {
      inlineData: {
        data: uploadedFile.buffer.toString("base64"),
        mimeType: uploadedFile.mimetype,
      },
    };

    const extractionPrompt = `
You are an elite financial receipt parser.
Analyze the provided receipt image and extract the following JSON fields:
- merchant: vendor name
- date: transaction date in YYYY-MM-DD format
- totalAmount: final numerical total amount
- currency: three-letter ISO currency code. Map "Rs", "Rs.", "PKR" → "PKR", "$" → "USD". Default to "PKR" if unknown.
`;

    const aiResponse = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [extractionPrompt, receiptImagePart],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = aiResponse.text;
    if (!rawText) {
      res.status(500).json(buildSafeError("AI engine returned empty text response."));
      return;
    }

    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      res.status(500).json(buildSafeError("Failed to parse AI model response output."));
      return;
    }

    const parsedData: unknown = JSON.parse(jsonMatch[0]);

    if (
      parsedData &&
      typeof parsedData === "object" &&
      "merchant" in parsedData &&
      "totalAmount" in parsedData
    ) {
      res.status(200).json(parsedData as ExtractedReceiptMetrics);
    } else {
      res.status(500).json(buildSafeError("AI model returned incomplete receipt data fields."));
    }
  } catch (error: unknown) {
    console.error("AI Scan Engine Crash:", error);
    res.status(500).json(buildSafeError("Receipt scanning failed. Please try again later."));
  }
};

/**
 * GET /api/transactions?workspaceId=...
 * Active transactions only (deletedAt IS NULL).
 */
export const getWorkspaceTransactions = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetWorkspaceId = extractSingleString(req.query.workspaceId);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json(buildSafeError("Workspace ID query parameter is required."));
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: targetWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: targetWorkspaceId,
        deletedAt: null,
      },
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
      take: MAX_TRANSACTIONS_FETCH_LIMIT,
    });

    res.status(200).json({ transactions: transactions || [] });
  } catch (error: unknown) {
    console.error("Fetch Transactions Error:", error);
    res.status(500).json(buildSafeError("Internal server error fetching workspace transactions."));
  }
};

/**
 * DELETE /api/transactions/:id
 * Soft delete: Moves transaction to Recycle Bin by stamping deletedAt.
 */
export const deleteTransaction = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildSafeError("Transaction ID parameter is required."));
      return;
    }

    const transactionTarget = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!transactionTarget || transactionTarget.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied or transaction not found."));
      return;
    }

    await prisma.transaction.update({
      where: { id: targetId },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({ message: "Transaction moved to Recycle Bin." });
  } catch (error: unknown) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json(buildSafeError("Internal server error moving transaction to trash."));
  }
};

/**
 * GET /api/transactions/trash?workspaceId=...
 * Fetches all soft-deleted records for the workspace.
 */
export const getTrashedTransactions = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetWorkspaceId = extractSingleString(req.query.workspaceId);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json(buildSafeError("Workspace ID query parameter is required."));
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: targetWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    const trashed = await prisma.transaction.findMany({
      where: {
        workspaceId: targetWorkspaceId,
        deletedAt: { not: null },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
      },
      orderBy: { deletedAt: "desc" },
      take: 200,
    });

    res.status(200).json({ trashed: trashed || [] });
  } catch (error: unknown) {
    console.error("Get Trashed Transactions Error:", error);
    res.status(500).json(buildSafeError("Internal server error fetching trash records."));
  }
};

/**
 * POST /api/transactions/:id/restore
 * Restores a soft-deleted transaction by clearing deletedAt.
 */
export const restoreTransaction = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildSafeError("Transaction ID is required."));
      return;
    }

    const transactionTarget = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!transactionTarget || transactionTarget.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied or transaction not found."));
      return;
    }

    const restored = await prisma.transaction.update({
      where: { id: targetId },
      data: { deletedAt: null },
      include: { category: true },
    });

    res.status(200).json({
      message: "Transaction restored to ledger successfully.",
      transaction: restored,
    });
  } catch (error: unknown) {
    console.error("Restore Transaction Error:", error);
    res.status(500).json(buildSafeError("Internal server error restoring transaction."));
  }
};

/**
 * DELETE /api/transactions/:id/permanent
 * Permanently erases a transaction from the database.
 */
export const permanentDeleteTransaction = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildSafeError("Transaction ID is required."));
      return;
    }

    const transactionTarget = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!transactionTarget || transactionTarget.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied or transaction not found."));
      return;
    }

    await prisma.transaction.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Transaction permanently erased." });
  } catch (error: unknown) {
    console.error("Permanent Delete Transaction Error:", error);
    res.status(500).json(buildSafeError("Internal server error permanently deleting transaction."));
  }
};

/**
 * DELETE /api/transactions/trash/empty
 * Permanently purges all trashed items in a workspace.
 */
export const emptyWorkspaceTrash = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const targetWorkspaceId = extractSingleString(req.body?.workspaceId || req.query.workspaceId);

    if (!userId) {
      res.status(401).json(buildSafeError("Authentication required."));
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json(buildSafeError("Workspace ID parameter is required."));
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: targetWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    const result = await prisma.transaction.deleteMany({
      where: {
        workspaceId: targetWorkspaceId,
        deletedAt: { not: null },
      },
    });

    res.status(200).json({
      message: `Recycle Bin emptied. ${result.count} records permanently removed.`,
      count: result.count,
    });
  } catch (error: unknown) {
    console.error("Empty Trash Error:", error);
    res.status(500).json(buildSafeError("Internal server error emptying trash."));
  }
};