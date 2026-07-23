// Backend/prisma.config.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
// WHY THIS FIX WAS MADE: In Prisma 7, .env files are loaded explicitly at the top of the file.
// We import 'dotenv/config' and the official 'defineConfig' / 'env' helpers from 'prisma/config'.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: PRISMA 7 CLI CONFIGURATION ===
   ========================================================================== */

/**
 * WHY THIS FIX WAS MADE: Using standard relative string paths ("prisma/schema.prisma") 
 * and Prisma's native env("DATABASE_URL") helper completely removes the need for 'path' 
 * and 'process' references, eliminating all TypeScript global scope errors permanently.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
/* === SECTION 2 END === */