// src/schemas/categories.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { z } from "zod";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CATEGORY FORM VALIDATION SCHEMA ===
   ========================================================================== */
/**
 * Validation schema for the category creation / edit form.
 *
 * WHY name max length is 50:
 * Category names are displayed in the UI; extremely long names
 * would break the layout. 50 characters is a reasonable limit.
 *
 * WHY color must be a hex code:
 * The frontend expects a 6‑digit hex colour (e.g., #FF5733).
 * Without this validation a user could submit an arbitrary string
 * that would cause the UI to display incorrectly.
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be under 50 characters"),

  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),

  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a 6‑digit hex code (e.g., #FF5733)"),

  isRecurring: z.boolean().default(false),

  frequency: z
    .enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"])
    .optional(),

  dueDay: z.number().optional(),
  reminderDays: z.number().optional(),
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTED TYPE ===
   ========================================================================== */
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
/* === SECTION 3 END === */