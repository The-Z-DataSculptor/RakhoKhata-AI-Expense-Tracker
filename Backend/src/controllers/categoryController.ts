// Backend/src/controllers/categoryController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Response } from "express";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// List of system‑defined categories that cannot be modified or deleted
const IMMUTABLE_SYSTEM_CATEGORIES = [
  "owed to me (receivable)",
  "my debts (payable)",
  "unassigned",
];
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/**
 * Helper that returns a safe error object to prevent information leakage.
 */
function buildSafeError(message: string): { error: string } {
  return { error: message };
}

/**
 * Checks whether a given category name (case‑insensitive) is a protected system category.
 */
function isSystemCategory(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  return IMMUTABLE_SYSTEM_CATEGORIES.some((sysCat) =>
    normalized.includes(sysCat)
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

// ---------------------------------------------------------------------------
// GET WORKSPACE CATEGORIES
// ---------------------------------------------------------------------------
export const getWorkspaceCategories = async (
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
        .json(buildSafeError("Workspace query parameter is required."));
      return;
    }

    // Ownership verification
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
    });
    if (
      !workspaceCheck ||
      String(workspaceCheck.userId) !== String(userId)
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    // Retrieve database categories
    const categories = await prisma.category.findMany({
      where: { workspaceId: targetWorkspaceId },
      orderBy: { name: "asc" },
    });

    // 🚀 Custom Pin Sorting: Forces "Unassigned" to Index 0, alphabetizes the rest
    const sortedCategories = [...categories].sort((a, b) => {
      const aIsUnassigned = a.name.toLowerCase().includes("unassigned");
      const bIsUnassigned = b.name.toLowerCase().includes("unassigned");

      if (aIsUnassigned && !bIsUnassigned) return -1;
      if (!aIsUnassigned && bIsUnassigned) return 1;

      return a.name.localeCompare(b.name);
    });

    res.status(200).json({ categories: sortedCategories });
  } catch (error: unknown) {
    console.error("Fetch Categories Controller Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error while retrieving categories."));
  }
};

