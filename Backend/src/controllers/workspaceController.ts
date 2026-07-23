// Backend/src/controllers/workspaceController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONFIGURATION ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { TransactionType, Prisma } from "../../prisma/generated/client";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

export interface DefaultCategoryTemplate {
  name: string;
  type: TransactionType;
  color: string;
  isFixed?: boolean;
}

interface CreateWorkspaceInput {
  name?: string;
  currency?: string;
}

interface UpdateWorkspaceInput {
  name?: string;
  currency?: string;
}

// WHY THIS FIX WAS MADE: Explicitly typed category templates with TransactionType Enum to prevent Prisma build crashes.
const UNASSIGNED_CATEGORY: DefaultCategoryTemplate = {
  name: "Unassigned (Needs Sorting)",
  type: TransactionType.EXPENSE,
  color: "#6b7280",
  isFixed: true,
};

const OTHER_CORE_SYSTEM_CATEGORIES: DefaultCategoryTemplate[] = [
  { name: "Owed to Me (Receivable)", type: TransactionType.INCOME, color: "#22c55e", isFixed: true },
  { name: "My Debts (Payable)", type: TransactionType.EXPENSE, color: "#ef4444", isFixed: true },
];

// Shared personal category templates
export const SHARED_DEFAULT_PERSONAL_CATEGORIES: DefaultCategoryTemplate[] = [
  UNASSIGNED_CATEGORY,
  { name: "Salary", type: TransactionType.INCOME, color: "#10B981" },
  { name: "Rent & Housing", type: TransactionType.EXPENSE, color: "#EF4444" },
  ...OTHER_CORE_SYSTEM_CATEGORIES,
];

// Shared business category templates
export const SHARED_DEFAULT_BUSINESS_CATEGORIES: DefaultCategoryTemplate[] = [
  UNASSIGNED_CATEGORY,
  { name: "Revenue", type: TransactionType.INCOME, color: "#10b981" },
  { name: "Payroll", type: TransactionType.EXPENSE, color: "#f43f5e" },
  ...OTHER_CORE_SYSTEM_CATEGORIES,
];

/**
 * Standardized JSON error response builder
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * WHY THIS IS NEEDED: Prevents HTTP query parameter array injection attacks.
 * Safely extracts a single string parameter from query or route parameters.
 */
function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/**
 * Returns category templates matching the workspace type.
 */
function getCategoryTemplates(workspaceName: string): DefaultCategoryTemplate[] {
  const isBusiness = workspaceName.toLowerCase().trim() === "business";
  return isBusiness
    ? SHARED_DEFAULT_BUSINESS_CATEGORIES
    : SHARED_DEFAULT_PERSONAL_CATEGORIES;
}

/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * GET /api/workspaces
 * Returns all workspaces owned by the user. Auto-initializes default workspaces atomically if none exist.
 */
export const getUserWorkspaces = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    // 1. Query existing workspaces for user
    let workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // 2. If no workspaces exist, initialize default "Personal" and "Business" workspaces atomically
    if (workspaces.length === 0) {
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      });
      const preferredCurrency = userProfile?.currency || "PKR";

      // WHY THIS FIX WAS MADE: Wraps workspace creation + category seeding inside a single atomic transaction
      // to eliminate race conditions and prevent partial workspace creation failures.
      workspaces = await prisma.$transaction(async (tx) => {
        // Re-check inside transaction to prevent concurrent duplicate workspace creation
        const doubleCheck = await tx.workspace.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });

        if (doubleCheck.length > 0) {
          return doubleCheck;
        }

        const personalTemplates = getCategoryTemplates("Personal");
        const businessTemplates = getCategoryTemplates("Business");

        await tx.workspace.create({
          data: {
            name: "Personal",
            currency: preferredCurrency,
            userId,
            categories: {
              create: personalTemplates.map((cat) => ({
                name: cat.name,
                type: cat.type,
                color: cat.color,
                isFixed: Boolean(cat.isFixed),
              })),
            },
          },
        });

        await tx.workspace.create({
          data: {
            name: "Business",
            currency: preferredCurrency,
            userId,
            categories: {
              create: businessTemplates.map((cat) => ({
                name: cat.name,
                type: cat.type,
                color: cat.color,
                isFixed: Boolean(cat.isFixed),
              })),
            },
          },
        });

        return await tx.workspace.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
      });
    }

    res.status(200).json({ workspaces });
  } catch (error: unknown) {
    console.error("Fetch Workspaces Error:", error);
    res.status(500).json(buildErrorResponse("Unable to retrieve workspace data."));
  }
};

