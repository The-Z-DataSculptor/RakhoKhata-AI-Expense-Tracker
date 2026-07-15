// src/controllers/authController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { Request, Response } from "express";
import crypto from "crypto"; 
import bcrypt from "bcrypt";
import { encrypt } from "paseto-ts/v4";
import { prisma } from "../db";
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

const PERSONAL_CATEGORIES = [
  { name: "Salary", type: "INCOME", color: "#10b981" },
  { name: "Housing", type: "EXPENSE", color: "#3b82f6" },
  { name: "Food", type: "EXPENSE", color: "#ef4444" },
  { name: "Bills", type: "EXPENSE", color: "#f59e0b" },
  { name: "Transport", type: "EXPENSE", color: "#8b5cf6" },
  { name: "Shopping", type: "EXPENSE", color: "#ec4899" },
  { name: "Health", type: "EXPENSE", color: "#14b8a6" },
  { name: "Savings", type: "EXPENSE", color: "#059669" }
];

const BUSINESS_CATEGORIES = [
  { name: "Revenue", type: "INCOME", color: "#10b981" },
  { name: "Payroll", type: "EXPENSE", color: "#f43f5e" },
  { name: "Marketing", type: "EXPENSE", color: "#6366f1" },
  { name: "Software", type: "EXPENSE", color: "#0ea5e9" },
  { name: "Inventory", type: "EXPENSE", color: "#d97706" },
  { name: "Office", type: "EXPENSE", color: "#64748b" },
  { name: "Travel", type: "EXPENSE", color: "#d946ef" },
  { name: "Taxes", type: "EXPENSE", color: "#dc2626" }
];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: REGISTER USER CONTROLLER ===
   ========================================================================== */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      fullName, 
      email, 
      password,
      country,
      currency,
      languages,
      occupation,
      financialGoal,
      aiPersona
    } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: "Please fill in all required fields." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(400).json({ error: "A user with this email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const baseCurrency = currency || "PKR";

    const newUser = await prisma.user.create({
      data: { 
        name: fullName, 
        email: normalizedEmail, 
        passwordHash: hashedPassword,
        country: country || null,
        currency: baseCurrency,
        languages: languages || [],
        occupation: occupation || "prefer_not_to_say",
        financialGoal: financialGoal || "zen_master",
        aiPersona: aiPersona || "supportive_coach",
        workspaces: {
          create: [
            { 
              name: "Personal", 
              currency: baseCurrency,
              categories: {
                create: PERSONAL_CATEGORIES
              }
            },
            { 
              name: "Business", 
              currency: baseCurrency,
              categories: {
                create: BUSINESS_CATEGORIES
              }
            }
          ]
        }
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        uiTheme: true, 
        country: true,
        currency: true,
        languages: true,
        occupation: true,
        financialGoal: true,
        aiPersona: true,
        createdAt: true,
        workspaces: true
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
      message: "User registered successfully! Default profiles initialized with personalized localization.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        uiTheme: newUser.uiTheme,
        country: newUser.country,
        currency: newUser.currency,
        languages: newUser.languages,
        occupation: newUser.occupation,
        financialGoal: newUser.financialGoal,
        aiPersona: newUser.aiPersona,
        createdAt: newUser.createdAt
      },
      workspaces: newUser.workspaces
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

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
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
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        uiTheme: user.uiTheme,
        country: user.country,
        currency: user.currency,
        languages: user.languages,
        occupation: user.occupation,
        financialGoal: user.financialGoal,
        aiPersona: user.aiPersona
      },
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
      select: { 
        id: true, 
        name: true, 
        email: true, 
        uiTheme: true, 
        country: true,
        currency: true,
        languages: true,
        occupation: true,
        financialGoal: true,
        aiPersona: true,
        createdAt: true 
      },
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

/* ==========================================================================
   === SECTION 7: UPDATE PROFILE CONTROLLER (NEW) ===
   ========================================================================== */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const allowedFields = [
      "name", "email", "country", "currency", "languages",
      "occupation", "financialGoal", "aiPersona"
    ];
    const data: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true, uiTheme: true,
        country: true, currency: true, languages: true,
        occupation: true, financialGoal: true, aiPersona: true,
        createdAt: true
      }
    });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal server error updating profile." });
  }
};
/* === SECTION 7 END === */

/* ==========================================================================
   === SECTION 8: CHANGE PASSWORD CONTROLLER (NEW) ===
   ========================================================================== */
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: "Internal server error changing password." });
  }
};
/* === SECTION 8 END === */