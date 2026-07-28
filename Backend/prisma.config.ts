/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
// WHY THIS FIX WAS MADE: Replaced 'import "dotenv/config"' with explicit dotenv.config()
// to avoid fileURLToPath(import.meta.url) crash in bundled environments (Hostinger).
import dotenv from "dotenv";
dotenv.config();

import { defineConfig, env } from "prisma/config";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: PRISMA 7 CLI CONFIGURATION ===
   ========================================================================== */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});