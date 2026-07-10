// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
// Import our custom AuthenticatedRequest interface to safely manage user profile tokens
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Fallback secret check to ensure environment variables are configured correctly
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

/* ==========================================================================
   === SECTION 1: REGISTER USER CONTROLLER ===
   ========================================================================== */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: "Please fill in all required fields." });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "A user with this email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: fullName, 
        email,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        uiTheme: true,
        createdAt: true,
      },
    });

    // BY THE BOOK: Generate a secure session token containing the new user's real ID
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" } // Token remains valid for 7 days
    );

    // Ship both the user profile metrics AND the secure authentication token
    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: LOGIN USER CONTROLLER ===
   ========================================================================== */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Please enter both email and password." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password credentials." });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatch) {
      res.status(401).json({ error: "Invalid email or password credentials." });
      return;
    }

    // BY THE BOOK: Generate a secure session token containing the verified user's real ID
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful! Welcome back to RakhoKhata.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        uiTheme: user.uiTheme,
      },
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ error: "Internal server error during login verification." });
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: GET ME (PROFILE DETECTOR) CONTROLLER ===
   ========================================================================== */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 1. Extract the verified userId attached to this transaction row by the security middleware
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Valid profile identifier missing." });
      return;
    }

    // 2. Query: Look up the unique account profile rows inside your Neon cloud database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        uiTheme: true,
        createdAt: true,
      },
    });

    // 3. Fallback check: If the user deleted their profile mid-session
    if (!user) {
      res.status(404).json({ error: "Active database account record could not be found." });
      return;
    }

    // 4. Success payload: Ship the live profile parameters directly back to the front-end layout
    res.status(200).json({
      message: "Authenticated identity verified successfully.",
      user,
    });
  } catch (error) {
    console.error("Profile Fetch Controller Exception:", error);
    res.status(500).json({ error: "Internal server error during profile verification." });
  }
};
/* === SECTION 3 END === */