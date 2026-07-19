// Backend/src/controllers/authController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { encrypt } from "paseto-ts/v4";
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
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

// ----- Google OAuth response shapes -----
interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

// ----- Internal helper types -----
interface ProfileUpdateFields {
  name?: string;
  email?: string;
  country?: string;
  currency?: string;
  languages?: string[];
  occupation?: string;
  financialGoal?: string;
  aiPersona?: string;
}

// ----- PASETO secret & key generation -----
const PASETO_SECRET =
  process.env.PASETO_SECRET ||
  "k4.local.abcdefghijklmnopqrstuvwxyz01234567890123456789";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

/**
 * Generates the 52‑character PASERK key required by paseto‑ts.
 */
function getPasetoKey(): string {
  const hash = crypto.createHash("sha256").update(PASETO_SECRET).digest();
  return `k4.local.${hash.toString("base64url")}`;
}

// Central cookie configuration – always HttpOnly, SameSite Lax
const COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
} = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

/**
 * Helper: builds a safe error object to avoid leaking internals.
 */
function buildSafeError(message: string): { error: string } {
  return { error: message };
}

// ---------------------------------------------------------------------------
// REGISTER USER
// ---------------------------------------------------------------------------
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      aiPersona,
    } = req.body as Record<string, unknown>;

    // ----- Input validation -----
    if (!fullName || !email || !password) {
      res.status(400).json(buildSafeError("Please fill in all required fields."));
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      res
        .status(400)
        .json(buildSafeError("A user with this email already exists."));
      return;
    }

    // ----- Hash password -----
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const baseCurrency = String(currency || "PKR");

    // ----- Create user with default workspaces -----
    const newUser = await prisma.user.create({
      data: {
        name: String(fullName),
        email: normalizedEmail,
        passwordHash: hashedPassword,
        country: country ? String(country) : null,
        currency: baseCurrency,
        languages: Array.isArray(languages) ? languages : [],
        occupation: String(occupation || "prefer_not_to_say"),
        financialGoal: String(financialGoal || "zen_master"),
        aiPersona: String(aiPersona || "supportive_coach"),
        isOnboardingCompleted: true,
        workspaces: {
          create: [
            {
              name: "Personal",
              currency: baseCurrency,
              categories: { create: SHARED_DEFAULT_PERSONAL_CATEGORIES },
            },
            {
              name: "Business",
              currency: baseCurrency,
              categories: { create: SHARED_DEFAULT_BUSINESS_CATEGORIES },
            },
          ],
        },
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
        workspaces: true,
      },
    });

    // ----- Send verification email (fire‑and‑forget) -----
    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawVerifyToken)
      .digest("hex");
    const validationDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        type: "EMAIL_VERIFICATION",
        identifier: newUser.email,
        expiresAt: validationDeadline,
      },
    });

    const verificationUrl = `http://localhost:3000/verify-email?token=${rawVerifyToken}`;
    sendVerificationEmail(newUser.email, newUser.name, verificationUrl).catch(
      (err: unknown) => console.error("Async Verification Dispatch Error:", err)
    );

    // ----- Create PASETO token & set cookie -----
    const expirationTime = new Date(
      Date.now() + COOKIE_OPTIONS.maxAge
    ).toISOString();
    const token = await encrypt(getPasetoKey(), {
      userId: newUser.id,
      email: newUser.email,
      exp: expirationTime,
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message:
        "User registered successfully! Please check your email to verify your account.",
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
    console.error("Signup Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error during registration."));
  }
};

// ---------------------------------------------------------------------------
// LOGIN USER
// ---------------------------------------------------------------------------
export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body as Record<string, unknown>;

    if (!email || !password) {
      res
        .status(400)
        .json(buildSafeError("Please enter both email and password."));
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      res
        .status(401)
        .json(buildSafeError("Invalid email or password credentials."));
      return;
    }

    // If the account was created via Google, there is no password hash
    if (!user.passwordHash) {
      res.status(400).json(
        buildSafeError(
          "This account was registered using Google Sign-In. Please click the 'Sign in with Google' option."
        )
      );
      return;
    }

    const isPasswordMatch = await bcrypt.compare(
      String(password),
      user.passwordHash
    );
    if (!isPasswordMatch) {
      res
        .status(401)
        .json(buildSafeError("Invalid email or password credentials."));
      return;
    }

    // Create PASETO token
    const expirationTime = new Date(
      Date.now() + COOKIE_OPTIONS.maxAge
    ).toISOString();
    const token = await encrypt(getPasetoKey(), {
      userId: user.id,
      email: user.email,
      exp: expirationTime,
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
        aiPersona: user.aiPersona,
        isOnboardingCompleted: user.isOnboardingCompleted,
      },
    });
  } catch (error: unknown) {
    console.error("Login Controller Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error during login verification."));
  }
};

