// Backend/src/db.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: DATABASE CONNECTION POOL & ADAPTER ===
   ========================================================================== */

// Create a connection pool for PostgreSQL using the DATABASE_URL environment variable
const connectionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wrap the pool with the Prisma driver adapter so Prisma can use the native driver
const prismaAdapter = new PrismaPg(connectionPool);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PRISMA CLIENT EXPORT ===
   ========================================================================== */

// Instantiate the Prisma client with the custom adapter and export it globally
const prisma = new PrismaClient({ adapter: prismaAdapter });

export { prisma };
/* === SECTION 3 END === */