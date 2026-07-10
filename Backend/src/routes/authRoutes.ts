// src/routes/authRoutes.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController";
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

// Protected Route: http://localhost:5000/api/auth/me
// BY THE BOOK: The request must pass the verifyTokenGuard inspection layer 
// before Express passes the data stream to the getMe controller.
router.get("/me", verifyTokenGuard, getMe);
/* === SECTION 2 END === */

export default router;