// ---------------------------------------------------------------------------
// GET ME (PROFILE)
// ---------------------------------------------------------------------------
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res
        .status(401)
        .json(
          buildSafeError("Unauthorized access. Valid profile identifier missing.")
        );
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
      res
        .status(404)
        .json(
          buildSafeError("Active database account record could not be found.")
        );
      return;
    }

    res
      .status(200)
      .json({ message: "Authenticated identity verified successfully.", user });
  } catch (error: unknown) {
    console.error("Profile Fetch Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError("Internal server error during profile verification.")
      );
  }
};

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export const logoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Clear the cookie by setting maxAge to 0
    res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    res
      .status(200)
      .json({ message: "Logged out successfully. Secure session revoked." });
  } catch (error: unknown) {
    console.error("Logout Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError("Internal server error during session teardown.")
      );
  }
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------------------------------------
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized"));
      return;
    }

    // Only allow specific fields to be updated
    const allowedFields: Array<keyof ProfileUpdateFields> = [
      "name",
      "email",
      "country",
      "currency",
      "languages",
      "occupation",
      "financialGoal",
      "aiPersona",
    ];
    const updateData: ProfileUpdateFields = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // We trust the client values; validation should be added if needed
        updateData[field] = req.body[field];
      }
    }

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

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error: unknown) {
    console.error("Update Profile Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error updating profile."));
  }
};

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(buildSafeError("Unauthorized"));
      return;
    }

    const { currentPassword, newPassword } = req.body as Record<
      string,
      unknown
    >;
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json(buildSafeError("Current and new password are required."));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json(buildSafeError("User not found."));
      return;
    }

    // Google‑only users have no password
    if (!user.passwordHash) {
      res.status(400).json(
        buildSafeError(
          "This account uses Google Auth and does not have a local password."
        )
      );
      return;
    }

    const isMatch = await bcrypt.compare(
      String(currentPassword),
      user.passwordHash
    );
    if (!isMatch) {
      res
        .status(401)
        .json(buildSafeError("Current password is incorrect."));
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(String(newPassword), salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Fire‑and‑forget security notification
    sendSecurityAlertEmail(user.email, user.name, "Account Password").catch(
      (err: unknown) =>
        console.error("Async Security Warning Failure:", err)
    );

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error: unknown) {
    console.error("Change Password Error:", error);
    res
      .status(500)
      .json(buildSafeError("Internal server error changing password."));
  }
};

