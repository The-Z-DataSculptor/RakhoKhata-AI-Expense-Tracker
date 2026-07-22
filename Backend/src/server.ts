// Backend/src/server.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { prisma } from "./db";
import authRoutes from "./routes/authRoutes";
import workspaceRoutes from "./routes/workspaceRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import investmentRoutes from "./routes/investmentRoutes";
import aiRoutes from "./routes/aiRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import userRoutes from "./routes/userRoutes";
import { globalApiLimiter } from "./middleware/rateLimitMiddleware";
/* === SECTION 1 END === */

const app = express();

/* ==========================================================================
   === SECTION 2: GLOBAL MIDDLEWARE & PROXY CONFIG ===
   ========================================================================== */

// 🚀 Enable trust proxy so Express reads real client IPs behind Docker / Nginx / Cloud proxies
app.set("trust proxy", 1);

// Enable Cross-Origin Resource Sharing for the Next.js frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse cookies from HTTP requests
app.use(cookieParser());

// Serve static files (e.g., uploaded avatars) from the public directory
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "public", "uploads"))
);

// Apply a global rate limiter to all /api routes
app.use("/api", globalApiLimiter);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: API ROUTES ===
   ========================================================================== */

// Health check endpoint
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "active",
      message: "Welcome to the RakhoKhata Backend Engine!",
      database: "Connected perfectly to Neon Cloud!",
    });
  } catch (error: unknown) {
    console.error("Database Health Check Failed:", error);
    res.status(500).json({ status: "error", error: "Database offline" });
  }
});

// Mount individual route modules
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: GLOBAL ERROR HANDLER ===
   ========================================================================== */

interface AppError {
  status?: number;
  message?: string;
}

// Centralized error handler – never leaks stack traces in production
app.use(
  (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Global Server Exception Caught:", err);

    const statusCode = err.status || 500;
    const message =
      process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : err.message || "An unexpected core engine error occurred on the server layer.";

    res.status(statusCode).json({ error: message });
  }
);
/* === SECTION 4 END === */

export default app;