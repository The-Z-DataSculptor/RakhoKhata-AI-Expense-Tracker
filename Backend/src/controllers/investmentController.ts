// Backend/src/controllers/investmentController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONFIGURATION ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { Prisma } from "../../prisma/generated";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Safety limit on returned investments to prevent memory exhaustion
const MAX_INVESTMENTS_LIMIT = 500;

/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & TYPES ===
   ========================================================================== */

interface InvestmentMetadata {
  displayName?: string;
  displayIcon?: string;
  rawNote?: string;
  changeLog?: unknown[];
}

interface CreateInvestmentInput {
  workspaceId: string;
  assetSymbol?: string;
  symbol?: string;
  categoryClass?: string;
  customType?: string;
  selectedType?: string;
  isCustomProfile?: boolean;
  originalAmount?: number | string;
  totalInvested?: number | string;
  originalCurrency?: string;
  capitalCurrency?: string;
  baseAmountUSD?: number | string;
  quantity?: number | string;
  quantityOwned?: number | string;
  name?: string;
  icon?: string;
  userNote?: string;
  strategyNote?: unknown;
  history?: unknown[];
}

interface UpdateInvestmentInput {
  assetSymbol?: string;
  categoryClass?: string;
  isCustomProfile?: boolean;
  originalAmount?: number | string;
  totalInvested?: number | string;
  originalCurrency?: string;
  capitalCurrency?: string;
  baseAmountUSD?: number | string;
  quantity?: number | string;
  strategyNote?: unknown;
}

/**
 * Standardized JSON error response builder
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * WHY THIS IS NEEDED: Prevents HTTP parameter array injection attacks.
 * Safely extracts a single string parameter from query or route inputs.
 */
function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/**
 * WHY THIS IS NEEDED: Prevents NaN propagation and negative amounts/quantities.
 * Parses raw input into a valid non-negative number ($ \ge 0 $).
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

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * POST /api/investments
 * Creates a new investment asset entry inside a verified workspace.
 */
export const createInvestmentAsset = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const body = req.body as CreateInvestmentInput;

    // 1. Extract and sanitize string identifiers
    const sanitizedWorkspaceId = extractSingleString(body.workspaceId);
    const rawSymbol = body.assetSymbol ?? body.symbol ?? "ASSET";
    const sanitizedSymbol = String(rawSymbol).trim().toUpperCase();

    if (!sanitizedWorkspaceId || !sanitizedSymbol) {
      res.status(400).json(buildErrorResponse("Workspace ID and asset symbol are required."));
      return;
    }

    // WHY THIS FIX WAS MADE: Verifies workspace ownership BEFORE processing heavy data operations (BOLA Protection).
    const workspace = await prisma.workspace.findFirst({
      where: { id: sanitizedWorkspaceId, userId },
      select: { id: true, currency: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied to specified workspace."));
      return;
    }

    // 2. Parse numbers safely without falsy evaluation bugs
    const rawAmountValue = body.originalAmount !== undefined ? body.originalAmount : body.totalInvested;
    const parsedOriginalAmount = parseNonNegativeNumber(rawAmountValue) ?? 0;

    const rawUsdValue = body.baseAmountUSD !== undefined ? body.baseAmountUSD : body.totalInvested;
    const parsedBaseAmountUSD = parseNonNegativeNumber(rawUsdValue) ?? parsedOriginalAmount;

    const rawQuantityValue = body.quantity !== undefined ? body.quantity : body.quantityOwned;
    const parsedQuantity = parseNonNegativeNumber(rawQuantityValue) ?? 0;

    const sanitizedCategoryClass = String(
      body.categoryClass ?? body.customType ?? body.selectedType ?? "Traditional"
    ).trim();

    const sanitizedCurrency = String(
      body.originalCurrency ?? body.capitalCurrency ?? workspace.currency ?? "USD"
    ).trim().toUpperCase();

    // 3. Construct strategy metadata JSON safely
    let finalDisplayName = body.name ? String(body.name).trim() : sanitizedSymbol;
    let finalRawNote = body.userNote ? String(body.userNote).trim() : "";
    let finalHistory = Array.isArray(body.history) ? body.history : [];

    if (body.strategyNote) {
      try {
        const parsedNote: unknown =
          typeof body.strategyNote === "string"
            ? JSON.parse(body.strategyNote)
            : body.strategyNote;

        if (parsedNote && typeof parsedNote === "object") {
          const meta = parsedNote as InvestmentMetadata;
          if (meta.displayName) finalDisplayName = String(meta.displayName).trim();
          if (meta.rawNote) finalRawNote = String(meta.rawNote).trim();
          if (Array.isArray(meta.changeLog)) finalHistory = meta.changeLog;
        }
      } catch {
        finalRawNote = String(body.strategyNote).trim();
      }
    }

    const metadataBundle: InvestmentMetadata = {
      displayName: finalDisplayName,
      displayIcon: body.icon ? String(body.icon).trim() : "📦",
      rawNote: finalRawNote,
      changeLog: finalHistory,
    };

    // 4. Save asset to database
    const asset = await prisma.investment.create({
      data: {
        assetSymbol: sanitizedSymbol,
        categoryClass: sanitizedCategoryClass,
        isCustomProfile: Boolean(body.isCustomProfile),
        originalAmount: parsedOriginalAmount,
        originalCurrency: sanitizedCurrency,
        baseAmountUSD: parsedBaseAmountUSD,
        quantity: parsedQuantity,
        strategyNote: JSON.stringify(metadataBundle),
        workspaceId: sanitizedWorkspaceId,
      },
    });

    res.status(201).json({
      message: "Investment asset created successfully!",
      asset: {
        ...asset,
        name: metadataBundle.displayName,
        icon: metadataBundle.displayIcon,
        userNote: metadataBundle.rawNote,
        history: metadataBundle.changeLog,
      },
    });
  } catch (error: unknown) {
    console.error("Create Investment Asset Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error creating investment asset."));
  }
};

