/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import http from "http";
import { Socket } from "net";
import app from "./server.js";
import { prisma } from "./db.js";
import { initNotificationScheduler } from "./services/notificationService.js";
import { initBillReminderCron } from "./workers/billReminderWorker.js";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UTILITIES & CONFIGURATION ===
   ========================================================================== */

// Hostinger / Passenger passes the port or pipe path in process.env.PORT
const rawPort = process.env.PORT || "5000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const isWorkerEnabled =
  process.env.RUN_BACKGROUND_WORKERS === "true" || (!IS_PRODUCTION && process.env.RUN_BACKGROUND_WORKERS !== "false");
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: SERVER BOOT & PROCESS LIFECYCLE ===
   ========================================================================== */

const server = http.createServer(app);

server.headersTimeout = 60000;
server.requestTimeout = 120000;
server.keepAliveTimeout = 5000;

const openSockets = new Set<Socket>();

server.on("connection", (socket: Socket) => {
  openSockets.add(socket);
  socket.once("close", () => {
    openSockets.delete(socket);
  });
});

process.on("uncaughtException", (error: Error) => {
  console.error("💥 CRITICAL UNCAUGHT EXCEPTION:", error);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 CRITICAL UNHANDLED PROMISE REJECTION:", reason);
});

/**
 * Listens on the port or socket path injected by Hostinger / Passenger
 */
function listenPromise(serverInstance: http.Server, portOrPath: string | number): Promise<void> {
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

    // If portOrPath is a string containing 'passenger' or named pipe, listen directly without host parameter
    if (typeof portOrPath === "string" && (isNaN(Number(portOrPath)) || portOrPath.startsWith("\\\\.\\pipe\\"))) {
      serverInstance.listen(portOrPath);
    } else {
      // Numerical port: listen directly so Passenger / Hostinger reverse proxy binds cleanly
      serverInstance.listen(Number(portOrPath));
    }
  });
}

async function startServer(): Promise<void> {
  try {
    // 1. Start HTTP server listening directly on Hostinger's assigned socket/port
    await listenPromise(server, rawPort);

    console.log(`🚀 Financial secure core engine active on port/socket: ${rawPort} [Env:${process.env.NODE_ENV || "development"}]`);

    // 2. Establish database connection pool in background
    try {
      await prisma.$connect();
      console.log("✅ Database connection established successfully.");
    } catch (dbError) {
      console.error("⚠️ Database connection warning during boot:", dbError);
    }

    // 3. Initialize background schedulers if enabled
    if (isWorkerEnabled) {
      console.log("⚙️ Background cron schedulers initializing on this node...");
      initNotificationScheduler();
      initBillReminderCron();
    } else {
      console.log("ℹ️ Background cron schedulers disabled on this node.");
    }
  } catch (error: unknown) {
    console.error("❌ Fatal error binding HTTP server:", error);
    process.exit(1);
  }
}

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) console.error("Error closing HTTP server:", err);
        else console.log("🔒 HTTP server closed.");
        resolve();
      });

      for (const socket of openSockets) {
        socket.destroy();
      }
      openSockets.clear();
    });

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

void startServer();
/* === SECTION 3 END === */