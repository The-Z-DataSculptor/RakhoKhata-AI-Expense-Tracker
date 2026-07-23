// Backend/src/controllers/categoryController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONFIGURATION ===
   ========================================================================== */
import { Response as ExpressResponse } from "express";
import { Prisma } from "../../prisma/generated";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// ------------------------------------------------------------------
// Canonical "Unassigned" names – single source of truth for this file
// (Extract to a shared constants file if you prefer)
const UNASSIGNED_CATEGORY_NAME = "Unassigned (Needs Sorting)";
const LEGACY_UNASSIGNED_NAME = "Unassigned";
// ------------------------------------------------------------------

// Core system categories locked from editing or deletion
const IMMUTABLE_SYSTEM_CATEGORIES = [
  "owed to me (receivable)",
  "my debts (payable)",
  UNASSIGNED_CATEGORY_NAME.toLowerCase().trim(),
  LEGACY_UNASSIGNED_NAME.toLowerCase().trim(),
];

// Hex color validation pattern
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & TYPES ===
   ========================================================================== */

interface CreateCategoryInput {
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string;
  workspaceId: string;
  isRecurring?: boolean;
  frequency?: string;
  dueDay?: number;
  reminderDays?: number;
}

interface UpdateCategoryInput {
  name?: string;
  type?: "INCOME" | "EXPENSE";
  color?: string;
  isRecurring?: boolean;
  frequency?: string | null;
  dueDay?: number | null;
  reminderDays?: number | null;
}

/**
 * Standardized JSON error response builder
 */
function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

/**
 * Safely extracts a single string parameter from query/route params.
 */
function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/**
 * Checks whether a category name matches a protected system category.
 */
function isSystemCategory(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  return IMMUTABLE_SYSTEM_CATEGORIES.some(
    (sysCat) => normalized === sysCat
  );
}

/* ==========================================================================
   === SECTION 3: CONTROLLER HANDLERS ===
   ========================================================================== */

/**
 * GET /api/categories?workspaceId=...
 * Fetches all categories for a workspace, pinning the unassigned category
 * ("Unassigned (Needs Sorting)" or legacy "Unassigned") to the top.
 */
export const getWorkspaceCategories = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const workspaceId = extractSingleString(req.query.workspaceId);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!workspaceId) {
      res.status(400).json(buildErrorResponse("Workspace ID query parameter is required."));
      return;
    }

    // 1. Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied to specified workspace."));
      return;
    }

    // 2. Fetch categories ordered alphabetically
    const categories = await prisma.category.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });

    // Helper: check if a category name matches the unassigned bucket(s)
    const isUnassignedCategory = (catName: string): boolean => {
      const normalized = catName.toLowerCase().trim();
      return (
        normalized === UNASSIGNED_CATEGORY_NAME.toLowerCase().trim() ||
        normalized === LEGACY_UNASSIGNED_NAME.toLowerCase().trim()
      );
    };

    // 3. Pin "Unassigned (Needs Sorting)" (or legacy "Unassigned") to the top
    const sortedCategories = [...categories].sort((a, b) => {
      const aIsUnassigned = isUnassignedCategory(a.name);
      const bIsUnassigned = isUnassignedCategory(b.name);

      if (aIsUnassigned && !bIsUnassigned) return -1;
      if (!aIsUnassigned && bIsUnassigned) return 1;

      // Otherwise sort alphabetically
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({ categories: sortedCategories });
  } catch (error: unknown) {
    console.error("Get Categories Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error fetching categories."));
  }
};

/**
 * POST /api/categories
 * Creates a custom financial category inside a user's workspace.
 */