/**
 * GET /api/investments?workspaceId=...
 * Fetches investment portfolio items for a workspace with explicit result caps.
 */
export const getWorkspaceInvestments = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = extractSingleString(req.query.workspaceId);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json(buildErrorResponse("Workspace ID query parameter is required."));
      return;
    }

    // Verify workspace access (BOLA Authorization Shield)
    const workspace = await prisma.workspace.findFirst({
      where: { id: targetWorkspaceId, userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied to specified workspace."));
      return;
    }

    // WHY THIS FIX WAS MADE: Enforces MAX_INVESTMENTS_LIMIT limit to prevent server memory exhaustion.
    const investments = await prisma.investment.findMany({
      where: { workspaceId: targetWorkspaceId },
      orderBy: { assetSymbol: "asc" },
      take: MAX_INVESTMENTS_LIMIT,
    });

    // Hydrate strategyNote JSON safely
    const hydratedInvestments = investments.map((asset) => {
      try {
        const parsed: InvestmentMetadata = JSON.parse(asset.strategyNote || "{}");
        return {
          ...asset,
          name: parsed.displayName || `${asset.assetSymbol} Position`,
          icon: parsed.displayIcon || "📦",
          userNote: parsed.rawNote || "",
          history: parsed.changeLog || [],
        };
      } catch {
        return {
          ...asset,
          name: `${asset.assetSymbol} Position`,
          icon: "📦",
          userNote: asset.strategyNote || "",
          history: [],
        };
      }
    });

    res.status(200).json({ investments: hydratedInvestments });
  } catch (error: unknown) {
    console.error("Get Workspace Investments Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error fetching workspace investments."));
  }
};

/**
 * PUT /api/investments/:id
 * Updates an existing investment asset after verifying ownership.
 */
