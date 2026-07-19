// src/server.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";  
import { prisma } from "./db";            
import authRoutes from "./routes/authRoutes"; 
import workspaceRoutes from "./routes/workspaceRoutes";   
import transactionRoutes from "./routes/transactionRoutes"; 
import categoryRoutes from "./routes/categoryRoutes";       
import budgetRoutes from "./routes/budgetRoutes";           
import investmentRoutes from "./routes/investmentRoutes";   
import aiRoutes from "./routes/aiRoutes";                   
import notificationRoutes from "./routes/notificationRoutes"; 
import { globalApiLimiter } from "./middleware/rateLimitMiddleware"; 
/* === SECTION 1 END === */

const app = express();

/* ==========================================================================
   === SECTION 3: GLOBAL MIDDLEWARES (SECURITY & COOKIE HANDSHAKE) ===
   ========================================================================== */
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,               
  })
);

app.use(express.json());   
app.use(cookieParser());   

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
app.use("/api/notifications", notificationRoutes); 

/* ==========================================================================
   === 🚀 NEW: CENTRALIZED JSON EXCEPTION SHIELD ===
   ========================================================================== */
// This intercepts all downstream middleware or routing crashes and forces clean JSON returns
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Server Exception Caught:", err);
  
  res.status(err.status || 500).json({
    error: err.message || "An unexpected core engine error occurred on the server layer."
  });
});
/* === SECTION 4 END === */

export default app;