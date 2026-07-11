// prisma.config.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import "dotenv/config";                 // Automatically populates process.env with values from your local .env file
import { defineConfig } from "prisma/config"; // The official configuration engine layout module for Prisma 7
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MIGRATION ENGINE CONFIGURATION RULES ===
   ========================================================================== */
export default defineConfig({
  schema: "prisma/schema.prisma",     // Explicit path pointing the CLI engine to your data structure tables
  migrations: {
    path: "prisma/migrations",        // Designated target directory where all compiled SQL history files are saved
  },
  datasource: {
    url: process.env["DATABASE_URL"], // Maps the Neon Cloud connection string directly to the Prisma CLI for migrations
  },
});
/* === SECTION 2 END === */