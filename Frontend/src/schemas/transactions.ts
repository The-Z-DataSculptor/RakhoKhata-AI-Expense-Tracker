// src/schemas/transactions.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import * as z from "zod";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ZOD VALIDATION SCHEMA ===
   ========================================================================== */
/**
 * Schema for transaction form validation.
 * Ensures the incoming data is complete and correctly typed before submission.
 *
 * WHY .positive() is used on amount:
 * A transaction with a zero amount is meaningless. We require a value > 0.
 *
 * WHY max length on description is 150:
 * Most bank descriptions are concise, but some imported statements can
 * have longer narratives. 150 characters covers virtually all cases.
 */
export const transactionFormSchema = z.object({
  date: z
    .string()
    .min(1, { message: "Please pick a valid booking date" }),

  description: z
    .string()
    .trim()
    .min(3, { message: "Description must be at least 3 characters" })
    .max(150, { message: "Description must be under 150 characters" }),

  category: z
    .string()
    .min(1, { message: "Please select a target category" }),

  type: z.enum(["EXPENSE", "INCOME"], {
    message: "Type must be either EXPENSE or INCOME",
  }),

  amount: z.coerce
    .number({ message: "Amount must be a valid number" })
    .positive({ message: "Amount must be strictly above 0" }),
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORTED TYPE ===
   ========================================================================== */
/**
 * Inferred TypeScript type from the Zod schema.
 * Used by React Hook Form and other components.
 */
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
/* === SECTION 3 END === */