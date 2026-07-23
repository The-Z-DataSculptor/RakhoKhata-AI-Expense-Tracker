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

// WHY THIS FIX WAS MADE: Dynamically parses trust proxy settings from environment variables
// to prevent IP spoofing attacks across various cloud load balancer and proxy configurations.
const rawTrustProxy = process.env.TRUST_PROXY || "1";
const parsedTrustProxy = rawTrustProxy === "true" ? true : isNaN(Number(rawTrustProxy)) ? rawTrustProxy : Number(rawTrustProxy);
app.set("trust proxy", parsedTrustProxy);

// WHY THIS FIX WAS MADE: Integrates Helmet to inject security headers (HSTS, X-Frame-Options, X-Content-Type-Options)
// protecting the backend against clickjacking, MIME-sniffing, and cross-site framing attacks.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Explicitly sanitize and normalize allowed origins
const rawAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const allowedOrigins = rawAllowedOrigins.map((url) => url.replace(/\/$/, ""));

// WHY THIS FIX WAS MADE: Replaced wildcard non-production origin reflection with a strict origin whitelist,
// and throws an explicit error when unauthorized origins attempt credentialed requests.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, server-to-server, curl) without an Origin header
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy rejection: Origin '${origin}' is not permitted.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
  })
);

// WHY THIS FIX WAS MADE: Enforces explicit payload size limits on incoming JSON bodies to prevent memory exhaustion DoS attacks.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve uploads directory securely
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "public", "uploads"), {
    maxAge: "1d",
    etag: true,
  })
);

// Apply global rate limiter to all API endpoints
app.use("/api", globalApiLimiter);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: API ROUTES & HEALTH CHECKS ===
   ========================================================================== */

/**
 * GET /api/health
 * Liveness probe verifying database connectivity and core system availability.
 */
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    // WHY THIS FIX WAS MADE: Uses a lightweight DB query to verify connection pool health.
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "active",
      message: "Welcome to the RakhoKhata Backend Engine!",
      database: "Connected perfectly to Database Cluster!",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Database Health Check Failure:", error);
    res.status(503).json({ status: "error", error: "Database service unavailable" });
  }
});

// Primary route handlers
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

// Catch-all route for unhandled API endpoints
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Requested API endpoint does not exist." });
});
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: GLOBAL ERROR HANDLER ===
   ========================================================================== */

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

// WHY THIS FIX WAS MADE: Standardized global Express error handling middleware to format error responses
// and prevent leaking sensitive stack traces or database details in production.
app.use(
  (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Global Exception Intercepted:", err);

    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";

    const responseMessage =
      isProduction && statusCode === 500
        ? "An unexpected internal server error occurred."
        : err.message || "An unexpected core engine exception occurred.";

    res.status(statusCode).json({ error: responseMessage });
  }
);
/* === SECTION 4 END === */

export default app;