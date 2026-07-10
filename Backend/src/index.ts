import express from "express";
import cors from "cors";
import { prisma } from "./db";
import authRoutes from "./routes/authRoutes"; // 👇 Import your new route map

const app = express();
const PORT = 5000;

// Global Middlewares
app.use(cors());
app.use(express.json());

// 1. Existing Health Check Route
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: "active", 
      message: "Welcome to the RakhoKhata Backend Engine!",
      database: "Connected perfectly to Neon Cloud!"
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Database offline" });
  }
});

// 2. 👇 The Connection Highway: Link authentication routes to the server
// This prefixes all endpoints inside authRoutes with "/api/auth"
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Advanced TypeScript backend running on http://localhost:${PORT}`);
});