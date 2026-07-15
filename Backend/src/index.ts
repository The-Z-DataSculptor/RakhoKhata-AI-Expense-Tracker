// src/index.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import app from "./server"; // Import the fully configured Express application core
import { initNotificationScheduler } from "./services/notificationService"; // NEW: Imports background cron scheduler
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ENGINE ACTIVATION & NETWORK LISTENER ===
   ========================================================================== */
const PORT = 5000; // Network port assigned for the backend service

// Binding to "0.0.0.0" forces Node to listen across all internal network interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Financial secure core engine active on http://localhost:${PORT}`);
  
  // NEW: Fire up the background cron scheduler quietly!
  initNotificationScheduler();
});
/* === SECTION 2 END === */