export const createCategory = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    const {
      name,
      type,
      color,
      workspaceId,
      isRecurring,
      frequency,
      dueDay,
      reminderDays,
    } = req.body as CreateCategoryInput;

    const sanitizedWorkspaceId = extractSingleString(workspaceId);
    const trimmedName = extractSingleString(name);

    if (!trimmedName || !type || !sanitizedWorkspaceId) {
      res.status(400).json(buildErrorResponse("Category name, type, and workspace ID are required."));
      return;
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      res.status(400).json(buildErrorResponse("Category type must be strictly 'INCOME' or 'EXPENSE'."));
      return;
    }

    let validColor = "#7E7A9C";
    if (color !== undefined) {
      const trimmedColor = String(color).trim();
      if (!HEX_COLOR_REGEX.test(trimmedColor)) {
        res.status(400).json(buildErrorResponse("Color must be a valid hex code (e.g., #FF5733)."));
        return;
      }
      validColor = trimmedColor;
    }

    if (isSystemCategory(trimmedName)) {
      res.status(400).json(buildErrorResponse(`The category name "${trimmedName}" is reserved by the system.`));
      return;
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: sanitizedWorkspaceId, userId },
      select: { id: true },
    });

    if (!workspace) {
      res.status(403).json(buildErrorResponse("Access denied to specified workspace."));
      return;
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        workspaceId: sanitizedWorkspaceId,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existingCategory) {
      res.status(400).json(buildErrorResponse(`A category named "${trimmedName}" already exists in this workspace.`));
      return;
    }

    let parsedDueDay: number | null = null;
    if (dueDay !== undefined && dueDay !== null) {
      const num = Number(dueDay);
      if (isNaN(num) || num < 1 || num > 31) {
        res.status(400).json(buildErrorResponse("Due day must be a valid calendar day between 1 and 31."));
        return;
      }
      parsedDueDay = num;
    }

    let parsedReminderDays: number | null = null;
    if (reminderDays !== undefined && reminderDays !== null) {
      const num = Number(reminderDays);
      if (isNaN(num) || num < 0 || num > 30) {
        res.status(400).json(buildErrorResponse("Reminder days must be between 0 and 30."));
        return;
      }
      parsedReminderDays = num;
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        type,
        color: validColor,
        workspaceId: sanitizedWorkspaceId,
        isRecurring: Boolean(isRecurring),
        frequency: frequency ? String(frequency).trim() : null,
        dueDay: parsedDueDay,
        reminderDays: parsedReminderDays,
      },
    });

    res.status(201).json({
      message: "Category created successfully!",
      category,
    });
  } catch (error: unknown) {
    console.error("Create Category Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error creating category."));
  }
};

/**
 * PUT /api/categories/:id
 * Updates an existing category after checking ownership and preventing duplicate names.
 */
