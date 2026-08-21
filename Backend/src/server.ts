// Backend/src/server.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
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
   === SECTION 2: GLOBAL MIDDLEWARE & SECURITY CONFIG ===
   ========================================================================== */

const rawTrustProxy = process.env.TRUST_PROXY || "1";
let parsedTrustProxy: boolean | number | string;
if (rawTrustProxy === "true") {
  parsedTrustProxy = true;
} else if (rawTrustProxy === "false") {
  parsedTrustProxy = false;
} else if (!isNaN(Number(rawTrustProxy))) {
  parsedTrustProxy = Number(rawTrustProxy);
} else {
  parsedTrustProxy = rawTrustProxy;
}
app.set("trust proxy", parsedTrustProxy);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const rawAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://paleturquoise-lyrebird-486193.hostingersite.com",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const allowedOriginsSet = new Set(
  rawAllowedOrigins.map((url) => url.replace(/\/$/, ""))
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOriginsSet.has(normalizedOrigin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "public", "uploads"), {
    maxAge: "1d",
    etag: true,
  })
);

// Root health check endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "active",
    message: "Welcome to RakhoKhaata API Engine",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check endpoint
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "active",
      message: "Welcome to RakhoKhaata API",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (_error: unknown) {
    res.status(200).json({
      status: "active",
      message: "API Active (Database connecting...)",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api", globalApiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Requested API endpoint does not exist." });
});

/* ==========================================================================
   === SECTION 3: GLOBAL ERROR HANDLER ===
   ========================================================================== */

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

app.use(
  (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Global Exception Intercepted:", err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({ error: err.message || "Internal server error" });
  }
);

export default app;