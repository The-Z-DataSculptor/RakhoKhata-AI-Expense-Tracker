// Backend/src/controllers/workspaceController.ts

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

// System categories that are automatically created for every workspace
const CORE_SYSTEM_CATEGORIES = [
  { name: "Owed to Me (Receivable)", type: "INCOME", color: "#22c55e", isFixed: true },
  { name: "My Debts (Payable)", type: "EXPENSE", color: "#ef4444", isFixed: true },
  { name: "Unassigned (Needs Sorting)", type: "EXPENSE", color: "#6b7280", isFixed: true },
];

// Shared personal category templates
export const SHARED_DEFAULT_PERSONAL_CATEGORIES = [
  { name: "Salary", type: "INCOME", color: "#10B981" },
  { name: "Rent & Housing", type: "EXPENSE", color: "#EF4444" },
  ...CORE_SYSTEM_CATEGORIES,
];

// Shared business category templates
export const SHARED_DEFAULT_BUSINESS_CATEGORIES = [
  { name: "Revenue", type: "INCOME", color: "#10b981" },
  { name: "Payroll", type: "EXPENSE", color: "#f43f5e" },
  ...CORE_SYSTEM_CATEGORIES,
];

/**
 * Builds a safe error object that never leaks internal details.
 */
function safeError(message: string): { error: string } {
  return { error: message };
}

/**
 * Seeds a newly created workspace with the appropriate default categories.
 */
async function seedDefaultCategories(
  workspaceId: string,
  workspaceName: string
): Promise<void> {
  const isBusiness = workspaceName.toLowerCase() === "business";
  const templateCategories = isBusiness
    ? SHARED_DEFAULT_BUSINESS_CATEGORIES
    : SHARED_DEFAULT_PERSONAL_CATEGORIES;

  const categoriesWithWorkspace = templateCategories.map((cat) => ({
    ...cat,
    workspaceId,
  }));

  await prisma.category.createMany({
    data: categoriesWithWorkspace,
  });
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * GET /api/workspaces
 * Returns all workspaces owned by the authenticated user.
 * If no workspaces exist, creates default "Personal" and "Business" workspaces.
 */
export const getUserWorkspaces = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    let workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // If the user has no workspaces, create the two defaults
    if (workspaces.length === 0) {
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      });
      const preferredCurrency = userProfile?.currency || "PKR";

      const personalWorkspace = await prisma.workspace.create({
        data: { name: "Personal", currency: preferredCurrency, userId },
      });
      await seedDefaultCategories(
        personalWorkspace.id,
        "Personal"
      );

      const businessWorkspace = await prisma.workspace.create({
        data: { name: "Business", currency: preferredCurrency, userId },
      });
      await seedDefaultCategories(
        businessWorkspace.id,
        "Business"
      );

      // Re‑fetch the list to include the new workspaces
      workspaces = await prisma.workspace.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    res.status(200).json({ workspaces });
  } catch (error: unknown) {
    console.error(
      "Fetch Workspaces Controller Exception:",
      error
    );
    res
      .status(500)
      .json(safeError("Unable to retrieve workspace data."));
  }
};

/**
 * POST /api/workspaces
 * Creates a new custom workspace for the user.
 */
export const createWorkspace = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }

    const { name, currency } = req.body as {
      name?: string;
      currency?: string;
    };

    if (!name || !name.trim()) {
      res.status(400).json(safeError("Workspace name is required."));
      return;
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        currency: currency || "PKR",
        userId,
      },
    });

    await seedDefaultCategories(newWorkspace.id, newWorkspace.name);

    res.status(201).json({
      message: "Workspace created and seeded successfully!",
      workspace: newWorkspace,
    });
  } catch (error: unknown) {
    console.error(
      "Create Workspace Controller Exception:",
      error
    );
    res
      .status(500)
      .json(safeError("Failed to create workspace."));
  }
};

/**
 * DELETE /api/workspaces/:id
 * Permanently deletes a workspace and all its related data.
 */
export const deleteWorkspace = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;

    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }
    if (!workspaceId) {
      res.status(400).json(safeError("Workspace ID is required."));
      return;
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace || workspace.userId !== userId) {
      res.status(403).json(safeError("Access denied."));
      return;
    }

    // Cascade deletion is handled at the database level
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    res
      .status(200)
      .json({ message: "Workspace deleted successfully." });
  } catch (error: unknown) {
    console.error(
      "Delete Workspace Controller Exception:",
      error
    );
    res
      .status(500)
      .json(safeError("Failed to delete workspace."));
  }
};

/**
 * PUT /api/workspaces/:id
 * Updates the name or currency of an existing workspace.
 */
export const updateWorkspace = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;

    if (!userId) {
      res.status(401).json(safeError("Authentication required."));
      return;
    }
    if (!workspaceId) {
      res.status(400).json(safeError("Workspace ID is required."));
      return;
    }

    // Verify ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace || workspace.userId !== userId) {
      res.status(403).json(safeError("Access denied."));
      return;
    }

    const { name, currency } = req.body as {
      name?: string;
      currency?: string;
    };

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name.trim();
    if (currency) updateData.currency = currency;

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    res.status(200).json({
      message: "Workspace updated successfully.",
      workspace: updatedWorkspace,
    });
  } catch (error: unknown) {
    console.error(
      "Update Workspace Controller Exception:",
      error
    );
    res
      .status(500)
      .json(safeError("Failed to update workspace."));
  }
};
/* === SECTION 3 END === */