// ---------------------------------------------------------------------------
// PASSWORD RESET REQUEST
// ---------------------------------------------------------------------------
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body as Record<string, unknown>;
    if (!email) {
      res
        .status(400)
        .json(buildSafeError("Email address parameter is required."));
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return a generic message to prevent user enumeration
    if (!user) {
      res.status(200).json({
        message:
          "If that account exists, a recovery link has been dispatched.",
      });
      return;
    }

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawResetToken)
      .digest("hex");
    const expirationDeadline = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        tokenHash,
        type: "PASSWORD_RESET",
        identifier: user.email,
        expiresAt: expirationDeadline,
      },
    });

    const recoveryLink = `http://localhost:3000/reset-password?token=${rawResetToken}`;
    await sendPasswordResetEmail(user.email, user.name, recoveryLink);

    res.status(200).json({
      message:
        "If that account exists, a recovery link has been dispatched.",
    });
  } catch (error: unknown) {
    console.error("Request Password Reset System Failure:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error processing identity token request."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// RESET PASSWORD (CONFIRM TOKEN)
// ---------------------------------------------------------------------------
export const resetForgottenPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body as Record<string, unknown>;
    if (!token || !newPassword) {
      res
        .status(400)
        .json(
          buildSafeError(
            "Missing required token or new password."
          )
        );
      return;
    }

    const computedHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash },
    });

    if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
      res
        .status(400)
        .json(buildSafeError("Invalid or corrupt recovery link."));
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Clean up expired token
      await prisma.verificationToken
        .delete({ where: { id: tokenRecord.id } })
        .catch(() => {});
      res
        .status(400)
        .json(buildSafeError("Recovery link expired. Please request a new one."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });
    if (!user) {
      res
        .status(404)
        .json(buildSafeError("Target user account no longer exists."));
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(newPassword), salt);

    // Atomic update: change password and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    res
      .status(200)
      .json({
        message:
          "Password updated successfully! You can now log into your account.",
      });
  } catch (error: unknown) {
    console.error("Execute Password Update Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error applying account credentials updates."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// VERIFY EMAIL
// ---------------------------------------------------------------------------
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body as Record<string, unknown>;
    if (!token) {
      res
        .status(400)
        .json(buildSafeError("Missing account verification token."));
      return;
    }

    const computedHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash },
    });

    if (!tokenRecord || tokenRecord.type !== "EMAIL_VERIFICATION") {
      res
        .status(400)
        .json(buildSafeError("Invalid or corrupt email verification link."));
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken
        .delete({ where: { id: tokenRecord.id } })
        .catch(() => {});
      res
        .status(400)
        .json(
          buildSafeError(
            "Verification window expired. Please log in to request a fresh link."
          )
        );
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });
    if (!user) {
      res
        .status(404)
        .json(buildSafeError("User account no longer exists."));
      return;
    }

    // Atomic: mark email as verified and delete token
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

    res
      .status(200)
      .json({
        message:
          "Email verification successful! Your profile workspace layers are fully activated.",
      });
  } catch (error: unknown) {
    console.error("Process Email Verification Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error handling account verification requirements."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// GOOGLE OAUTH REDIRECT
// ---------------------------------------------------------------------------
export const redirectToGoogle = (req: Request, res: Response): void => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res
      .status(500)
      .json(
        buildSafeError(
          "Google OAuth configuration keys are missing on the server."
        )
      );
    return;
  }

  const rootAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const queryOptions = {
    redirect_uri: GOOGLE_CALLBACK_URL,
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  res.redirect(
    `${rootAuthUrl}?${new URLSearchParams(queryOptions).toString()}`
  );
};

// ---------------------------------------------------------------------------
// GOOGLE OAUTH CALLBACK
// ---------------------------------------------------------------------------
export const handleGoogleCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  const codeToken = req.query.code as string | undefined;

  if (!codeToken) {
    res
      .status(400)
      .send("Authorization validation callback token is missing.");
    return;
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: codeToken,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenBundle: GoogleTokenResponse = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenBundle.access_token) {
      console.error("Google Token Exchange Crash:", tokenBundle);
      res
        .status(500)
        .send("Authentication mapping failed during Google token handshake.");
      return;
    }

    // Fetch user profile from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenBundle.access_token}` },
      }
    );
    const profileData: GoogleUserInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok || !profileData.email) {
      res
        .status(500)
        .send(
          "Identity lookup breakdown extracting user credentials from Google."
        );
      return;
    }

    const { sub: googleUserId, email, name, picture } = profileData;
    const normalizedEmail = email.trim().toLowerCase();

    // Look for an existing user linked with this Google account
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
      // Check if a user with this email already exists
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingEmailUser) {
        // Link the Google account to the existing user
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
        // Create a brand new user within a transaction
        activeUser = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: name || "RakhoKhata User",
              email: normalizedEmail,
              passwordHash: null, // Google‑only account
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
                    categories: {
                      create: SHARED_DEFAULT_PERSONAL_CATEGORIES,
                    },
                  },
                  {
                    name: "Business",
                    currency: "PKR",
                    categories: {
                      create: SHARED_DEFAULT_BUSINESS_CATEGORIES,
                    },
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

    // Create PASETO session token
    const expirationTime = new Date(
      Date.now() + COOKIE_OPTIONS.maxAge
    ).toISOString();
    const token = await encrypt(getPasetoKey(), {
      userId: activeUser.id,
      email: activeUser.email,
      exp: expirationTime,
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    // Redirect based on onboarding status
    if (!activeUser.isOnboardingCompleted) {
      res.redirect("http://localhost:3000/onboarding");
    } else {
      res.redirect("http://localhost:3000/dashboard");
    }
  } catch (error: unknown) {
    console.error(
      "Critical System Interception Failure inside Google Auth Callback:",
      error
    );
    res
      .status(500)
      .send("Internal authentication framework transaction server error.");
  }
};

// ---------------------------------------------------------------------------
// COMPLETE ONBOARDING
// ---------------------------------------------------------------------------
export const completeOnboarding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res
        .status(401)
        .json(buildSafeError("Unauthorized access profile indicator missing."));
      return;
    }

    const { country, currency, languages, occupation, financialGoal, aiPersona } =
      req.body as Record<string, unknown>;
    const targetCurrency = String(currency || "PKR");

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          country: country ? String(country) : null,
          currency: targetCurrency,
          languages: Array.isArray(languages) ? languages : [],
          occupation: String(occupation || "prefer_not_to_say"),
          financialGoal: String(financialGoal || "zen_master"),
          aiPersona: String(aiPersona || "supportive_coach"),
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

      // Sync workspace currency with user's choice
      await tx.workspace.updateMany({
        where: { userId: userId },
        data: { currency: targetCurrency },
      });

      return user;
    });

    res
      .status(200)
      .json({ message: "Onboarding completed successfully!", user: updatedUser });
  } catch (error: unknown) {
    console.error("Complete Onboarding Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error applying onboarding profile configurations."
        )
      );
  }
};

// ---------------------------------------------------------------------------
// LIVE EXCHANGE RATES PROXY
// ---------------------------------------------------------------------------
export const getExchangeRates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!apiKey) {
      console.error(
        "EXCHANGERATE_API_KEY environment variable missing on backend."
      );
      res
        .status(500)
        .json(
          buildSafeError(
            "Exchange registry credential configurations missing on the host server."
          )
        );
      return;
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    );

    if (!response.ok) {
      res
        .status(response.status)
        .json(
          buildSafeError(
            "Failed to extract fresh metric states from currency registry server."
          )
        );
      return;
    }

    const data: unknown = await response.json();
    res.status(200).json(data);
  } catch (error: unknown) {
    console.error("Exchange Rate Proxy Controller Exception:", error);
    res
      .status(500)
      .json(
        buildSafeError(
          "Internal server error handling cross‑border rate synchronization."
        )
      );
  }
};
/* === SECTION 3 END === */