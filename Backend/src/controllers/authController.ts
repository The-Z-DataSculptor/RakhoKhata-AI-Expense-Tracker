// Backend/src/controllers/authController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONFIGURATION ===
   ========================================================================== */
import { Request, Response as ExpressResponse } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { TransactionType, Prisma } from "@prisma/client";
import { encryptSessionToken } from "../utils/sessionToken";
import { prisma } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSecurityAlertEmail,
} from "../services/emailService";
import {
  SHARED_DEFAULT_PERSONAL_CATEGORIES,
  SHARED_DEFAULT_BUSINESS_CATEGORIES,
} from "./workspaceController";

// Environment variables with fallback safeguards pointing to local development
const APP_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  `${process.env.BACKEND_PUBLIC_URL || "http://localhost:5000"}/api/auth/google/callback`;

const EXTERNAL_API_TIMEOUT_MS = 10000;

// Standard cookie options (works identically on local & production via same-origin rewrites)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: HELPER FUNCTIONS & TYPES ===
   ========================================================================== */

interface RegisterRequestBody {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  country?: unknown;
  currency?: unknown;
  languages?: unknown;
  occupation?: unknown;
  financialGoal?: unknown;
  aiPersona?: unknown;
}

interface UpdateProfileRequestBody {
  name?: unknown;
  country?: unknown;
  currency?: unknown;
  languages?: unknown;
  occupation?: unknown;
  financialGoal?: unknown;
  aiPersona?: unknown;
}

function getPasetoKey(): string {
  const secret = process.env.PASETO_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: PASETO_SECRET environment variable is missing!");
    }
    const devFallback = "dev_secret_key_must_be_at_least_32_characters_long_for_security";
    const devHash = crypto.createHash("sha256").update(devFallback).digest();
    return `k4.local.${devHash.toString("base64url")}`;
  }

  const hash = crypto.createHash("sha256").update(secret).digest();
  return `k4.local.${hash.toString("base64url")}`;
}

async function generateSessionToken(userId: string, email: string): Promise<string> {
  const expirationTime = new Date(Date.now() + COOKIE_OPTIONS.maxAge).toISOString();
  return await encryptSessionToken({
    userId,
    email,
    exp: expirationTime,
  });
}

function buildErrorResponse(message: string): { error: string } {
  return { error: message };
}

function extractSingleString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function extractOptionalString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function formatDefaultCategories(
  categories: Array<{ name: string; type: string; color: string; isFixed?: boolean }>
) {
  return categories.map((cat) => ({
    name: cat.name,
    type: cat.type as TransactionType,
    color: cat.color,
    isFixed: Boolean(cat.isFixed),
  }));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: AUTHENTICATION CONTROLLERS ===
   ========================================================================== */

/**
 * POST /api/auth/register
 */
export const registerUser = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const body = req.body as RegisterRequestBody;

    const fullName = extractSingleString(body.fullName);
    const rawEmail = extractSingleString(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!fullName || !rawEmail || !password) {
      res.status(400).json(buildErrorResponse("Full name, email, and password are required."));
      return;
    }

    if (password.length < 8) {
      res.status(400).json(buildErrorResponse("Password must be at least 8 characters long."));
      return;
    }

    const normalizedEmail = rawEmail.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(400).json(buildErrorResponse("An account with this email already exists."));
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const baseCurrency = extractSingleString(body.currency) || "PKR";
    const sanitizedLanguages = Array.isArray(body.languages)
      ? body.languages.map((lang) => String(lang).trim()).filter(Boolean)
      : [];

    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: fullName,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          country: extractOptionalString(body.country),
          currency: baseCurrency,
          languages: sanitizedLanguages,
          occupation: extractOptionalString(body.occupation) || "prefer_not_to_say",
          financialGoal: extractOptionalString(body.financialGoal) || "zen_master",
          aiPersona: extractOptionalString(body.aiPersona) || "supportive_coach",
          isOnboardingCompleted: true,
          workspaces: {
            create: [
              {
                name: "Personal",
                currency: baseCurrency,
                categories: { create: formatDefaultCategories(SHARED_DEFAULT_PERSONAL_CATEGORIES) },
              },
              {
                name: "Business",
                currency: baseCurrency,
                categories: { create: formatDefaultCategories(SHARED_DEFAULT_BUSINESS_CATEGORIES) },
              },
            ],
          },
        },
        include: {
          workspaces: true,
        },
      });

      await tx.verificationToken.create({
        data: {
          tokenHash,
          type: "EMAIL_VERIFICATION",
          identifier: createdUser.email,
          expiresAt: tokenExpiration,
        },
      });

      return createdUser;
    });

    const verificationUrl = `${APP_FRONTEND_URL}/verify-email?token=${rawVerifyToken}`;
    sendVerificationEmail(newUser.email, newUser.name, verificationUrl).catch((err: unknown) =>
      console.error("Async Verification Email Failure:", err)
    );

    const token = await generateSessionToken(newUser.id, newUser.email);
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
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
        isOnboardingCompleted: newUser.isOnboardingCompleted,
        createdAt: newUser.createdAt,
      },
      workspaces: newUser.workspaces,
    });
  } catch (error: unknown) {
    console.error("Register Controller Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error during registration."));
  }
};

