// Backend/src/db.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var globalPgPool: pg.Pool | undefined;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ENVIRONMENT VALIDATION & POOL CONFIGURATION ===
   ========================================================================== */

const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl.trim()) {
  console.error("⚠️ WARNING: 'DATABASE_URL' environment variable is missing or empty.");
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Optimized PostgreSQL Connection Pool
 * - Connection timeout extended to 20s for Neon serverless wakeups
 * - Keepalive enabled to prevent abrupt SSL socket drops
 */
const connectionPool =
  globalThis.globalPgPool ||
  new pg.Pool({
    connectionString: databaseUrl,
    max: process.env.DATABASE_POOL_SIZE ? parseInt(process.env.DATABASE_POOL_SIZE, 10) : 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 20000,
    keepAlive: true,
    ssl:
      process.env.DATABASE_SSL === "true" || (isProduction && databaseUrl && !databaseUrl.includes("localhost"))
        ? { rejectUnauthorized: false }
        : false,
  });

connectionPool.on("error", (error) => {
  console.error("🚨 Unexpected error on idle PostgreSQL pool client:", error);
});

if (!isProduction) {
  globalThis.globalPgPool = connectionPool;
}

const prismaAdapter = new PrismaPg(connectionPool);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PRISMA CLIENT SINGLETON ===
   ========================================================================== */

const prisma =
  globalThis.globalPrisma ||
  new PrismaClient({
    adapter: prismaAdapter,
    log: isProduction ? ["error", "warn"] : ["error", "warn"],
  });

if (!isProduction) {
  globalThis.globalPrisma = prisma;
}

/**
 * Clean pool teardown helper called by server lifecycle
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await prisma.$disconnect();
    await connectionPool.end();
  } catch (err) {
    console.error("Error during database teardown:", err);
  }
}

export { prisma, connectionPool };
/* === SECTION 3 END === */