// ---------------------------------------------------------------------------
// CREATE CATEGORY
// ---------------------------------------------------------------------------
export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      name,
      type,
      color,
      workspaceId,
      isRecurring,
      frequency,
      dueDay,
      reminderDays,
    } = req.body as Record<string, unknown>;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }

    if (!name || !String(name).trim() || !type || !workspaceId) {
      res
        .status(400)
        .json(buildSafeError("Missing required category parameters."));
      return;
    }

    if (
      type !== "INCOME" &&
      type !== "EXPENSE" &&
      type !== "BOTH"
    ) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Allocation mapping must be strictly INCOME, EXPENSE, or BOTH."
          )
        );
      return;
    }

    // Prevent creation of a category that mimics a system category
    if (isSystemCategory(String(name))) {
      res
        .status(400)
        .json(
          buildSafeError(
            `The category name "${String(name).trim()}" is reserved for system operations.`
          )
        );
      return;
    }

    // Workspace ownership check
    const workspaceCheck = await prisma.workspace.findUnique({
      where: { id: String(workspaceId) },
    });
    if (
      !workspaceCheck ||
      String(workspaceCheck.userId) !== String(userId)
    ) {
      res.status(403).json(buildSafeError("Access denied."));
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        type: String(type),
        color: color ? String(color) : "#7E7A9C",
        workspaceId: String(workspaceId),
        isRecurring: Boolean(isRecurring),
        frequency: frequency ? String(frequency) : null,
        dueDay:
          dueDay !== undefined && dueDay !== null
            ? Number(dueDay)
            : null,
        reminderDays:
          reminderDays !== undefined && reminderDays !== null
            ? Number(reminderDays)
            : null,
      },
    });

    res.status(201).json({
      message: "Custom financial category deployed successfully!",
      category,
    });
  } catch (error: unknown) {
    console.error("Create Category Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error establishing category row mapping."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// UPDATE CATEGORY
// ---------------------------------------------------------------------------
export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    // Adaptive parameter extraction (id may come from params or query)
    const parsedId =
      req.params.id || req.params.categoryId || req.query.id;
    const targetId = parsedId ? String(parsedId) : undefined;

    const { name, type, color, isRecurring, frequency, dueDay, reminderDays } =
      req.body as Record<string, unknown>;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized data modification attempt."));
      return;
    }
    if (!targetId) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Target modification category id path reference is required."
          )
        );
      return;
    }

    const targetCategory = await prisma.category.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!targetCategory) {
      res
        .status(404)
        .json(
          buildSafeError(
            "Category targeted for synchronization routines was not found."
          )
        );
      return;
    }

    if (String(targetCategory.workspace.userId) !== String(userId)) {
      res
        .status(403)
        .json(buildSafeError("Access denied. Workspace ownership mismatch."));
      return;
    }

    // Block modification of immutable system categories
    if (isSystemCategory(targetCategory.name)) {
      res
        .status(400)
        .json(
          buildSafeError(
            `The core system category "${targetCategory.name}" is locked and cannot be modified.`
          )
        );
      return;
    }

    // Prevent renaming to a reserved system category name
    if (name !== undefined && isSystemCategory(String(name))) {
      res
        .status(400)
        .json(
          buildSafeError(
            `Cannot rename category to "${String(name).trim()}" because it is a reserved system title.`
          )
        );
      return;
    }

    const updatedCategory = await prisma.category.update({
      where: { id: targetId },
      data: {
        name: name !== undefined ? String(name).trim() : targetCategory.name,
        type: type !== undefined ? String(type) : targetCategory.type,
        color: color !== undefined ? String(color) : targetCategory.color,
        isRecurring:
          isRecurring !== undefined
            ? Boolean(isRecurring)
            : targetCategory.isRecurring,
        frequency:
          frequency !== undefined
            ? String(frequency)
            : targetCategory.frequency,
        dueDay:
          dueDay !== undefined
            ? dueDay !== null
              ? Number(dueDay)
              : null
            : targetCategory.dueDay,
        reminderDays:
          reminderDays !== undefined
            ? reminderDays !== null
              ? Number(reminderDays)
              : null
            : targetCategory.reminderDays,
      },
    });

    res.status(200).json({
      message: "Category records synchronized successfully.",
      category: updatedCategory,
    });
  } catch (error: unknown) {
    console.error("Update Category Controller Exception:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error running data flush routines."));
  }
};

// ---------------------------------------------------------------------------
// DELETE CATEGORY
// ---------------------------------------------------------------------------
export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const parsedId =
      req.params.id || req.params.categoryId || req.query.id;
    const targetId = parsedId ? String(parsedId) : undefined;

    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized access."));
      return;
    }
    if (!targetId) {
      res
        .status(400)
        .json(buildSafeError("Category ID is missing."));
      return;
    }

    const categoryTarget = await prisma.category.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!categoryTarget) {
      res
        .status(404)
        .json(
          buildSafeError("The requested category could not be found.")
        );
      return;
    }

    if (String(categoryTarget.workspace.userId) !== String(userId)) {
      res
        .status(403)
        .json(buildSafeError("Access denied. Workspace ownership mismatch."));
      return;
    }

    // Prevent deletion of immutable system categories
    if (isSystemCategory(categoryTarget.name)) {
      res
        .status(400)
        .json(
          buildSafeError(
            `The core system category "${categoryTarget.name}" is permanent and cannot be deleted.`
          )
        );
      return;
    }

    // Cascade: remove all transactions assigned to this category, then delete the category
    await prisma.transaction.deleteMany({
      where: { categoryId: targetId },
    });

    await prisma.category.delete({ where: { id: targetId } });

    res
      .status(200)
      .json({ message: "Category and its transactions removed successfully." });
  } catch (error: unknown) {
    console.error("Delete Category Controller Exception:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error running data flush routines."));
  }
};
/* === SECTION 3 END === */