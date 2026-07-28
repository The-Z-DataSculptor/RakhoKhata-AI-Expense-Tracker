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

async function startServer(): Promise<void> {
  try {
    // 1. First, start HTTP listening socket so Hostinger proxy sees a live web process immediately
    await listenPromise(server, PORT, HOST);

    const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
    console.log(
      `🚀 Financial secure core engine active on http://${displayHost}:${PORT} [Env:${process.env.NODE_ENV || "development"}]`
    );

    // 2. Next, establish database connection pool
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
    console.error("❌ Fatal error binding HTTP server port:", error);
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