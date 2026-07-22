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

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL?.replace(/\/$/, "") || "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "public", "uploads"))
);

app.use("/api", globalApiLimiter);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: API ROUTES ===
   ========================================================================== */

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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

// Standard 404 Catch-All (Compatible with Express 5 / path-to-regexp v8)
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Requested API endpoint does not exist." });
});
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: GLOBAL ERROR HANDLER ===
   ========================================================================== */

interface AppError {
  status?: number;
  message?: string;
}

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