/**
 * POST /api/auth/login
 */
export const loginUser = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const rawEmail = extractSingleString(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!rawEmail || !password) {
      res.status(400).json(buildErrorResponse("Please provide both email and password."));
      return;
    }

    const normalizedEmail = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json(buildErrorResponse("Invalid email or password."));
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json(
        buildErrorResponse("This account was created with Google Sign-In. Please click 'Sign in with Google'.")
      );
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json(buildErrorResponse("Invalid email or password."));
      return;
    }

    const token = await generateSessionToken(user.id, user.email);
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Login successful!",
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
        aiPersona: user.aiPersona,
        isOnboardingCompleted: user.isOnboardingCompleted,
      },
    });
  } catch (error: unknown) {
    console.error("Login Controller Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error during login."));
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized. Session invalid."));
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
        avatarUrl: true,
        isOnboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User profile not found."));
      return;
    }

    res.status(200).json({ message: "Profile retrieved successfully.", user });
  } catch (error: unknown) {
    console.error("GetMe Controller Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error fetching profile."));
  }
};

/**
 * POST /api/auth/logout
 */
export const logoutUser = async (_req: Request, res: ExpressResponse): Promise<void> => {
  try {
    res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error: unknown) {
    console.error("Logout Controller Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error during logout."));
  }
};

/**
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized"));
      return;
    }

    const body = req.body as UpdateProfileRequestBody;
    const updateData: Prisma.UserUpdateInput = {};

    if (body.name !== undefined) updateData.name = extractSingleString(body.name) || "";
    if (body.country !== undefined) updateData.country = extractOptionalString(body.country);
    if (body.currency !== undefined) updateData.currency = extractSingleString(body.currency) || "PKR";
    if (body.languages !== undefined && Array.isArray(body.languages)) {
      updateData.languages = body.languages.map((lang) => String(lang).trim()).filter(Boolean);
    }
    if (body.occupation !== undefined) updateData.occupation = extractOptionalString(body.occupation);
    if (body.financialGoal !== undefined) updateData.financialGoal = extractOptionalString(body.financialGoal);
    if (body.aiPersona !== undefined) updateData.aiPersona = extractOptionalString(body.aiPersona);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        avatarUrl: true,
        isOnboardingCompleted: true,
        createdAt: true,
      },
    });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error: unknown) {
    console.error("Update Profile Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error updating profile."));
  }
};

/**
 * POST /api/auth/change-password
 */
export const changePassword = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized"));
      return;
    }

    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      res.status(400).json(buildErrorResponse("Current password and new password are required."));
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json(buildErrorResponse("New password must be at least 8 characters long."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json(buildErrorResponse("User not found."));
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json(buildErrorResponse("This account uses Google OAuth and does not have a local password."));
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json(buildErrorResponse("Current password is incorrect."));
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    sendSecurityAlertEmail(user.email, user.name, "Account Password Changed").catch((err: unknown) =>
      console.error("Async Security Alert Failure:", err)
    );

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error: unknown) {
    console.error("Change Password Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error updating password."));
  }
};

