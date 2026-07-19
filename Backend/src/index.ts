// Backend/src/index.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import app from "./server";
import { initNotificationScheduler } from "./services/notificationService";
import { initBillReminderCron } from "./workers/billReminderWorker";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SERVER STARTUP & BACKGROUND JOBS ===
   ========================================================================== */
const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Financial secure core engine active on http://localhost:${PORT}`
  );

  // Start background scheduler for notifications
  initNotificationScheduler();

  // Start automated daily bill reminder checker
  initBillReminderCron();
});
/* === SECTION 2 END === */