// FILE LOCATION: src/schemas/auth.ts
import { z } from "zod";

/* ==========================================================================
   === SECTION 1: SIGNUP VALIDATION SCHEMA ===
   ========================================================================== */
export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name exceeds maximum length limit."),
    
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid cryptographic security email address.")
      .max(255, "Email exceeds maximum length limit."),
    
    password: z
      .string()
      .min(8, "Master credentials must be at least 8 characters.")
      .max(64, "Password exceeds system limits.")
      .regex(/[0-9]/, "Master credentials must contain at least one numeric value.")
      .regex(/[a-zA-Z]/, "Master credentials must contain at least one letter."),
    
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please verify your entries.",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;


/* ==========================================================================
   === SECTION 2: LOGIN VALIDATION SCHEMA ===
   ========================================================================== */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase() // Normalizes inputs before processing
    .min(5, "Email is required.")
    .email("Please enter a valid cryptographic security email address.")
    .max(255, "Email exceeds maximum length limit."),
  
  password: z
    .string()
    .min(4, "Master credentials must be at least 4 layout characters.")
    .max(64, "Password exceeds system limits."),
});

export type LoginFormData = z.infer<typeof loginSchema>;