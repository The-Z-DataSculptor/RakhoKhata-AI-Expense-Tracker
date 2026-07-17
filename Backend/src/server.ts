// src/server.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";  // Handles parsing incoming cookie payloads onto req.cookies
import { prisma } from "./db";            // Core database client connected to Neon Cloud
import authRoutes from "./routes/authRoutes"; 
import workspaceRoutes from "./routes/workspaceRoutes";   // Workspace routing subsystem to control multi-tenancy partitions
import transactionRoutes from "./routes/transactionRoutes"; // Transaction accounting routing matrix to handle ledger logs
import categoryRoutes from "./routes/categoryRoutes";       // Category budget sorting routes to manage ledger folder structures
import budgetRoutes from "./routes/budgetRoutes";           // Budget ceiling limit routes to establish spending guardrails
import investmentRoutes from "./routes/investmentRoutes";   // Investment vault asset routes to manage financial portfolios
import aiRoutes from "./routes/aiRoutes";                   // AI insights route for Gemini integration
import notificationRoutes from "./routes/notificationRoutes"; // Notification routing subsystem
import { globalApiLimiter } from "./middleware/rateLimitMiddleware"; // Centralized global rate limit controller import
/* === SECTION 1 END === */

const app = express();

/* ==========================================================================
   === SECTION 3: GLOBAL MIDDLEWARES (SECURITY & COOKIE HANDSHAKE) ===
   ========================================================================== */
app.use(
  cors({
    origin: "http://localhost:3000", // Your exact frontend Next.js local address
    credentials: true,               // Essential! Allows browser headers to pass HttpOnly cookies safely
  })
);

app.use(express.json());   // Body parser to extract incoming JSON payloads onto req.body
app.use(cookieParser());   // Registers the parser to extract cookie strings into readable objects

// Apply the generous centralized rate limiter globally across the API highway
app.use("/api", globalApiLimiter);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: API ROUTE ENDPOINTS ===
   ========================================================================== */
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: "active", 
      message: "Welcome to the RakhoKhata Backend Engine!",
      database: "Connected perfectly to Neon Cloud!"
    });
  } catch (error) {
    console.error("Database Health Check Failed:", error);
    res.status(500).json({ status: "error", error: "Database offline" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes); // Mounted notifications routing highway!
/* === SECTION 4 END === */

export default app;