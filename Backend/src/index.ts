// src/index.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import app from "./server"; // Import the fully configured Express application core
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ENGINE ACTIVATION & NETWORK LISTENER ===
   ========================================================================== */
const PORT = 5000; // Network port assigned for the backend service

// Binding to "0.0.0.0" forces Node to listen across all internal network interfaces,
// protecting the app from IPv4 vs IPv6 local routing conflicts that cause "Failed to fetch".
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Financial secure core engine active on http://localhost:${PORT}`);
});
/* === SECTION 2 END === */