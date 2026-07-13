// src/schemas/categories.ts
import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  color: z.string(),
  isRecurring: z.boolean().default(false),      // required (has default)
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
  dueDay: z.number().optional(),
  reminderDays: z.number().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;