// Backend/src/index.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import http from "http";
import { Socket } from "net";
import app from "./server";
import { prisma, closeDatabaseConnections } from "./db";
import { initNotificationScheduler } from "./services/notificationService";
import { initBillReminderCron } from "./workers/billReminderWorker";
import { initCleanupCron } from "./workers/cleanupUnverifiedAccountsWorker";
import { initVerificationReminderCron } from "./workers/verificationReminderWorker";
import { initTrashCleanupCron } from "./workers/cleanupTrashWorker";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: UTILITIES & CONFIGURATION ===
   ========================================================================== */

const rawPort = process.env.PORT || "5000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const isWorkerEnabled =
  process.env.RUN_BACKGROUND_WORKERS === "true" ||
  (!IS_PRODUCTION && process.env.RUN_BACKGROUND_WORKERS !== "false");
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: SERVER BOOT & PROCESS LIFECYCLE ===
   ========================================================================== */

const server = http.createServer(app);

// Keepalive matches reverse proxies (e.g. Nginx, Hostinger)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 120000;

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

function listenPromise(
  serverInstance: http.Server,
  portOrPath: string | number
): Promise<void> {
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

    if (
      typeof portOrPath === "string" &&
      (isNaN(Number(portOrPath)) || portOrPath.startsWith("\\\\.\\pipe\\"))
    ) {
      serverInstance.listen(portOrPath);
    } else {
      serverInstance.listen(Number(portOrPath), "0.0.0.0");
    }
  });
}

async function startServer(): Promise<void> {
  try {
    await listenPromise(server, rawPort);
    console.log(`🚀 Financial secure core engine active on port/socket: ${rawPort}`);

    try {
      await prisma.$connect();
      console.log("✅ Database connection established successfully.");
    } catch (dbError) {
      console.error("⚠️ Database connection warning during boot:", dbError);
    }

    if (isWorkerEnabled) {
      console.log("⚙️ Background cron schedulers initializing on this node...");
      initNotificationScheduler();
      initBillReminderCron();
      initCleanupCron();
      initVerificationReminderCron();
      initTrashCleanupCron();
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

    await closeDatabaseConnections();
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