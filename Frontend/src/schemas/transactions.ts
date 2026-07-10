// src/schemas/transactions.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import * as z from "zod";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ZOD VALIDATION SCHEMA ===
   ========================================================================== */
export const transactionFormSchema = z.object({
  date: z.string().min(1, { message: "Please pick a valid booking date" }),
  
  description: z
    .string()
    .min(3, { message: "Description details must span at least 3 characters" })
    .max(80),
  
  category: z.string().min(1, { message: "Please select a valid target category" }),
  
  type: z.enum(["EXPENSE", "INCOME"], { message: "Direction must be specified" }),
  
  // FIX: Using simple { message } inside coerce.number() prevents the 'invalid_type_error' TS issue.
  // This guarantees the output will be typed strictly as 'number'.
  amount: z.coerce
    .number({ message: "Amount must be a valid number" })
    .positive({ message: "Financial amounts must be strictly above 0" }),
});
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: TYPES EXPORT ===
   ========================================================================== */
// This automatically generates the exact TypeScript interface based on our schema above.
// By exporting this, React Hook Form uses the exact same shape as Zod.
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
/* === SECTION 3 END === */