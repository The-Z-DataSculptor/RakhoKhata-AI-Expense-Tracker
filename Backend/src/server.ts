// src/server.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";  // Handles parsing incoming cookie payloads onto req.cookies
import rateLimit from "express-rate-limit"; // FIXED: Added express-rate-limit engine to mitigate DDoS and brute-force flooding
import { prisma } from "./db";            // Core database client connected to Neon Cloud
import authRoutes from "./routes/authRoutes"; 
import workspaceRoutes from "./routes/workspaceRoutes";   // FIXED: Added workspace routing subsystem to control multi-tenancy partitions
import transactionRoutes from "./routes/transactionRoutes"; // FIXED: Added transaction accounting routing matrix to handle ledger logs
import categoryRoutes from "./routes/categoryRoutes";       // FIXED: Added category budget sorting routes to manage ledger folder structures
import budgetRoutes from "./routes/budgetRoutes";           // FIXED: Added budget ceiling limit routes to establish spending guardrails
import investmentRoutes from "./routes/investmentRoutes";   // FIXED: Added investment vault asset routes to manage financial portfolios
import aiRoutes from "./routes/aiRoutes";                   // NEW: AI insights route for Gemini integration
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: APPLICATION SETUP & CONFIGURATION ===
   ========================================================================== */
const app = express();
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: GLOBAL MIDDLEWARES (SECURITY & COOKIE HANDSHAKE) ===
   ========================================================================== */
// Configure CORS to explicitly allow secure credentials from your Next.js frontend app
app.use(
  cors({
    origin: "http://localhost:3000", // Your exact frontend Next.js local address
    credentials: true,               // Essential! Allows browser headers to pass HttpOnly cookies safely
  })
);

app.use(express.json());   // Body parser to extract incoming JSON payloads onto req.body
app.use(cookieParser());   // Registers the parser to extract cookie strings into readable objects

// 1. Define the Global Network Rate Limiter to protect server resources and CPU overhead
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute observation window represented cleanly in milliseconds
  max: 100,                 // Strictly caps each unique IP address to a maximum of 100 requests per window cycle
  message: {
    error: "Too many financial ledger requests originating from this address. Safety lock engaged, retry in 15 minutes.",
  },
  standardHeaders: true,    // Returns compliant modern rate-limiting telemetry fields within response headers
  legacyHeaders: false,     // Deactivates deprecated X-RateLimit indicators to conserve network packet space
});

// 2. Inject the rate-limiting shield globally across all incoming routes matching the API highway
app.use("/api", globalApiLimiter);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: API ROUTE ENDPOINTS ===
   ========================================================================== */
// Cloud Database Health Check Route to test connectivity
app.get("/api/health", async (req, res) => {
  try {
    // Basic connectivity handshake using a raw query
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

// The Connection Highway: Mount all authentication routes under the /api/auth prefix
app.use("/api/auth", authRoutes);

// The Workspace Highway: Mount workspace multi-tenant configurations under the /api/workspaces prefix
app.use("/api/workspaces", workspaceRoutes); // FIXED: Linked workspaces controller subsystem to connect business/personal channels

// The Transaction Highway: Mount dynamic accounting ledgers under the /api/transactions prefix
app.use("/api/transactions", transactionRoutes); // FIXED: Linked transaction controller subsystem to stream cash flow logs securely

// The Category Highway: Mount custom categorization tracking rules under the /api/categories prefix
app.use("/api/categories", categoryRoutes); // FIXED: Linked category folder controller mappings to stream database buckets cleanly

// The Budget Highway: Mount spending guardrail threshold watch rules under the /api/budgets prefix
app.use("/api/budgets", budgetRoutes); // FIXED: Linked budget watch systems to manage warning thresholds dynamically

// The Investment Vault Highway: Mount asset tracking matrices under the /api/investments prefix
app.use("/api/investments", investmentRoutes); // FIXED: Linked capital portfolio configurations to stream stock and crypto logs securely

// The AI Insights Highway: Mount AI-powered financial advice under the /api/ai prefix
app.use("/api/ai", aiRoutes); // NEW: Routes for Gemini AI integration
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: EXPORTS ===
   ========================================================================== */
// Export the app instance so index.ts can cleanly initialize the listener port
export default app;
/* === SECTION 5 END === */