// Backend/src/controllers/authController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & CONFIGURATION ===
   ========================================================================== */
import { Request, Response as ExpressResponse } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { TransactionType, TokenType } from "@prisma/client";
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

// Environment variables with fallback safeguards
const APP_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  `${process.env.BACKEND_PUBLIC_URL || "http://localhost:5000"}/api/auth/google/callback`;

// Secret for signing OAuth state tokens – warn if not set in production
if (!process.env.OAUTH_STATE_SECRET) {
  console.warn(
    "OAUTH_STATE_SECRET not set, using default insecure secret. Please set it in production."
  );
}
const STATE_SECRET = process.env.OAUTH_STATE_SECRET || "change-me-to-a-random-secret";

const EXTERNAL_API_TIMEOUT_MS = 10000;

// Cross-domain cookie settings for separate Hostinger Frontend & Backend subdomains
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
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

async function generateSessionToken(
  userId: string,
  email: string,
  isEmailVerified?: boolean,
  isOnboardingCompleted?: boolean
): Promise<string> {
  const expirationTime = new Date(Date.now() + COOKIE_OPTIONS.maxAge).toISOString();
  return await encryptSessionToken({
    userId,
    email,
    isEmailVerified,
    isOnboardingCompleted,
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

function extractOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
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

function signState(value: string): string {
  const signature = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(value)
    .digest("hex");
  return `${value}.${signature}`;
}

function verifySignedState(signed: string): string | null {
  const parts = signed.split(".");
  if (parts.length !== 2) return null;
  const [value, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(value)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  try {
    if (crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return value;
    }
  } catch {
    // Return null if length or comparisons mismatch
  }
  return null;
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: AUTHENTICATION CONTROLLERS ===
   ========================================================================== */

export const registerUser = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const body = req.body as RegisterRequestBody;
    const fullName = extractSingleString(body.fullName);
    const email = extractSingleString(body.email);
    const password = extractSingleString(body.password);
    const country = extractOptionalString(body.country) ?? null;
    const currency = extractSingleString(body.currency) || "USD";
    const occupation = extractOptionalString(body.occupation) || "prefer_not_to_say";
    const financialGoal = extractOptionalString(body.financialGoal) || "zen_master";
    const aiPersona = extractOptionalString(body.aiPersona) || "supportive_coach";

    const languages: string[] = Array.isArray(body.languages)
      ? body.languages.filter((l): l is string => typeof l === "string" && l.trim().length > 0)
      : [];

    if (!fullName || !email || !password) {
      res.status(400).json(buildErrorResponse("Full name, email, and password are required."));
      return;
    }
    if (password.length < 8) {
      res.status(400).json(buildErrorResponse("Password must be at least 8 characters."));
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      res.status(409).json(buildErrorResponse("An account with this email already exists."));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: normalizedEmail,
          passwordHash,
          country,
          currency,
          languages,
          occupation,
          financialGoal,
          aiPersona,
          isEmailVerified: false,
          isOnboardingCompleted: true,
          workspaces: {
            create: [
              {
                name: "Personal",
                currency,
                categories: { create: formatDefaultCategories(SHARED_DEFAULT_PERSONAL_CATEGORIES) },
              },
              {
                name: "Business",
                currency,
                categories: { create: formatDefaultCategories(SHARED_DEFAULT_BUSINESS_CATEGORIES) },
              },
            ],
          },
        },
      });

      await tx.verificationToken.create({
        data: {
          tokenHash: hashToken(rawVerificationToken),
          type: TokenType.EMAIL_VERIFICATION,
          identifier: normalizedEmail,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return user;
    });

    const verifyLink = `${APP_FRONTEND_URL}/verify-email?token=${rawVerificationToken}`;
    await sendVerificationEmail(normalizedEmail, newUser.name, verifyLink);

    res.status(201).json({
      message: "Account created successfully. Please verify your email.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isEmailVerified: newUser.isEmailVerified,
        isOnboardingCompleted: newUser.isOnboardingCompleted,
      },
    });
  } catch (error: unknown) {
    console.error("Register User Error:", error);
    res.status(500).json(buildErrorResponse("Failed to create account. Please try again."));
  }
};

export const loginUser = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const email = extractSingleString((req.body as { email?: unknown }).email);
    const password = extractSingleString((req.body as { password?: unknown }).password);

    if (!email || !password) {
      res.status(400).json(buildErrorResponse("Email and password are required."));
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.passwordHash) {
      res.status(401).json(buildErrorResponse("Invalid email or password."));
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json(buildErrorResponse("Invalid email or password."));
      return;
    }

    const token = await generateSessionToken(
      user.id,
      user.email,
      user.isEmailVerified,
      user.isOnboardingCompleted
    );
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isOnboardingCompleted: user.isOnboardingCompleted,
      },
    });
  } catch (error: unknown) {
    console.error("Login User Error:", error);
    res.status(500).json(buildErrorResponse("Login failed. Please try again."));
  }
};

