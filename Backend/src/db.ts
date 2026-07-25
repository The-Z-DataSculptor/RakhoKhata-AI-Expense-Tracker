// Backend/src/db.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import "dotenv/config";
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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || typeof databaseUrl !== "string" || !databaseUrl.trim()) {
  throw new Error(
    "CRITICAL DATABASE ERROR: The 'DATABASE_URL' environment variable is missing or empty. Server cannot start."
  );
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Configure database connection pool with SSL options compatible with cloud PostgreSQL providers
 */
const connectionPool =
  globalThis.globalPgPool ||
  new pg.Pool({
    connectionString: databaseUrl,
    max: process.env.DATABASE_POOL_SIZE ? parseInt(process.env.DATABASE_POOL_SIZE, 10) : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl:
      process.env.DATABASE_SSL === "true" || (isProduction && !databaseUrl.includes("localhost"))
        ? { rejectUnauthorized: false } // Allows SSL connections to managed cloud databases
        : false,
  });

connectionPool.on("error", (error) => {
  console.error("🚨 Unexpected background error on idle PostgreSQL pool client:", error);
});

if (!isProduction) {
  globalThis.globalPgPool = connectionPool;
}

const prismaAdapter = new PrismaPg(connectionPool);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PRISMA CLIENT SINGLETON & SHUTDOWN HOOKS ===
   ========================================================================== */

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