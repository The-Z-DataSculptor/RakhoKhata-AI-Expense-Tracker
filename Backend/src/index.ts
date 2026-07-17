// src/index.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import app from "./server"; // Import the fully configured Express application core
import { initNotificationScheduler } from "./services/notificationService"; // Background notification runner
import { initBillReminderCron } from "./workers/billReminderWorker"; // 🚀 NEW: Import your bill reminders engine
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ENGINE ACTIVATION & NETWORK LISTENER ===
   ========================================================================== */
const PORT = 5000; // Network port assigned for the backend service

// Binding to "0.0.0.0" forces Node to listen across all internal network interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Financial secure core engine active on http://localhost:${PORT}`);
  
  // Fire up the background cron scheduler quietly!
  initNotificationScheduler();

  // 🚀 NEW: Start your automated daily bills and regular payments countdown checker!
  initBillReminderCron();
});
/* === SECTION 2 END === */