// src/db.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client"; // Links directly to your compiled models folder
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: POOL AND ADAPTER LAYER ===
   ========================================================================== */
// Initialize the raw PostgreSQL connection pool instance
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Pass the raw connection pool into the Prisma driver adapter wrapper
const adapter = new PrismaPg(pool);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CLIENT GENERATION EXPORT ===
   ========================================================================== */
// Instantiate the global client instance passing the custom PostgreSQL driver adapter
const prisma = new PrismaClient({ adapter });

export { prisma };
/* === SECTION 3 END === */