/**
 * POST /api/auth/request-password-reset
 */
export const requestPasswordReset = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const rawEmail = extractSingleString(req.body.email);
    if (!rawEmail) {
      res.status(400).json(buildErrorResponse("Email address is required."));
      return;
    }

    const normalizedEmail = rawEmail.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const genericResponse = {
      message: "If an account exists with that email, a password reset link has been sent.",
    };

    if (!user) {
      res.status(200).json(genericResponse);
      return;
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email, type: "PASSWORD_RESET" },
    }).catch(() => {});

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        type: "PASSWORD_RESET",
        identifier: user.email,
        expiresAt,
      },
    });

    const recoveryLink = `${APP_FRONTEND_URL}/reset-password?token=${rawResetToken}`;
    await sendPasswordResetEmail(user.email, user.name, recoveryLink);

    res.status(200).json(genericResponse);
  } catch (error: unknown) {
    console.error("Request Password Reset Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error handling reset request."));
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetForgottenPassword = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const rawToken = extractSingleString(req.body.token);
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!rawToken || !newPassword) {
      res.status(400).json(buildErrorResponse("Token and new password are required."));
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json(buildErrorResponse("New password must be at least 8 characters long."));
      return;
    }

    const computedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash },
    });

    if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
      res.status(400).json(buildErrorResponse("Invalid or expired password reset link."));
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      res.status(400).json(buildErrorResponse("Reset link has expired. Please request a new one."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: tokenRecord.identifier } });
    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    res.status(200).json({ message: "Password updated successfully! You can now log in." });
  } catch (error: unknown) {
    console.error("Reset Password Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error resetting password."));
  }
};

/**
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const rawToken = extractSingleString(req.body.token);
    if (!rawToken) {
      res.status(400).json(buildErrorResponse("Verification token is required."));
      return;
    }

    const computedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash },
    });

    if (!tokenRecord || tokenRecord.type !== "EMAIL_VERIFICATION") {
      res.status(400).json(buildErrorResponse("Invalid or expired verification link."));
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      res.status(400).json(buildErrorResponse("Verification link expired. Please log in to resend."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: tokenRecord.identifier } });
    if (!user) {
      res.status(404).json(buildErrorResponse("User account not found."));
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    res.status(200).json({ message: "Email verified successfully! Your account is activated." });
  } catch (error: unknown) {
    console.error("Verify Email Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error verifying email."));
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: GOOGLE OAUTH CONTROLLERS ===
   ========================================================================== */

/**
 * GET /api/auth/google
 */
export const redirectToGoogle = (_req: Request, res: ExpressResponse): void => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json(buildErrorResponse("Google OAuth credentials missing on server."));
    return;
  }

  const stateToken = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  const rootAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const queryOptions = new URLSearchParams({
    redirect_uri: GOOGLE_CALLBACK_URL,
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    state: stateToken,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  });

  res.redirect(`${rootAuthUrl}?${queryOptions.toString()}`);
};

/**
 * GET /api/auth/google/callback
 */
