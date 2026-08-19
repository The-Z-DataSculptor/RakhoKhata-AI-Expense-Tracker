// Backend/src/controllers/transactionController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import { Response as ExpressResponse, Request } from "express";
import "multer";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { GoogleGenAI } from "@google/genai";

// Maximum allowed transactions per fetch query to prevent server OOM crashes
const MAX_TRANSACTIONS_FETCH_LIMIT = 500;

// Maximum allowed entries per bulk import batch payload
const MAX_BULK_IMPORT_BATCH_SIZE = 500;

// Allowed file MIME types for AI receipt scanning
const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

// Data contract for inbound transaction items during bulk import
interface InboundTransactionInput {
  originalAmount: string | number;
  originalCurrency: string;
  baseAmountUSD: string | number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  date: string;
  categoryId: string;
}

// Data contract for single transaction creation request body
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

// Data contract for transaction update request body
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

// Data contract for bulk import request body
interface BulkImportRequestBody {
  workspaceId: string;
  transactions: InboundTransactionInput[];
}

// Struct for structured JSON output extracted by Gemini AI from receipt images
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

/**
 * Standardized JSON error response builder
 */
function buildSafeError(message: string): { error: string } {
  return { error: message };
}

/**
 * Safely extracts a single string parameter from query or route parameters.
 */
function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/**
 * Parses raw input into a valid non-negative number.
 */
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

/**
 * Validates whether a transaction type string matches schema enums strictly.
 */
function isValidTransactionType(type: unknown): type is "INCOME" | "EXPENSE" {
  return type === "INCOME" || type === "EXPENSE";
}

/**
 * Safely parses string inputs into valid Date instances. Returns null on invalid formats.
 */
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
 * Creates a single transaction entry after verifying workspace and category ownership.
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

    // 1. Validate required parameter presence
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

    // 2. Validate transaction date format
    const parsedDate = parseDateSafely(String(body.date));
    if (!parsedDate) {
      res.status(400).json(buildSafeError("Invalid date format provided."));
      return;
    }

    // Verifies workspace ownership BEFORE creating records (BOLA Protection).
    const workspace = await prisma.workspace.findFirst({
      where: { id: sanitizedWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    // Verifies that category belongs to target workspace to prevent cross-tenant category injection.
    const categoryMatch = await prisma.category.findFirst({
      where: { id: sanitizedCategoryId, workspaceId: sanitizedWorkspaceId },
      select: { id: true },
    });

    if (!categoryMatch) {
      res.status(400).json(buildSafeError("Target category does not exist in this workspace."));
      return;
    }

    // 3. Create transaction entry
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
 * Updates an existing transaction record or re-assigns its category safely.
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

    // Verify transaction exists and user owns the parent workspace
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

      // Verify category belongs to the transaction's workspace
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
 * Imports a batch of transactions using a single atomic database query.
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

    // 1. Validate payload structure and batch constraints
    if (!sanitizedWorkspaceId || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json(buildSafeError("Missing workspace ID or batch transactions array."));
      return;
    }

    // Restricts batch import size to prevent payload memory exhaustion DoS.
    if (transactions.length > MAX_BULK_IMPORT_BATCH_SIZE) {
      res.status(400).json(
        buildSafeError(`Batch size exceeds maximum limit of ${MAX_BULK_IMPORT_BATCH_SIZE} entries per import.`)
      );
      return;
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: sanitizedWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
      return;
    }

    // 2. Validate individual batch items in memory before touching database
    const preparedRecords: Array<{
      originalAmount: number;
      originalCurrency: string;
      baseAmountUSD: number;
      type: "INCOME" | "EXPENSE";
      description: string;
      date: Date;
      workspaceId: string;
      categoryId: string;
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
      });
    }

    // Verifies in ONE batch query that all referenced category IDs belong to this workspace.
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
 * Uses Gemini AI vision models to parse receipt images and extract transaction metrics.
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

    // Validates file MIME type to block malicious file uploads.
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

    // Initialize Google Gemini AI client
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
- merchant: vendor name (clean up noise, e.g., "MCDONALDS STORE #4322" → "McDonald's")
- date: transaction date in YYYY-MM-DD format
- totalAmount: final numerical total amount
- currency: three-letter ISO currency code. Map "Rs", "Rs.", "PKR" → "PKR", "$" → "USD". Default to "PKR" if unknown.
`;

    // Query Gemini vision model
    const aiResponse = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-lite",
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

    // Extract JSON payload from model output
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
 * Fetches transactions for a workspace with explicit result bounds.
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

    // Verify workspace access
    const workspace = await prisma.workspace.findFirst({
      where: { id: targetWorkspaceId, userId: userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildSafeError("Access denied to specified workspace."));
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
 * Removes a transaction record after verifying ownership.
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

    // Verify transaction exists and user owns the parent workspace
    const transactionTarget = await prisma.transaction.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!transactionTarget || transactionTarget.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied or transaction not found."));
      return;
    }

    await prisma.transaction.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Transaction deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json(buildSafeError("Internal server error deleting transaction."));
  }
};
/* === SECTION 3 END === */