/**
 * POST /api/workspaces
 * Creates a new custom workspace for the user and seeds default categories atomically.
 */
export const createWorkspace = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const body = req.body as CreateWorkspaceInput;
    const sanitizedName = extractSingleString(body.name);
    const rawCurrency = extractSingleString(body.currency) || "PKR";
    const sanitizedCurrency = rawCurrency.toUpperCase();

    if (!sanitizedName) {
      res.status(400).json(buildErrorResponse("Workspace name is required."));
      return;
    }

    const categoryTemplates = getCategoryTemplates(sanitizedName);

    // WHY THIS FIX WAS MADE: Uses nested Prisma relational writes to atomically create workspace and categories in one DB query.
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: sanitizedName,
        currency: sanitizedCurrency,
        userId,
        categories: {
          create: categoryTemplates.map((cat) => ({
            name: cat.name,
            type: cat.type,
            color: cat.color,
            isFixed: Boolean(cat.isFixed),
          })),
        },
      },
      include: {
        categories: true,
      },
    });

    res.status(201).json({
      message: "Workspace created and seeded successfully!",
      workspace: newWorkspace,
    });
  } catch (error: unknown) {
    console.error("Create Workspace Error:", error);
    res.status(500).json(buildErrorResponse("Failed to create workspace."));
  }
};

/**
 * DELETE /api/workspaces/:id
 * Permanently deletes a workspace after verifying user ownership.
 */
export const deleteWorkspace = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!workspaceId) {
      res.status(400).json(buildErrorResponse("Workspace ID parameter is required."));
      return;
    }

    // WHY THIS FIX WAS MADE: Verifies user ownership before deleting to prevent BOLA/IDOR security breaches.
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied or workspace not found."));
      return;
    }

    // Cascade deletion of categories/transactions handled by Prisma schema onDelete: Cascade
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    res.status(200).json({ message: "Workspace deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete Workspace Error:", error);
    res.status(500).json(buildErrorResponse("Failed to delete workspace."));
  }
};

/**
 * PUT /api/workspaces/:id
 * Updates workspace name or currency after verifying ownership.
 */
export const updateWorkspace = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = extractSingleString(req.params.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!workspaceId) {
      res.status(400).json(buildErrorResponse("Workspace ID parameter is required."));
      return;
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied or workspace not found."));
      return;
    }

    const body = req.body as UpdateWorkspaceInput;
    const updateData: Prisma.WorkspaceUpdateInput = {};

    // Validate name if supplied
    if (body.name !== undefined) {
      const trimmedName = String(body.name).trim();
      if (!trimmedName) {
        res.status(400).json(buildErrorResponse("Workspace name cannot be empty."));
        return;
      }
      updateData.name = trimmedName;
    }

    // Validate currency if supplied
    if (body.currency !== undefined) {
      const trimmedCurrency = String(body.currency).trim().toUpperCase();
      if (!trimmedCurrency) {
        res.status(400).json(buildErrorResponse("Workspace currency cannot be empty."));
        return;
      }
      updateData.currency = trimmedCurrency;
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    res.status(200).json({
      message: "Workspace updated successfully.",
      workspace: updatedWorkspace,
    });
  } catch (error: unknown) {
    console.error("Update Workspace Error:", error);
    res.status(500).json(buildErrorResponse("Failed to update workspace."));
  }
};

/* === SECTION 3 END === */