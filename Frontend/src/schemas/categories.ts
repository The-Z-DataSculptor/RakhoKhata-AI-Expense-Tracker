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
 */
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  color: z.string(),
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
export type CategoryFormValues = z.infer<
  typeof categoryFormSchema
>;
/* === SECTION 3 END === */