export const updateCategory = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = extractSingleString(req.params.id || req.params.categoryId || req.query.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildErrorResponse("Category ID parameter is required."));
      return;
    }

    const { name, type, color, isRecurring, frequency, dueDay, reminderDays } =
      req.body as UpdateCategoryInput;

    const targetCategory = await prisma.category.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!targetCategory || targetCategory.workspace.userId !== userId) {
      res.status(403).json(buildErrorResponse("Access denied or category not found."));
      return;
    }

    if (isSystemCategory(targetCategory.name)) {
      res.status(400).json(buildErrorResponse(`The system category "${targetCategory.name}" is locked and cannot be modified.`));
      return;
    }

    const updatePayload: Prisma.CategoryUpdateInput = {};

    if (name !== undefined && name !== null) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        res.status(400).json(buildErrorResponse("Category name cannot be empty."));
        return;
      }

      if (isSystemCategory(trimmedName)) {
        res.status(400).json(buildErrorResponse(`Cannot rename category to "${trimmedName}" because it is a reserved system title.`));
        return;
      }

      const duplicateCategory = await prisma.category.findFirst({
        where: {
          workspaceId: targetCategory.workspaceId,
          id: { not: targetId },
          name: { equals: trimmedName, mode: "insensitive" },
        },
      });

      if (duplicateCategory) {
        res.status(400).json(buildErrorResponse(`A category named "${trimmedName}" already exists in this workspace.`));
        return;
      }

      updatePayload.name = trimmedName;
    }

    if (type !== undefined && type !== null) {
      if (type !== "INCOME" && type !== "EXPENSE") {
        res.status(400).json(buildErrorResponse("Category type must be strictly 'INCOME' or 'EXPENSE'."));
        return;
      }
      updatePayload.type = type;
    }

    if (color !== undefined && color !== null) {
      const trimmedColor = String(color).trim();
      if (!HEX_COLOR_REGEX.test(trimmedColor)) {
        res.status(400).json(buildErrorResponse("Color must be a valid hex code (e.g., #FF5733)."));
        return;
      }
      updatePayload.color = trimmedColor;
    }

    if (isRecurring !== undefined && isRecurring !== null) {
      updatePayload.isRecurring = Boolean(isRecurring);
    }

    if (frequency !== undefined) {
      updatePayload.frequency = frequency === null ? null : String(frequency).trim();
    }

    if (dueDay !== undefined) {
      if (dueDay === null) {
        updatePayload.dueDay = null;
      } else {
        const num = Number(dueDay);
        if (isNaN(num) || num < 1 || num > 31) {
          res.status(400).json(buildErrorResponse("Due day must be between 1 and 31."));
          return;
        }
        updatePayload.dueDay = num;
      }
    }

    if (reminderDays !== undefined) {
      if (reminderDays === null) {
        updatePayload.reminderDays = null;
      } else {
        const num = Number(reminderDays);
        if (isNaN(num) || num < 0 || num > 30) {
          res.status(400).json(buildErrorResponse("Reminder days must be between 0 and 30."));
          return;
        }
        updatePayload.reminderDays = num;
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: targetId },
      data: updatePayload,
    });

    res.status(200).json({
      message: "Category updated successfully.",
      category: updatedCategory,
    });
  } catch (error: unknown) {
    console.error("Update Category Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error updating category."));
  }
};

/**
 * DELETE /api/categories/:id
 * Safely deletes a category after reassigning all linked transactions to the
 * correct "Unassigned (Needs Sorting)" category.
 */
export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetId = extractSingleString(req.params.id || req.params.categoryId || req.query.id);

    if (!userId) {
      res.status(401).json(buildErrorResponse("Authentication required."));
      return;
    }

    if (!targetId) {
      res.status(400).json(buildErrorResponse("Category ID parameter is required."));
      return;
    }

    // 1. Fetch category and verify workspace ownership
    const categoryTarget = await prisma.category.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!categoryTarget || categoryTarget.workspace.userId !== userId) {
      res.status(403).json(buildErrorResponse("Access denied or category not found."));
      return;
    }

    // 2. Prevent deletion of locked system categories
    if (isSystemCategory(categoryTarget.name)) {
      res.status(400).json(buildErrorResponse(`The system category "${categoryTarget.name}" is permanent and cannot be deleted.`));
      return;
    }

    // 3. Atomically find the *real* unassigned category, reassign transactions, and delete custom category
    await prisma.$transaction(async (tx) => {
      // Search for both the current and legacy unassigned names (backward compatible)
      const unassignedCategory = await tx.category.findFirst({
        where: {
          workspaceId: categoryTarget.workspaceId,
          OR: [
            { name: { equals: UNASSIGNED_CATEGORY_NAME, mode: "insensitive" } },
            { name: { equals: LEGACY_UNASSIGNED_NAME, mode: "insensitive" } },
          ],
        },
      });

      const fallbackCategoryId =
        unassignedCategory && unassignedCategory.id !== targetId
          ? unassignedCategory.id
          : null;

      // Reassign transactions to the found unassigned category
      await tx.transaction.updateMany({
        where: { categoryId: targetId },
        data: { categoryId: fallbackCategoryId },
      });

      // Delete the target custom category
      await tx.category.delete({
        where: { id: targetId },
      });
    });

    res.status(200).json({
      message: "Category deleted successfully. Linked transactions were safely reassigned to 'Unassigned (Needs Sorting)'.",
    });
  } catch (error: unknown) {
    console.error("Delete Category Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error deleting category."));
  }
};