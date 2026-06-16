// src/schemas/transactions.ts
import * as z from "zod";

export const transactionFormSchema = z.object({
  date: z.string().min(1, { message: "Please pick a valid booking date calendar mark" }),
  description: z
    .string()
    .min(3, { message: "Description details must span at least 3 characters" })
    .max(80),
  category: z.string().min(1, { message: "Allocation map routing requires a valid target category selection" }),
  type: z.enum(["EXPENSE", "INCOME"], { message: "Allocation assignment direction must be specified" }),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return parseFloat(val);
      }
      return val;
    })
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Financial transaction amounts must scale strictly above 0",
    }),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;