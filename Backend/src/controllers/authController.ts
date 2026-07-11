// src/controllers/authController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Request, Response } from "express";
import crypto from "crypto"; 
import bcrypt from "bcrypt";
import { encrypt } from "paseto-ts/v4"; // Pure TypeScript PASETO v4 local encryption engine
import { prisma } from "../db";          // Core shared Prisma client connection instance
import { AuthenticatedRequest } from "../middleware/authMiddleware";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: STRATEGIC CONTROLLER CONFIGURATIONS & UTILITIES ===
   ========================================================================== */
const PASETO_SECRET = process.env.PASETO_SECRET || "k4.local.abcdefghijklmnopqrstuvwxyz01234567890123456789";

const getPasetoKey = (): string => {
  const hash = crypto.createHash("sha256").update(PASETO_SECRET).digest();
  const base64url = hash.toString("base64url");
  return `k4.local.${base64url}`;
};

const COOKIE_OPTIONS = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production", 
  sameSite: "lax" as const, 
  maxAge: 7 * 24 * 60 * 60 * 1000 
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: REGISTER USER CONTROLLER (WITH AUTOMATIC WORKSPACE SEEDING) ===
   ========================================================================== */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: "Please fill in all required fields." });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "A user with this email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ... inside your registerUser try-catch block ...
    const newUser = await prisma.user.create({
      data: { 
        name: fullName, 
        email, 
        passwordHash: hashedPassword,
        workspaces: {
          create: [
            { name: "Personal", currency: "USD" }, // FIXED: Swapped default from PKR to USD
            { name: "Business", currency: "USD" }  // FIXED: Swapped default from PKR to USD
          ]
        }
      },
      // ... rest of the register controller stays exactly the same ...
      select: { 
        id: true, 
        name: true, 
        email: true, 
        uiTheme: true, 
        createdAt: true,
        workspaces: true // Returns the newly minted workspaces down the pipeline
      },
    });

    const expirationTime = new Date(Date.now() + COOKIE_OPTIONS.maxAge).toISOString();
    const token = await encrypt(getPasetoKey(), { 
      userId: newUser.id, 
      email: newUser.email, 
      exp: expirationTime 
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "User registered successfully! Default Personal and Business profiles initialized.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        uiTheme: newUser.uiTheme,
        createdAt: newUser.createdAt
      },
      workspaces: newUser.workspaces // Sends both workspaces directly to frontend memory store arrays
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: LOGIN USER CONTROLLER ===
   ========================================================================== */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Please enter both email and password." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password credentials." });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      res.status(401).json({ error: "Invalid email or password credentials." });
      return;
    }

    const expirationTime = new Date(Date.now() + COOKIE_OPTIONS.maxAge).toISOString();
    const token = await encrypt(getPasetoKey(), { 
      userId: user.id, 
      email: user.email, 
      exp: expirationTime 
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Login successful! Welcome back to RakhoKhata.",
      user: { id: user.id, name: user.name, email: user.email, uiTheme: user.uiTheme },
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ error: "Internal server error during login verification." });
  }
};
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: GET ME (PROFILE DETECTOR) CONTROLLER ===
   ========================================================================== */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access. Valid profile identifier missing." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, uiTheme: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: "Active database account record could not be found." });
      return;
    }

    res.status(200).json({ message: "Authenticated identity verified successfully.", user });
  } catch (error) {
    console.error("Profile Fetch Controller Exception:", error);
    res.status(500).json({ error: "Internal server error during profile verification." });
  }
};
/* === SECTION 5 END === */

/* ==========================================================================
   === SECTION 6: LOGOUT CONTROLLER ===
   ========================================================================== */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully. Secure session revoked." });
  } catch (error) {
    console.error("Logout Controller Exception:", error);
    res.status(500).json({ error: "Internal server error during session teardown." });
  }
};
/* === SECTION 6 END === */