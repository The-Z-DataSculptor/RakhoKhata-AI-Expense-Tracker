// Backend/src/db.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Standard Prisma Client import generated directly inside node_modules/@prisma/client
import { PrismaClient } from "@prisma/client";

// Global TypeScript declaration to extend globalThis for the Prisma singleton pattern
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

// Validates DATABASE_URL on startup to fail fast with a descriptive error
// instead of crashing cryptically inside pg.Pool or Prisma initialization.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || typeof databaseUrl !== "string" || !databaseUrl.trim()) {
  throw new Error(
    "CRITICAL DATABASE ERROR: The 'DATABASE_URL' environment variable is missing or empty. Server cannot start."
  );
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Implements a singleton pattern for pg.Pool in development to prevent
 * hot-reloading tools (nodemon, ts-node-dev, tsx) from opening hundreds of orphaned database connections
 * and exceeding PostgreSQL max_connections limits.
 */
const connectionPool =
  globalThis.globalPgPool ||
  new pg.Pool({
    connectionString: databaseUrl,
    max: process.env.DATABASE_POOL_SIZE ? parseInt(process.env.DATABASE_POOL_SIZE, 10) : 10,
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
    ssl:
      process.env.DATABASE_SSL === "true" || (isProduction && !databaseUrl.includes("localhost"))
        ? { rejectUnauthorized: true }
        : false,
  });

// Registers an error handler on idle clients to prevent backend process crashes
// if PostgreSQL drops or resets an idle background connection.
connectionPool.on("error", (error) => {
  console.error("🚨 Unexpected background error on idle PostgreSQL pool client:", error);
});

if (!isProduction) {
  globalThis.globalPgPool = connectionPool;
}

// Initialize Prisma driver adapter with the managed pg.Pool instance for Prisma 7 compatibility
const prismaAdapter = new PrismaPg(connectionPool);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PRISMA CLIENT SINGLETON & SHUTDOWN HOOKS ===
   ========================================================================== */

/**
 * Enforces a PrismaClient singleton instance across module re-imports,
 * ensuring thread safety, logging configuration, and connection pool reuse.
 */
const prisma =
  globalThis.globalPrisma ||
  new PrismaClient({
    adapter: prismaAdapter,
    log: isProduction
      ? ["error", "warn"]
      : ["query", "error", "warn"],
  });

if (!isProduction) {
  globalThis.globalPrisma = prisma;
}

/**
 * Handles graceful process termination signals (SIGINT/SIGTERM)
 * to close active DB connections cleanly without leaking socket handles or corrupting in-flight transactions.
 */
const handleGracefulShutdown = async (signal: string) => {
  console.log(`[Database] Received ${signal}. Closing PostgreSQL pool and Prisma client...`);
  try {
    await prisma.$disconnect();
    await connectionPool.end();
    console.log("[Database] Database connections closed cleanly.");
  } catch (shutdownError) {
    console.error("[Database] Error during connection pool shutdown:", shutdownError);
  } finally {
    process.exit(0);
  }
};

process.once("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.once("SIGTERM", () => handleGracefulShutdown("SIGTERM"));

export { prisma };
/* === SECTION 3 END === */