export const getMe = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        country: true,
        currency: true,
        languages: true,
        occupation: true,
        financialGoal: true,
        aiPersona: true,
        isEmailVerified: true,
        isOnboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json(buildErrorResponse("User not found."));
      return;
    }

    res.status(200).json({ user });
  } catch (error: unknown) {
    console.error("Get Me Error:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch user profile."));
  }
};

export const logoutUser = (_req: AuthenticatedRequest, res: ExpressResponse): void => {
  res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully." });
};

export const updateProfile = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized."));
      return;
    }

    const body = req.body as UpdateProfileRequestBody;
    const updateData: Record<string, unknown> = {};

    const name = extractSingleString(body.name);
    if (name !== undefined) updateData.name = name;

    const country = extractOptionalString(body.country);
    if (country !== undefined) updateData.country = country;

    const currency = extractSingleString(body.currency);
    if (currency !== undefined) updateData.currency = currency;

    if (Array.isArray(body.languages)) {
      updateData.languages = body.languages.filter(
        (l): l is string => typeof l === "string" && l.trim().length > 0
      );
    }

    const occupation = extractOptionalString(body.occupation);
    if (occupation !== undefined) updateData.occupation = occupation;

    const financialGoal = extractOptionalString(body.financialGoal);
    if (financialGoal !== undefined) updateData.financialGoal = financialGoal;

    const aiPersona = extractOptionalString(body.aiPersona);
    if (aiPersona !== undefined) updateData.aiPersona = aiPersona;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        currency: true,
        languages: true,
        occupation: true,
        financialGoal: true,
        aiPersona: true,
        avatarUrl: true,
      },
    });

    res.status(200).json({ message: "Profile updated successfully.", user: updatedUser });
  } catch (error: unknown) {
    console.error("Update Profile Error:", error);
    res.status(500).json(buildErrorResponse("Failed to update profile."));
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized."));
      return;
    }

    const currentPassword = extractSingleString((req.body as { currentPassword?: unknown }).currentPassword);
    const newPassword = extractSingleString((req.body as { newPassword?: unknown }).newPassword);

    if (!currentPassword || !newPassword) {
      res.status(400).json(buildErrorResponse("Current password and new password are required."));
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json(buildErrorResponse("Password must be at least 8 characters."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      res.status(400).json(buildErrorResponse("Unable to change password for this account."));
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json(buildErrorResponse("Current password is incorrect."));
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await sendSecurityAlertEmail(user.email, user.name, "Your password was changed.");

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error: unknown) {
    console.error("Change Password Error:", error);
    res.status(500).json(buildErrorResponse("Failed to change password."));
  }
};

export const requestPasswordReset = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const email = extractSingleString((req.body as { email?: unknown }).email);
    if (!email) {
      res.status(400).json(buildErrorResponse("Email is required."));
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      res.status(200).json({ message: "If an account exists, a reset link has been sent." });
      return;
    }

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        type: TokenType.PASSWORD_RESET,
      },
    });

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        tokenHash: hashToken(rawResetToken),
        type: TokenType.PASSWORD_RESET,
        identifier: normalizedEmail,
        expiresAt: resetExpires,
      },
    });

    const resetLink = `${APP_FRONTEND_URL}/reset-password?token=${rawResetToken}`;
    await sendPasswordResetEmail(normalizedEmail, user.name, resetLink);

    res.status(200).json({ message: "If an account exists, a reset link has been sent." });
  } catch (error: unknown) {
    console.error("Request Password Reset Error:", error);
    res.status(500).json(buildErrorResponse("Failed to process password reset request."));
  }
};

export const resetForgottenPassword = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const token = extractSingleString((req.body as { token?: unknown }).token);
    const newPassword = extractSingleString((req.body as { newPassword?: unknown }).newPassword);

    if (!token || !newPassword) {
      res.status(400).json(buildErrorResponse("Token and new password are required."));
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json(buildErrorResponse("Password must be at least 8 characters."));
      return;
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        tokenHash: hashToken(token),
        type: TokenType.PASSWORD_RESET,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      res.status(400).json(buildErrorResponse("Invalid or expired reset token."));
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { passwordHash: newHash },
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    res.status(200).json({ message: "Password reset successfully. Please log in." });
  } catch (error: unknown) {
    console.error("Reset Forgotten Password Error:", error);
    res.status(500).json(buildErrorResponse("Failed to reset password."));
  }
};

export const verifyEmail = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const token = extractSingleString((req.body as { token?: unknown }).token);
    if (!token) {
      res.status(400).json(buildErrorResponse("Verification token is required."));
      return;
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        tokenHash: hashToken(token),
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      res.status(400).json(buildErrorResponse("Invalid or expired verification token."));
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error: unknown) {
    console.error("Verify Email Error:", error);
    res.status(500).json(buildErrorResponse("Failed to verify email."));
  }
};

