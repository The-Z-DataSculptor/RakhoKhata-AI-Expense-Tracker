// src/server.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // Handles parsing incoming cookie payloads onto req.cookies
import { prisma } from "./db";           // Core database client connected to Neon Cloud
import authRoutes from "./routes/authRoutes"; 
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
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: EXPORTS ===
   ========================================================================== */
// Export the app instance so index.ts can cleanly initialize the listener port
export default app;
/* === SECTION 5 END === */