export const updateInvestmentAsset = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildErrorResponse("Asset ID parameter is required."));
      return;
    }

    const body = req.body as UpdateInvestmentInput;

    // 1. Fetch investment asset and verify ownership
    const existingAsset = await prisma.investment.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!existingAsset || existingAsset.workspace.userId !== userId) {
      res.status(403).json(buildErrorResponse("Access denied or asset not found."));
      return;
    }

    // WHY THIS FIX WAS MADE: Uses Prisma.InvestmentUpdateInput for full compiler type safety.
    const updatePayload: Prisma.InvestmentUpdateInput = {};

    if (body.assetSymbol !== undefined) {
      const sanitizedSymbol = String(body.assetSymbol).trim().toUpperCase();
      if (sanitizedSymbol) {
        updatePayload.assetSymbol = sanitizedSymbol;
      }
    }

    if (body.categoryClass !== undefined) {
      updatePayload.categoryClass = String(body.categoryClass).trim();
    }

    if (body.isCustomProfile !== undefined) {
      updatePayload.isCustomProfile = Boolean(body.isCustomProfile);
    }

    if (body.quantity !== undefined) {
      const parsedQty = parseNonNegativeNumber(body.quantity);
      if (parsedQty === undefined) {
        res.status(400).json(buildErrorResponse("Quantity must be a valid non-negative number."));
        return;
      }
      updatePayload.quantity = parsedQty;
    }

    const rawAmount = body.originalAmount !== undefined ? body.originalAmount : body.totalInvested;
    if (rawAmount !== undefined) {
      const parsedAmount = parseNonNegativeNumber(rawAmount);
      if (parsedAmount === undefined) {
        res.status(400).json(buildErrorResponse("Original amount must be a valid non-negative number."));
        return;
      }
      updatePayload.originalAmount = parsedAmount;
    }

    const rawCurrency = body.originalCurrency ?? body.capitalCurrency;
    if (rawCurrency !== undefined) {
      updatePayload.originalCurrency = String(rawCurrency).trim().toUpperCase();
    }

    if (body.baseAmountUSD !== undefined) {
      const parsedUsd = parseNonNegativeNumber(body.baseAmountUSD);
      if (parsedUsd === undefined) {
        res.status(400).json(buildErrorResponse("Base USD amount must be a valid non-negative number."));
        return;
      }
      updatePayload.baseAmountUSD = parsedUsd;
    }

    if (body.strategyNote !== undefined) {
      updatePayload.strategyNote =
        typeof body.strategyNote === "string"
          ? body.strategyNote
          : JSON.stringify(body.strategyNote);
    }

    // 2. Execute update
    const updatedAsset = await prisma.investment.update({
      where: { id: targetId },
      data: updatePayload,
    });

    // Parse strategy note for response payload
    let responseMeta: InvestmentMetadata = {
      displayName: updatedAsset.assetSymbol,
      displayIcon: "📦",
      rawNote: "",
      changeLog: [],
    };

    try {
      const parsed: unknown = JSON.parse(updatedAsset.strategyNote || "{}");
      if (parsed && typeof parsed === "object") {
        const meta = parsed as InvestmentMetadata;
        responseMeta = {
          displayName: meta.displayName || updatedAsset.assetSymbol,
          displayIcon: meta.displayIcon || "📦",
          rawNote: meta.rawNote || "",
          changeLog: meta.changeLog || [],
        };
      }
    } catch {
      // Use fallback defaults on JSON parse failure
    }

    res.status(200).json({
      message: "Investment asset updated successfully!",
      asset: {
        ...updatedAsset,
        name: responseMeta.displayName,
        icon: responseMeta.displayIcon,
        userNote: responseMeta.rawNote,
        history: responseMeta.changeLog,
      },
    });
  } catch (error: unknown) {
    console.error("Update Investment Asset Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error updating investment asset."));
  }
};

/**
 * DELETE /api/investments/:id
 * Removes an investment asset record after verifying ownership.
 */
export const deleteInvestmentAsset = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildErrorResponse("Asset ID parameter is required."));
      return;
    }

    // Verify ownership before deleting record
    const assetTarget = await prisma.investment.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!assetTarget || assetTarget.workspace.userId !== userId) {
      res.status(403).json(buildErrorResponse("Access denied or asset not found."));
      return;
    }

    await prisma.investment.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Investment asset removed successfully." });
  } catch (error: unknown) {
    console.error("Delete Investment Asset Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error removing investment asset."));
  }
};

/* === SECTION 3 END === */