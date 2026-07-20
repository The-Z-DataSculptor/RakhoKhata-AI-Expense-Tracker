// src/schemas/auth.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { z } from "zod";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SIGNUP VALIDATION SCHEMA ===
   ========================================================================== */
/**
 * Schema for the multi‑step signup form.
 * Validates the core account fields plus optional onboarding data.
 */
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
      .email("Please enter a valid email address.")
      .max(255, "Email exceeds maximum length limit."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(64, "Password exceeds system limits.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter."),

    confirmPassword: z.string(),

    // Optional onboarding fields
    country: z.string().optional(),
    currency: z.string().default("USD"),
    languages: z.array(z.string()).default([]),
    occupation: z.string().optional(),
    financialGoal: z.string().optional(),
    aiPersona: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please verify your entries.",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: LOGIN VALIDATION SCHEMA ===
   ========================================================================== */
/**
 * Schema for the login form.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "Email is required.")
    .email("Please enter a valid email address.")
    .max(255, "Email exceeds maximum length limit."),

  password: z
    .string()
    .min(4, "Password must be at least 4 characters.")
    .max(64, "Password exceeds system limits."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
/* === SECTION 3 END === */