// src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { registerUser, loginUser, getMe, logoutUser } from "../controllers/authController"; // Upgraded: Imported logoutUser
import { verifyTokenGuard } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ROUTE DEFINITIONS ===
   ========================================================================== */
const router = Router();

// Public Route: http://localhost:5000/api/auth/signup
router.post("/signup", registerUser);

// Public Route: http://localhost:5000/api/auth/login
router.post("/login", loginUser);

// Public Route: http://localhost:5000/api/auth/logout
// Drops an expired blank cookie to securely clear the session out of the browser memory
router.post("/logout", logoutUser);

// Protected Route: http://localhost:5000/api/auth/me
// BY THE BOOK: The request must pass the verifyTokenGuard inspection layer 
// before Express passes the data stream to the getMe controller.
router.get("/me", verifyTokenGuard, getMe);
/* === SECTION 2 END === */

export default router;