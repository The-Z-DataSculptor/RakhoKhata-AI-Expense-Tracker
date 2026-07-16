// src/controllers/investmentController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CREATE INVESTMENT ASSET (NO LEGACY COLUMNS) ===
   ========================================================================== */
export const createInvestmentAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const {
      workspaceId,
      isCustomProfile,
      categoryClass,
      selectedType,
      customType,
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      totalInvested,      // accepted but ignored in DB
      capitalCurrency,    // accepted but ignored in DB
      quantity,
      quantityOwned,
      name,
      symbol,
      assetSymbol,
      icon,
      userNote,
      strategyNote,
      history,
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    const finalSymbol = String(assetSymbol || symbol || "ASSET").trim().toUpperCase();
    const finalWorkspaceId = String(workspaceId);
    const finalCategoryClass = String(categoryClass || customType || selectedType || "Traditional").trim();

    // Parse amounts safely
    const rawAmount = originalAmount ?? totalInvested ?? 0;
    const parsedOriginalAmount = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount)) || 0;

    const rawUSD = baseAmountUSD ?? totalInvested ?? 0;
    const parsedBaseAmountUSD = typeof rawUSD === "number" ? rawUSD : parseFloat(String(rawUSD)) || 0;

    const rawQty = quantity || quantityOwned || 0;
    const finalQuantity = typeof rawQty === "number" ? rawQty : parseFloat(String(rawQty)) || 0;

    const finalOriginalCurrency = String(originalCurrency || capitalCurrency || "USD").trim().toUpperCase();

    if (!finalSymbol || !finalWorkspaceId || isNaN(finalQuantity) || isNaN(parsedOriginalAmount)) {
      res.status(400).json({ error: "Missing or invalid parameters." });
      return;
    }

    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: finalWorkspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    // Build metadata (name, note, icon, history)
    let finalDisplayName = name ? String(name) : "";
    let finalRawNote = "";
    let finalHistory = history || [];

    if (strategyNote) {
      try {
        const parsedNode = typeof strategyNote === "string" ? JSON.parse(strategyNote) : strategyNote;
        if (parsedNode && typeof parsedNode === "object") {
          if (parsedNode.displayName) finalDisplayName = String(parsedNode.displayName);
          if (parsedNode.rawNote) finalRawNote = String(parsedNode.rawNote);
          if (parsedNode.changeLog) finalHistory = parsedNode.changeLog;
        }
      } catch {
        finalRawNote = String(strategyNote);
      }
    } else if (userNote) {
      finalRawNote = String(userNote);
    }

    const metadataBundle = {
      displayName: finalDisplayName,
      displayIcon: icon || "📦",
      rawNote: finalRawNote,
      changeLog: finalHistory,
    };

    // CREATE – only permanent columns
    const asset = await prisma.investment.create({
      data: {
        assetSymbol: finalSymbol,
        categoryClass: finalCategoryClass,
        isCustomProfile: isCustomProfile ?? false,
        originalAmount: parsedOriginalAmount,
        originalCurrency: finalOriginalCurrency,
        baseAmountUSD: parsedBaseAmountUSD,
        quantity: finalQuantity,
        strategyNote: JSON.stringify(metadataBundle),
        workspaceId: finalWorkspaceId,
        // NO totalInvested or capitalCurrency
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
  } catch (error) {
    console.error("Create Investment Controller Exception:", error);
    res.status(500).json({ error: "Internal server error establishing asset vault row matching." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FETCH WORKSPACE PORTFOLIO ASSETS ===
   ========================================================================== */
export const getWorkspaceInvestments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const investments = await prisma.investment.findMany({
      where: { workspaceId: targetWorkspaceId },
      orderBy: { assetSymbol: "asc" },
    });

    const hydratedInvestments = investments.map((asset) => {
      try {
        const parsed = JSON.parse(asset.strategyNote || "{}");
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
  } catch (error) {
    console.error("Fetch Investments Controller Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: UPDATE INVESTMENT ASSET (EXACT REPLACEMENT OF METADATA) ===
   ========================================================================== */
export const updateInvestmentAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const assetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!assetId) {
      res.status(400).json({ error: "Asset ID is required." });
      return;
    }

    const {
      assetSymbol,
      categoryClass,
      isCustomProfile,
      originalAmount,
      originalCurrency,
      baseAmountUSD,
      totalInvested,      // accepted but ignored
      capitalCurrency,    // accepted but ignored
      quantity,
      strategyNote,       // the full JSON string from the form
    } = req.body;

    const existingAsset = await prisma.investment.findUnique({
      where: { id: assetId },
      include: { workspace: true },
    });

    if (!existingAsset) {
      res.status(404).json({ error: "Investment asset not found." });
      return;
    }

    if (existingAsset.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const updateData: Record<string, unknown> = {};

    if (assetSymbol !== undefined) updateData.assetSymbol = assetSymbol.trim().toUpperCase();
    if (categoryClass !== undefined) updateData.categoryClass = categoryClass.trim();
    if (isCustomProfile !== undefined) updateData.isCustomProfile = isCustomProfile;

    if (quantity !== undefined) {
      updateData.quantity = typeof quantity === "number" ? quantity : parseFloat(String(quantity)) || 0;
    }

    // Amounts – only update if provided
    const rawAmount = originalAmount !== undefined ? originalAmount : totalInvested;
    if (rawAmount !== undefined) {
      const finalOriginal = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount)) || 0;
      updateData.originalAmount = finalOriginal;
    }

    const finalCurrency = originalCurrency ?? capitalCurrency;
    if (finalCurrency !== undefined) {
      updateData.originalCurrency = finalCurrency.trim().toUpperCase();
    }

    if (baseAmountUSD !== undefined) {
      updateData.baseAmountUSD = typeof baseAmountUSD === "number" ? baseAmountUSD : parseFloat(String(baseAmountUSD)) || 0;
    }

    // ✅ CRITICAL FIX: If strategyNote is provided, store it EXACTLY as received.
    // The frontend sends a complete JSON string – no merging with old data.
    if (strategyNote !== undefined) {
      updateData.strategyNote = typeof strategyNote === "string" ? strategyNote : JSON.stringify(strategyNote);
    }

    const updatedAsset = await prisma.investment.update({
      where: { id: assetId },
      data: updateData,
    });

    // Parse the strategyNote for the response
    let responseMeta = { name: updatedAsset.assetSymbol, icon: "📦", userNote: "", history: [] };
    try {
      const parsed = JSON.parse(updatedAsset.strategyNote || "{}");
      responseMeta = {
        name: parsed.displayName || updatedAsset.assetSymbol,
        icon: parsed.displayIcon || "📦",
        userNote: parsed.rawNote || "",
        history: parsed.changeLog || [],
      };
    } catch {}

    res.status(200).json({
      message: "Asset updated successfully!",
      asset: {
        ...updatedAsset,
        name: responseMeta.name,
        icon: responseMeta.icon,
        userNote: responseMeta.userNote,
        history: responseMeta.history,
      },
    });
  } catch (error) {
    console.error("Update Investment Controller Error:", error);
    res.status(500).json({ error: "Internal server error while updating asset." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: DELETE INVESTMENT ASSET ===
   ========================================================================== */
export const deleteInvestmentAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Asset ID is missing." });
      return;
    }

    const assetTarget = await prisma.investment.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!assetTarget || assetTarget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    await prisma.investment.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Asset removed successfully." });
  } catch (error) {
    console.error("Delete Investment Controller Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
/* === SECTION 5 END === */