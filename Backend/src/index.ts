// Backend/src/index.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import http from "http";
import { Socket } from "net";
import app from "./server";
import { prisma } from "./db";
import { initNotificationScheduler } from "./services/notificationService";
import { initBillReminderCron } from "./workers/billReminderWorker";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UTILITIES & CONFIGURATION ===
   ========================================================================== */

/**
 * Validates and parses the PORT environment variable strictly,
 * ensuring that NaN or out-of-range values fall back to a safe default port (5000).
 */
function parsePort(val: string | undefined, defaultPort: number = 5000): number {
  if (!val) return defaultPort;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    console.warn(`⚠️ Invalid PORT configuration "${val}". Falling back to default port ${defaultPort}.`);
    return defaultPort;
  }
  return parsed;
}

const PORT = parsePort(process.env.PORT, 5000);
const HOST = process.env.HOST || "0.0.0.0";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// WHY THIS FIX WAS MADE: Explicit worker activation prevents multi-container API replicas 
// from running duplicate background cron workers unless RUN_BACKGROUND_WORKERS is explicitly set to "true".
const isWorkerEnabled =
  process.env.RUN_BACKGROUND_WORKERS === "true" || (!IS_PRODUCTION && process.env.RUN_BACKGROUND_WORKERS !== "false");
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: SERVER BOOT & PROCESS LIFECYCLE ===
   ========================================================================== */

// Instantiate native HTTP server
const server = http.createServer(app);

// WHY THIS FIX WAS MADE: Configures explicit HTTP server timeouts to protect against Slowloris DoS attacks.
server.headersTimeout = 60000; // 60 seconds limit to complete header transmissions
server.requestTimeout = 120000; // 120 seconds total request processing ceiling
server.keepAliveTimeout = 5000; // 5 seconds idle keep-alive socket timeout

// Track open client sockets for instant cleanup during graceful server shutdown
const openSockets = new Set<Socket>();

server.on("connection", (socket: Socket) => {
  openSockets.add(socket);
  socket.once("close", () => {
    openSockets.delete(socket);
  });
});

/**
 * Handles global uncaught exceptions and unhandled rejections cleanly.
 */
process.on("uncaughtException", (error: Error) => {
  console.error("💥 CRITICAL UNCAUGHT EXCEPTION: Process shutting down...", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 CRITICAL UNHANDLED PROMISE REJECTION:", reason);
  void gracefulShutdown("UNHANDLED_REJECTION");
});

/**
 * WHY THIS FIX WAS MADE: Wraps server.listen inside a Promise with explicit 'error' event listeners
 * so async port binding failures (e.g., EADDRINUSE) are caught cleanly in try/catch blocks.
 */
function listenPromise(serverInstance: http.Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      serverInstance.removeListener("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      serverInstance.removeListener("error", onError);
      resolve();
    };

    serverInstance.once("error", onError);
    serverInstance.once("listening", onListening);
    serverInstance.listen(port, host);
  });
}

/**
 * Verifies database health before opening HTTP listening sockets.
 */
async function startServer(): Promise<void> {
  try {
    // Confirm database connection pool readiness before taking HTTP traffic
    await prisma.$connect();
    console.log("✅ Database connection established successfully.");

    // Bind HTTP server to port and host safely
    await listenPromise(server, PORT, HOST);

    const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
    console.log(
      `🚀 Financial secure core engine active on http://${displayHost}:${PORT} [Env: ${process.env.NODE_ENV || "development"}]`
    );

    // Initialize background schedulers only if explicitly enabled on this node
    if (isWorkerEnabled) {
      console.log("⚙️ Background cron schedulers initializing on this node...");
      initNotificationScheduler();
      initBillReminderCron();
    } else {
      console.log("ℹ️ Background cron schedulers disabled on this node (RUN_BACKGROUND_WORKERS=false).");
    }
  } catch (error: unknown) {
    console.error("❌ Fatal error initializing server engine:", error);
    process.exit(1);
  }
}

/**
 * WHY THIS FIX WAS MADE: Closes active keep-alive sockets and drains database connection pools
 * cleanly during SIGTERM/SIGINT shutdown signals without hanging.
 */
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown of core engine...`);

  // Force exit timeout safeguard
  const forceExitTimeout = setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // 1. Stop accepting new HTTP requests and destroy open keep-alive sockets
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          console.error("Error closing HTTP server:", err);
        } else {
          console.log("🔒 HTTP server closed to new connections.");
        }
        resolve();
      });

      // Destroy open client sockets so server.close callback triggers immediately
      for (const socket of openSockets) {
        socket.destroy();
      }
      openSockets.clear();
    });

    // 2. Disconnect database connection pool cleanly
    await prisma.$disconnect();
    console.log("🔌 Database connections closed cleanly.");

    clearTimeout(forceExitTimeout);
    process.exit(0);
  } catch (error: unknown) {
    console.error("❌ Error during server graceful shutdown:", error);
    process.exit(1);
  }
}

process.once("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

// Boot application
void startServer();
/* === SECTION 3 END === */