export const resendVerificationEmail = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json(buildErrorResponse("User not found."));
      return;
    }
    if (user.isEmailVerified) {
      res.status(400).json(buildErrorResponse("Email is already verified."));
      return;
    }

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        type: TokenType.EMAIL_VERIFICATION,
        identifier: user.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const verifyLink = `${APP_FRONTEND_URL}/verify-email?token=${rawToken}`;
    await sendVerificationEmail(user.email, user.name, verifyLink);

    res.status(200).json({ message: "Verification email resent successfully." });
  } catch (error: unknown) {
    console.error("Resend Verification Email Error:", error);
    res.status(500).json(buildErrorResponse("Failed to resend verification email."));
  }
};

export const completeOnboarding = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildErrorResponse("Unauthorized."));
      return;
    }

    const body = req.body as RegisterRequestBody;
    const country = extractOptionalString(body.country) ?? null;
    const currency = extractSingleString(body.currency) || "USD";
    const occupation = extractOptionalString(body.occupation) || "prefer_not_to_say";
    const financialGoal = extractOptionalString(body.financialGoal) || "zen_master";
    const aiPersona = extractOptionalString(body.aiPersona) || "supportive_coach";
    
    const languages: string[] = Array.isArray(body.languages)
      ? body.languages.filter((l): l is string => typeof l === "string" && l.trim().length > 0)
      : [];

    await prisma.user.update({
      where: { id: userId },
      data: {
        country,
        currency,
        languages,
        occupation,
        financialGoal,
        aiPersona,
        isOnboardingCompleted: true,
      },
    });

    res.status(200).json({ message: "Onboarding completed successfully." });
  } catch (error: unknown) {
    console.error("Complete Onboarding Error:", error);
    res.status(500).json(buildErrorResponse("Failed to complete onboarding."));
  }
};

export const getExchangeRates = async (_req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const response = await fetchWithTimeout(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { method: "GET" }
    );
    const data = (await response.json()) as { rates?: Record<string, number> };
    res.status(200).json({ rates: data.rates || {} });
  } catch (error: unknown) {
    console.error("Get Exchange Rates Error:", error);
    res.status(500).json(buildErrorResponse("Failed to fetch exchange rates."));
  }
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: GOOGLE OAUTH CONTROLLERS ===
   ========================================================================== */

export const redirectToGoogle = (_req: Request, res: ExpressResponse): void => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json(buildErrorResponse("Google OAuth credentials missing on server."));
    return;
  }

  const stateValue = crypto.randomBytes(16).toString("hex");
  const stateToken = signState(stateValue);

  res.cookie("oauth_state", stateToken, {
    ...COOKIE_OPTIONS,
    maxAge: 10 * 60 * 1000,
    path: "/",
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

export const handleGoogleCallback = async (req: Request, res: ExpressResponse): Promise<void> => {
  const code = extractSingleString(req.query.code);
  const stateFromQuery = extractSingleString(req.query.state);
  const stateFromCookie = extractSingleString(req.cookies?.oauth_state);

  res.clearCookie("oauth_state", { path: "/" });

  const verifiedStateValue = stateFromQuery ? verifySignedState(stateFromQuery) : null;

  if (!verifiedStateValue) {
    if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
      console.error("OAuth state mismatch - no valid signature and cookie mismatch");
      res.status(400).send("OAuth authentication failed: Invalid state parameter.");
      return;
    }
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
              name: name || "RakhoKhaata User",
              email: normalizedEmail,
              passwordHash: null,
              avatarUrl: picture || null,
              isEmailVerified: true,
              emailVerifiedAt: new Date(),
              currency: "USD",
              occupation: "prefer_not_to_say",
              financialGoal: "zen_master",
              aiPersona: "supportive_coach",
              isOnboardingCompleted: false,
              workspaces: {
                create: [
                  {
                    name: "Personal",
                    currency: "USD",
                    categories: { create: formatDefaultCategories(SHARED_DEFAULT_PERSONAL_CATEGORIES) },
                  },
                  {
                    name: "Business",
                    currency: "USD",
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

    const token = await generateSessionToken(
      activeUser.id,
      activeUser.email,
      activeUser.isEmailVerified,
      activeUser.isOnboardingCompleted
    );
    res.cookie("token", token, COOKIE_OPTIONS);

    const redirectPath = activeUser.isOnboardingCompleted ? "/dashboard" : "/onboarding";
    res.redirect(`${APP_FRONTEND_URL}${redirectPath}`);
  } catch (error: unknown) {
    console.error("Google Callback Controller Error:", error);
    res.status(500).send("Internal server error processing Google authentication.");
  }
};
/* === SECTION 4 END === */