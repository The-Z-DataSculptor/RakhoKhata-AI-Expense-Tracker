// src/schemas/categories.ts
import * as z from "zod";

// Ensure 'export' is explicitly here!
export const categoryFormSchema = z.object({
  name: z.string().min(2).max(25),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;