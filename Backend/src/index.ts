import express from "express";
import cors from "cors";
import { prisma } from "./db"; // Brings in your Neon database bridge

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors()); // Allows your frontend to communicate with this server safely
app.use(express.json()); // Lets your server read incoming JSON data from forms

// Upgraded Health Check (Verifies both Server AND Cloud Database are breathing)
app.get("/api/health", async (req, res) => {
  try {
    // Run a tiny test query to your Neon database over the web
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: "active", 
      message: "Welcome to the RakhoKhata Backend Engine!",
      database: "Connected perfectly to Neon Cloud (Singapore Cluster)!"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: "Server is awake, but database connection failed.",
      error: error instanceof Error ? error.message : "Unknown database error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Advanced TypeScript backend running on http://localhost:${PORT}`);
});