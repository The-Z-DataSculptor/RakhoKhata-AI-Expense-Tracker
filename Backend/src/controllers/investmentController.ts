// Backend/src/controllers/investmentController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Safe error wrapper to avoid leaking internal details
function buildSafeError(message: string): { error: string } {
  return { error: message };
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

// Expected shape of the metadata stored in strategyNote JSON
interface InvestmentMetadata {
  displayName?: string;
  displayIcon?: string;
  rawNote?: string;
  changeLog?: unknown[];
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

// ---------------------------------------------------------------------------
// CREATE INVESTMENT ASSET (only permanent columns)
// ---------------------------------------------------------------------------
export const createInvestmentAsset = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    // Destructure all possible fields from the request body (both old and new)
    const body = req.body as Record<string, unknown>;
    const {
      workspaceId,
      isCustomProfile,
      categoryClass,
      selectedType,
      customType,
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      totalInvested,      // legacy – accepted but not written to DB
      capitalCurrency,    // legacy – accepted but not written
      quantity,
      quantityOwned,
      name,
      symbol,
      assetSymbol,
      icon,
      userNote,
      strategyNote,
      history,
    } = body;

    // ----- Normalize and validate inputs -----
    const finalSymbol = String(
      assetSymbol || symbol || "ASSET"
    ).trim().toUpperCase();
    const finalWorkspaceId = String(workspaceId);
    const finalCategoryClass = String(
      categoryClass || customType || selectedType || "Traditional"
    ).trim();

    // Amount parsing with safe fallbacks
    const rawAmount = originalAmount ?? totalInvested ?? 0;
    const parsedOriginalAmount =
      typeof rawAmount === "number"
        ? rawAmount
        : parseFloat(String(rawAmount)) || 0;

    const rawUSD = baseAmountUSD ?? totalInvested ?? 0;
    const parsedBaseAmountUSD =
      typeof rawUSD === "number"
        ? rawUSD
        : parseFloat(String(rawUSD)) || 0;

    const rawQty = quantity || quantityOwned || 0;
    const finalQuantity =
      typeof rawQty === "number"
        ? rawQty
        : parseFloat(String(rawQty)) || 0;

    const finalOriginalCurrency = String(
      originalCurrency || capitalCurrency || "USD"
    ).trim().toUpperCase();

    if (
      !finalSymbol ||
      !finalWorkspaceId ||
      isNaN(finalQuantity) ||
      isNaN(parsedOriginalAmount)
    ) {
      res
        .status(400)
        .json(buildSafeError("Missing or invalid parameters."));
      return;
    }

    // ----- Workspace ownership verification -----
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: finalWorkspaceId },
    });
    if (
      !workspaceCheck ||
      workspaceCheck.userId !== userId
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    // ----- Build metadata bundle -----
    let finalDisplayName = name ? String(name) : "";
    let finalRawNote = "";
    let finalHistory = Array.isArray(history) ? history : [];

    // If a pre-formatted strategyNote JSON is provided, extract its fields
    if (strategyNote) {
      try {
        const parsedNode: unknown =
          typeof strategyNote === "string"
            ? JSON.parse(strategyNote)
            : strategyNote;
        if (parsedNode && typeof parsedNode === "object") {
          const meta = parsedNode as InvestmentMetadata;
          if (meta.displayName) finalDisplayName = String(meta.displayName);
          if (meta.rawNote) finalRawNote = String(meta.rawNote);
          if (meta.changeLog) finalHistory = meta.changeLog;
        }
      } catch {
        // If parsing fails, treat it as a plain note string
        finalRawNote = String(strategyNote);
      }
    } else if (userNote) {
      finalRawNote = String(userNote);
    }

    const metadataBundle: InvestmentMetadata = {
      displayName: finalDisplayName,
      displayIcon: icon ? String(icon) : "📦",
      rawNote: finalRawNote,
      changeLog: finalHistory,
    };

    // ----- Create the investment record -----
    const asset = await prisma.investment.create({
      data: {
        assetSymbol: finalSymbol,
        categoryClass: finalCategoryClass,
        isCustomProfile: Boolean(isCustomProfile),
        originalAmount: parsedOriginalAmount,
        originalCurrency: finalOriginalCurrency,
        baseAmountUSD: parsedBaseAmountUSD,
        quantity: finalQuantity,
        strategyNote: JSON.stringify(metadataBundle),
        workspaceId: finalWorkspaceId,
        // NO totalInvested or capitalCurrency – those columns no longer exist
      },
    });

    res.status(201).json({
      message: "Asset logged into investment vault ledger successfully!",
      asset: {
        ...asset,
        name: metadataBundle.displayName,
        icon: metadataBundle.displayIcon,
        userNote: metadataBundle.rawNote,
        history: metadataBundle.changeLog,
      },
    });
  } catch (error: unknown) {
    console.error("Create Investment Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error establishing asset vault row matching."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// FETCH WORKSPACE PORTFOLIO ASSETS
// ---------------------------------------------------------------------------
export const getWorkspaceInvestments = async (
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
        .json(buildSafeError("Workspace ID is required."));
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
    });
    if (
      !workspaceCheck ||
      workspaceCheck.userId !== userId
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    const investments = await prisma.investment.findMany({
      where: { workspaceId: targetWorkspaceId },
      orderBy: { assetSymbol: "asc" },
    });

    // Hydrate each asset by parsing its strategyNote JSON
    const hydratedInvestments = investments.map((asset) => {
      try {
        const parsed: InvestmentMetadata = JSON.parse(
          asset.strategyNote || "{}"
        );
        return {
          ...asset,
          name: parsed.displayName || `${asset.assetSymbol} Position`,
          icon: parsed.displayIcon || "📦",
          userNote: parsed.rawNote || "",
          history: parsed.changeLog || [],
        };
      } catch {
        // If JSON parsing fails, treat strategyNote as a plain string
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
    console.error("Fetch Investments Controller Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error."));
  }
};

// ---------------------------------------------------------------------------
// UPDATE INVESTMENT ASSET (exact replacement of metadata)
// ---------------------------------------------------------------------------
export const updateInvestmentAsset = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const assetId = req.params.id
      ? String(req.params.id)
      : undefined;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    if (!assetId) {
      res
        .status(400)
        .json(buildSafeError("Asset ID is required."));
      return;
    }

    const body = req.body as Record<string, unknown>;
    const {
      assetSymbol,
      categoryClass,
      isCustomProfile,
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      totalInvested,      // legacy – accepted but not written
      capitalCurrency,    // legacy – accepted but not written
      quantity,
      strategyNote,
    } = body;

    // ----- Verify asset ownership -----
    const existingAsset = await prisma.investment.findUnique({
      where: { id: assetId },
      include: { workspace: true },
    });

    if (!existingAsset) {
      res
        .status(404)
        .json(buildSafeError("Investment asset not found."));
      return;
    }

    if (existingAsset.workspace.userId !== userId) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    // ----- Build update payload dynamically -----
    const updateData: Record<string, unknown> = {};

    if (assetSymbol !== undefined) {
      updateData.assetSymbol = String(assetSymbol).trim().toUpperCase();
    }
    if (categoryClass !== undefined) {
      updateData.categoryClass = String(categoryClass).trim();
    }
    if (isCustomProfile !== undefined) {
      updateData.isCustomProfile = Boolean(isCustomProfile);
    }

    if (quantity !== undefined) {
      const parsedQuantity =
        typeof quantity === "number"
          ? quantity
          : parseFloat(String(quantity)) || 0;
      updateData.quantity = parsedQuantity;
    }

    // Amount fields – prefer the new enterprise names, fallback to legacy
    const rawAmount =
      originalAmount !== undefined ? originalAmount : totalInvested;
    if (rawAmount !== undefined) {
      const finalOriginal =
        typeof rawAmount === "number"
          ? rawAmount
          : parseFloat(String(rawAmount)) || 0;
      updateData.originalAmount = finalOriginal;
    }

    const finalCurrency = originalCurrency ?? capitalCurrency;
    if (finalCurrency !== undefined) {
      updateData.originalCurrency = String(finalCurrency)
        .trim()
        .toUpperCase();
    }

    if (baseAmountUSD !== undefined) {
      updateData.baseAmountUSD =
        typeof baseAmountUSD === "number"
          ? baseAmountUSD
          : parseFloat(String(baseAmountUSD)) || 0;
    }

    // Strategy note – store it exactly as received
    if (strategyNote !== undefined) {
      updateData.strategyNote =
        typeof strategyNote === "string"
          ? strategyNote
          : JSON.stringify(strategyNote);
    }

    // ----- Execute update -----
    const updatedAsset = await prisma.investment.update({
      where: { id: assetId },
      data: updateData,
    });

    // Parse the strategyNote for a clean response
    let responseMeta: InvestmentMetadata = {
      displayName: updatedAsset.assetSymbol,
      displayIcon: "📦",
      rawNote: "",
      changeLog: [],
    };
    try {
      const parsed: unknown = JSON.parse(
        updatedAsset.strategyNote || "{}"
      );
      if (parsed && typeof parsed === "object") {
        const meta = parsed as InvestmentMetadata;
        responseMeta = {
          displayName:
            meta.displayName || updatedAsset.assetSymbol,
          displayIcon: meta.displayIcon || "📦",
          rawNote: meta.rawNote || "",
          changeLog: meta.changeLog || [],
        };
      }
    } catch {
      // If parsing fails, use safe defaults
    }

    res.status(200).json({
      message: "Asset updated successfully!",
      asset: {
        ...updatedAsset,
        name: responseMeta.displayName,
        icon: responseMeta.displayIcon,
        userNote: responseMeta.rawNote,
        history: responseMeta.changeLog,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Update Investment Controller Error:",
      error
    );
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error while updating asset."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// DELETE INVESTMENT ASSET
// ---------------------------------------------------------------------------
export const deleteInvestmentAsset = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id
      ? String(req.params.id)
      : undefined;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    if (!targetId) {
      res
        .status(400)
        .json(buildSafeError("Asset ID is missing."));
      return;
    }

    const assetTarget = await prisma.investment.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (
      !assetTarget ||
      assetTarget.workspace.userId !== userId
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    await prisma.investment.delete({ where: { id: targetId } });

    res
      .status(200)
      .json({ message: "Asset removed successfully." });
  } catch (error: unknown) {
    console.error(
      "Delete Investment Controller Error:",
      error
    );
    res
      .status(500)
      .json(buildSafeError("Internal server error."));
  }
};
/* === SECTION 3 END === */