export const handleGoogleCallback = async (req: Request, res: ExpressResponse): Promise<void> => {
  const code = extractSingleString(req.query.code);
  const state = extractSingleString(req.query.state);
  const storedState = extractSingleString(req.cookies?.oauth_state);

  res.clearCookie("oauth_state");

  if (!state || !storedState || state !== storedState) {
    res.status(400).send("OAuth authentication failed: Invalid state parameter.");
    return;
  }

  if (!code) {
    res.status(400).send("Authorization code missing from Google callback.");
    return;
  }

  try {
    const tokenResponse = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenBundle = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !tokenBundle.access_token) {
      console.error("Google Token Exchange Failed:", tokenBundle);
      res.status(500).send("Google authentication handshake failed.");
      return;
    }

    const profileResponse = await fetchWithTimeout("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenBundle.access_token}` },
    });

    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!profileResponse.ok || !profile.email || !profile.sub) {
      res.status(500).send("Failed to retrieve profile data from Google.");
      return;
    }

    const { sub: googleUserId, email, name, picture } = profile;
    const normalizedEmail = email.trim().toLowerCase();

    let activeUser = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: "GOOGLE",
            providerAccountId: googleUserId,
          },
        },
      },
    });

    if (!activeUser) {
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingEmailUser) {
        await prisma.account.create({
          data: {
            userId: existingEmailUser.id,
            provider: "GOOGLE",
            providerAccountId: googleUserId,
          },
        });

        if (!existingEmailUser.avatarUrl && picture) {
          await prisma.user.update({
            where: { id: existingEmailUser.id },
            data: { avatarUrl: picture },
          });
        }
        activeUser = existingEmailUser;
      } else {
        activeUser = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: name || "RakhoKhata User",
              email: normalizedEmail,
              passwordHash: null,
              avatarUrl: picture || null,
              isEmailVerified: true,
              emailVerifiedAt: new Date(),
              currency: "PKR",
              occupation: "prefer_not_to_say",
              financialGoal: "zen_master",
              aiPersona: "supportive_coach",
              isOnboardingCompleted: false,
              workspaces: {
                create: [
                  {
                    name: "Personal",
                    currency: "PKR",
                    categories: { create: formatDefaultCategories(SHARED_DEFAULT_PERSONAL_CATEGORIES) },
                  },
                  {
                    name: "Business",
                    currency: "PKR",
                    categories: { create: formatDefaultCategories(SHARED_DEFAULT_BUSINESS_CATEGORIES) },
                  },
                ],
              },
            },
          });

          await tx.account.create({
            data: {
              userId: newUser.id,
              provider: "GOOGLE",
              providerAccountId: googleUserId,
            },
          });

          return newUser;
        });
      }
    }

    if (!activeUser) {
      res.status(500).send("Authentication failed to provision user record.");
      return;
    }

    const token = await generateSessionToken(activeUser.id, activeUser.email);
    res.cookie("token", token, COOKIE_OPTIONS);

    const redirectPath = activeUser.isOnboardingCompleted ? "/dashboard" : "/onboarding";
    res.redirect(`${APP_FRONTEND_URL}${redirectPath}`);
  } catch (error: unknown) {
    console.error("Google Callback Controller Error:", error);
    res.status(500).send("Internal server error processing Google authentication.");
  }
};

/**
 * POST /api/auth/complete-onboarding
 */
export const completeOnboarding = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized. Missing user session."));
      return;
    }

    const body = req.body as Record<string, unknown>;
    const targetCurrency = extractSingleString(body.currency) || "PKR";

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          country: extractOptionalString(body.country),
          currency: targetCurrency,
          languages: Array.isArray(body.languages)
            ? body.languages.map((lang) => String(lang).trim()).filter(Boolean)
            : [],
          occupation: extractOptionalString(body.occupation) || "prefer_not_to_say",
          financialGoal: extractOptionalString(body.financialGoal) || "zen_master",
          aiPersona: extractOptionalString(body.aiPersona) || "supportive_coach",
          isOnboardingCompleted: true,
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
          isOnboardingCompleted: true,
          createdAt: true,
        },
      });

      await tx.workspace.updateMany({
        where: { userId },
        data: { currency: targetCurrency },
      });

      return user;
    });

    res.status(200).json({ message: "Onboarding completed successfully!", user: updatedUser });
  } catch (error: unknown) {
    console.error("Complete Onboarding Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error completing onboarding."));
  }
};

/**
 * GET /api/auth/exchange-rates
 */
export const getExchangeRates = async (_req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!apiKey) {
      res.status(500).json(buildErrorResponse("Exchange rate service is not configured on the server."));
      return;
    }

    const response = await fetchWithTimeout(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);

    if (!response.ok) {
      res.status(response.status).json(buildErrorResponse("Failed to fetch exchange rates from provider."));
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: unknown) {
    console.error("Exchange Rate Proxy Error:", error);
    res.status(500).json(buildErrorResponse("Internal server error fetching exchange rates."));
  }
};
/* === SECTION 4 END === */