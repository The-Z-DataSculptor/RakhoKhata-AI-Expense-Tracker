// src/controllers/investmentController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";                                       // Core database client link
import { AuthenticatedRequest } from "../middleware/authMiddleware"; // Secure session tracker layout
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: LOG NEW ASSET HOLDING (WITH METADATA SERIALIZATION) ===
   ========================================================================== */
export const createInvestmentAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // Extracting fields, supporting both direct database keys and the frontend wizard payload formats
    const { 
      workspaceId,
      isCustomProfile,
      categoryClass,
      selectedType,
      customType,
      // Core numeric values
      totalInvested,
      quantity,
      quantityOwned,
      // Metadata payload elements
      name,
      symbol,
      assetSymbol,
      icon,
      currency,
      capitalCurrency,
      userNote,
      strategyNote,
      history
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session token missing." });
      return;
    }

    // Adapt variables to catch fallback pairings from the multi-step form payload
    const finalSymbol = (assetSymbol || symbol || "ASSET").trim().toUpperCase();
    const finalQuantity = parseFloat(quantity || quantityOwned || "0");
    const finalTotalInvested = parseFloat(totalInvested || "0");
    const finalWorkspaceId = workspaceId;
    
    const finalCategoryClass = (categoryClass || customType || selectedType || "Traditional").trim();
    const finalCurrency = (capitalCurrency || currency || "USD").trim().toUpperCase();

    // Validation Check
    if (!finalSymbol || !finalWorkspaceId || isNaN(finalQuantity) || isNaN(finalTotalInvested)) {
      res.status(400).json({ error: "Missing or invalid required investment tracking parameters." });
      return;
    }

    // Security Verification: Confirm that the logged-in user owns the target workspace
    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: finalWorkspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied. Action verification signature invalid." });
      return;
    }

    // ENHANCED: Bundle name, icon, and timeline nodes into a JSON payload safely inside the database note string
    const metadataBundle = {
      displayName: name || `${finalSymbol} Holding`,
      displayIcon: icon || "💰",
      rawNote: (strategyNote || userNote || "").trim(),
      changeLog: history || []
    };

    // Write the row directly to Neon Cloud
    const asset = await prisma.investment.create({
      data: {
        assetSymbol: finalSymbol,
        categoryClass: finalCategoryClass,
        isCustomProfile: isCustomProfile ?? false,
        totalInvested: finalTotalInvested,
        quantity: finalQuantity,
        capitalCurrency: finalCurrency,
        strategyNote: JSON.stringify(metadataBundle), // Serialized JSON string storage
        workspaceId: finalWorkspaceId
      }
    });

    res.status(201).json({
      message: "Asset logged into investment vault ledger successfully!",
      asset: {
        ...asset,
        // Send back cleanly parsed keys so the frontend state can read them instantly
        name: metadataBundle.displayName,
        icon: metadataBundle.displayIcon,
        userNote: metadataBundle.rawNote,
        history: metadataBundle.changeLog
      }
    });
  } catch (error) {
    console.error("Create Investment Controller Exception:", error);
    res.status(500).json({ error: "Internal server error establishing asset vault row matching." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: FETCH WORKSPACE PORTFOLIO ASSETS (WITH AUTO-UNPACK MECHANIC) ===
   ========================================================================== */
export const getWorkspaceInvestments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetWorkspaceId = req.query.workspaceId ? String(req.query.workspaceId) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session footprint missing." });
      return;
    }

    if (!targetWorkspaceId) {
      res.status(400).json({ error: "Workspace query track identifier parameter is required." });
      return;
    }

    // Security Verification: Confirm workspace ownership before extracting financial details
    const workspaceCheck = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
    if (!workspaceCheck || workspaceCheck.userId !== userId) {
      res.status(403).json({ error: "Access denied. Verification credentials invalid for this profile." });
      return;
    }

    const investments = await prisma.investment.findMany({
      where: { workspaceId: targetWorkspaceId },
      orderBy: { assetSymbol: "asc" }
    });

    // ENHANCED: Unpack the JSON metadata columns automatically on the fly before returning the response
    const hydratedInvestments = investments.map((asset) => {
      try {
        const parsed = JSON.parse(asset.strategyNote || "{}");
        return {
          ...asset,
          name: parsed.displayName || `${asset.assetSymbol} Holding`,
          icon: parsed.displayIcon || "💰",
          userNote: parsed.rawNote || "",
          history: parsed.changeLog || []
        };
      } catch {
        // Safe Fallback: If the text isn't serialized JSON structure (e.g. legacy plain strings), read it as a standard note description
        return {
          ...asset,
          name: `${asset.assetSymbol} Asset`,
          icon: "💰",
          userNote: asset.strategyNote || "",
          history: []
        };
      }
    });

    res.status(200).json({ investments: hydratedInvestments });
  } catch (error) {
    console.error("Fetch Investments Controller Error:", error);
    res.status(500).json({ error: "Internal server error while extracting vault asset registries." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: UPDATE EXISTING INVESTMENT ASSET (NEW) ===
   ========================================================================== */
export const updateInvestmentAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const assetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Session token missing." });
      return;
    }

    if (!assetId) {
      res.status(400).json({ error: "Asset ID parameter is required." });
      return;
    }

    // Extract updated fields from the request body
    const {
      assetSymbol,
      categoryClass,
      isCustomProfile,
      totalInvested,
      quantity,
      capitalCurrency,
      strategyNote,
      workspaceId
    } = req.body;

    // Verify the asset exists and belongs to a workspace owned by this user
    const existingAsset = await prisma.investment.findUnique({
      where: { id: assetId },
      include: { workspace: true }
    });

    if (!existingAsset) {
      res.status(404).json({ error: "Investment asset not found." });
      return;
    }

    if (existingAsset.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied. You do not own this asset." });
      return;
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {};

    if (assetSymbol !== undefined) updateData.assetSymbol = assetSymbol.trim().toUpperCase();
    if (categoryClass !== undefined) updateData.categoryClass = categoryClass.trim();
    if (isCustomProfile !== undefined) updateData.isCustomProfile = isCustomProfile;
    if (totalInvested !== undefined) updateData.totalInvested = parseFloat(totalInvested);
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (capitalCurrency !== undefined) updateData.capitalCurrency = capitalCurrency.trim().toUpperCase();
    if (strategyNote !== undefined) updateData.strategyNote = strategyNote;

    // Execute the update
    const updatedAsset = await prisma.investment.update({
      where: { id: assetId },
      data: updateData
    });

    // Parse the strategyNote for the response
    let parsedNote = {};
    try {
      parsedNote = JSON.parse(updatedAsset.strategyNote || "{}");
    } catch {
      parsedNote = {};
    }

    res.status(200).json({
      message: "Asset updated successfully!",
      asset: {
        ...updatedAsset,
        name: (parsedNote as any).displayName || `${updatedAsset.assetSymbol} Holding`,
        icon: (parsedNote as any).displayIcon || "💰",
        userNote: (parsedNote as any).rawNote || "",
        history: (parsedNote as any).changeLog || []
      }
    });
  } catch (error) {
    console.error("Update Investment Controller Error:", error);
    res.status(500).json({ error: "Internal server error while updating asset." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: REMOVE PORTFOLIO HOLDING ROW ===
   ========================================================================== */
export const deleteInvestmentAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.id ? String(req.params.id) : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access parameter matrix." });
      return;
    }

    if (!targetId) {
      res.status(400).json({ error: "Asset line row parameter item identifier is missing." });
      return;
    }

    // Verification Step: Confirm asset exists and lives within a workspace owned by this specific caller
    const assetTarget = await prisma.investment.findUnique({
      where: { id: targetId },
      include: { workspace: true }
    });

    if (!assetTarget) {
      res.status(404).json({ error: "The targeted investment asset record could not be found." });
      return;
    }

    if (assetTarget.workspace.userId !== userId) {
      res.status(403).json({ error: "Access denied. Asset ownership permissions validation failed." });
      return;
    }

    // Delete the row permanently from the database table instance
    await prisma.investment.delete({ where: { id: targetId } });

    res.status(200).json({ message: "Asset removed safely from vault balance calculations." });
  } catch (error) {
    console.error("Delete Investment Controller Exception:", error);
    res.status(500).json({ error: "Internal server error running vault teardown asset routines." });
  }
};
/* === SECTION 5 END === */