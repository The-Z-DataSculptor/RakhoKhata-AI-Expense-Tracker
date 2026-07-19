// Backend/src/controllers/authController.ts

/* ==========================================================================
   === SECTION 1: IMPORTS ===
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
  sendSecurityAlertEmail 
} from "../services/emailService";
// Centralized Source of Truth Categories Import (Now inherits Unassigned perfectly!)
import { 
  SHARED_DEFAULT_PERSONAL_CATEGORIES, 
  SHARED_DEFAULT_BUSINESS_CATEGORIES 
} from "./workspaceController";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: STRATEGIC CONTROLLER CONFIGURATIONS & UTILITIES ===
   ========================================================================== */
const PASETO_SECRET = process.env.PASETO_SECRET || "k4.local.abcdefghijklmnopqrstuvwxyz01234567890123456789";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

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
        isOnboardingCompleted: true, // Manual registrations fill this out on signup, bypassing onboarding
        workspaces: {
          create: [
            { 
              name: "Personal", 
              currency: baseCurrency,
              categories: {
                create: SHARED_DEFAULT_PERSONAL_CATEGORIES 
              }
            },
            { 
              name: "Business", 
              currency: baseCurrency,
              categories: {
                create: SHARED_DEFAULT_BUSINESS_CATEGORIES 
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
        isOnboardingCompleted: true,
        createdAt: true,
        workspaces: true
      },
    });

    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");
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
    
    sendVerificationEmail(newUser.email, newUser.name, verificationUrl).catch(err => {
      console.error("Async Verification Dispatch Error:", err);
    });

    const expirationTime = new Date(Date.now() + COOKIE_OPTIONS.maxAge).toISOString();
    const token = await encrypt(getPasetoKey(), { 
      userId: newUser.id, 
      email: newUser.email, 
      exp: expirationTime 
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "User registered successfully! Please check your email to verify your account profile.",
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

    // 🛡️ SHIELD DEFENSE: Gracefully intercept if user profile was registered via passwordless Google Auth
    if (!user.passwordHash) {
      res.status(400).json({ 
        error: "This account was registered using Google Sign-In. Please click the 'Sign in with Google' option." 
      });
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
        aiPersona: user.aiPersona,
        isOnboardingCompleted: user.isOnboardingCompleted
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
        avatarUrl: true, 
        isOnboardingCompleted: true, 
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
   === SECTION 7: UPDATE PROFILE CONTROLLER ===
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
        avatarUrl: true, isOnboardingCompleted: true, createdAt: true
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
   === SECTION 8: CHANGE PASSWORD CONTROLLER ===
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

    if (!user.passwordHash) {
      res.status(400).json({ 
        error: "This account uses Google Auth and does not have a local operational password. Request a password reset to establish credentials." 
      });
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

    sendSecurityAlertEmail(user.email, user.name, "Account Password").catch(err => {
      console.error("Async Security Warning Failure Trigger:", err);
    });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: "Internal server error changing password." });
  }
};
/* === SECTION 8 END === */

/* ==========================================================================
   === SECTION 8A: FORGOT PASSWORD RECOVERY MANAGEMENT SYSTEM ===
   ========================================================================== */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email address parameter is required." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      res.status(200).json({ message: "If that account exists in our system, a recovery link has been dispatched." });
      return;
    }

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");
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

    res.status(200).json({ message: "If that account exists in our system, a recovery link has been dispatched." });
  } catch (error) {
    console.error("Request Password Reset System Failure:", error);
    res.status(500).json({ error: "Internal server error processing identity token details request." });
  }
};

export const resetForgottenPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: "Missing required token string parameters or new password string details." });
      return;
    }

    const computedHash = crypto.createHash("sha256").update(token).digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash }
    });

    if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
      res.status(400).json({ error: "Invalid or corrupt recovery link signature metadata." });
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      res.status(400).json({ error: "Recovery link has expired. Please request a new token identifier." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: tokenRecord.identifier } });
    if (!user) {
      res.status(404).json({ error: "Target user profile account details no longer exist in our tables." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const updatedHashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: updatedHashedPassword }
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id }
      })
    ]);

    res.status(200).json({ message: "Password updated successfully! You can now log into your account." });
  } catch (error) {
    console.error("Execute Password Update Controller Exception:", error);
    res.status(500).json({ error: "Internal server error applying account credentials updates." });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Missing account verification signature parameter tokens." });
      return;
    }

    const computedHash = crypto.createHash("sha256").update(token).digest("hex");

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: computedHash }
    });

    if (!tokenRecord || tokenRecord.type !== "EMAIL_VERIFICATION") {
      res.status(400).json({ error: "Invalid or corrupt email verification link parameters." });
      return;
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      res.status(400).json({ error: "Verification window has expired. Please log in to request a fresh token link." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: tokenRecord.identifier } });
    if (!user) {
      res.status(404).json({ error: "Target user profile account record no longer exists." });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id }
      })
    ]);

    res.status(200).json({ message: "Email verification successful! Your profile workspace layers are fully unfurled." });
  } catch (error) {
    console.error("Process Email Verification Exception Error:", error);
    res.status(500).json({ error: "Internal server error handling account verification requirements." });
  }
};
/* === SECTION 8A END === */

/* ==========================================================================
   === SECTION 9: UNIFIED GOOGLE OAUTH FLOW CORE SYSTEM ===
   ========================================================================== */
export const redirectToGoogle = (req: Request, res: Response): void => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ error: "Google OAuth configuration keys are missing on the host server environment." });
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
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ")
  };

  res.redirect(`${rootAuthUrl}?${new URLSearchParams(queryOptions).toString()}`);
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  const codeTokenString = req.query.code as string;

  if (!codeTokenString) {
    res.status(400).send("Authorization validation callback token is missing from the Google stream.");
    return;
  }

  try {
    const tokenExchangeResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: codeTokenString,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code"
      })
    });

    const tokenBundle = await tokenExchangeResponse.json();
    if (!tokenExchangeResponse.ok || !tokenBundle.access_token) {
      console.error("Google Token Exchange Crash Output Log:", tokenBundle);
      res.status(500).send("Authentication mapping failed during Google token handshake.");
      return;
    }

    const userProfileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenBundle.access_token}` }
    });

    const profileData = await userProfileResponse.json();
    if (!userProfileResponse.ok || !profileData.email) {
      res.status(500).send("Identity lookup breakdown extracting user credentials profiles from Google.");
      return;
    }

    const { sub: googleUserIdCode, email, name, picture: profilePictureUrl } = profileData;
    const normalizedEmail = email.trim().toLowerCase();

    let activeUserInstance = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: "GOOGLE",
            providerAccountId: googleUserIdCode
          }
        }
      }
    });

    if (!activeUserInstance) {
      const existingEmailUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (existingEmailUser) {
        await prisma.account.create({
          data: {
            userId: existingEmailUser.id,
            provider: "GOOGLE",
            providerAccountId: googleUserIdCode
          }
        });
        
        if (!existingEmailUser.avatarUrl && profilePictureUrl) {
          await prisma.user.update({
            where: { id: existingEmailUser.id },
            data: { avatarUrl: profilePictureUrl }
          });
        }
        activeUserInstance = existingEmailUser;
      } else {
        activeUserInstance = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: name || "RakhoKhata User",
              email: normalizedEmail,
              passwordHash: null, 
              avatarUrl: profilePictureUrl || null,
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
                      create: SHARED_DEFAULT_PERSONAL_CATEGORIES
                    }
                  },
                  {
                    name: "Business",
                    currency: "PKR",
                    categories: {
                      create: SHARED_DEFAULT_BUSINESS_CATEGORIES
                    }
                  }
                ]
              }
            }
          });

          await tx.account.create({
            data: {
              userId: newUser.id,
              provider: "GOOGLE",
              providerAccountId: googleUserIdCode
            }
          });

          return newUser;
        });
      }
    }

    const expirationTime = new Date(Date.now() + COOKIE_OPTIONS.maxAge).toISOString();
    const token = await encrypt(getPasetoKey(), { 
      userId: activeUserInstance.id, 
      email: activeUserInstance.email, 
      exp: expirationTime 
    });

    res.cookie("token", token, COOKIE_OPTIONS);

    if (!activeUserInstance.isOnboardingCompleted) {
      res.redirect("http://localhost:3000/onboarding");
    } else {
      res.redirect("http://localhost:3000/dashboard");
    }

  } catch (error) {
    console.error("Critical System Interception Failure inside Google Auth Callback Sequence Code:", error);
    res.status(500).send("Internal authentication framework transaction server error.");
  }
};
/* === SECTION 9 END === */

/* ==========================================================================
   === SECTION 9B: SUBMIT COMPLETED ONBOARDING GATE PROFILE ===
   ========================================================================== */
export const completeOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access profile indicator context missing." });
      return;
    }

    const { country, currency, languages, occupation, financialGoal, aiPersona } = req.body;
    const targetCurrency = currency || "PKR";

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          country: country || null,
          currency: targetCurrency,
          languages: languages || [],
          occupation: occupation || "prefer_not_to_say",
          financialGoal: financialGoal || "zen_master",
          aiPersona: aiPersona || "supportive_coach",
          isOnboardingCompleted: true 
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
          createdAt: true
        }
      });

      await tx.workspace.updateMany({
        where: { userId: userId },
        data: { currency: targetCurrency }
      });

      return user;
    });

    res.status(200).json({ message: "Onboarding completed successfully!", user: updatedUser });
  } catch (error) {
    console.error("Complete Onboarding Controller Exception:", error);
    res.status(500).json({ error: "Internal server error applying onboarding profile configurations." });
  }
};
/* === SECTION 9B END === */

/* ==========================================================================
   === SECTION 10: LIVE EXCHANGE RATES PROXY CONTROLLER ===
   ========================================================================== */
/**
 * 🚀 SECURE SERVER SIDE PROXY: Fetches real-time exchange rates securely 
 * from the external API to hide your private key context from the public canvas.
 */
export const getExchangeRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    
    if (!apiKey) {
      console.error("❌ EXCHANGERATE_API_KEY environment configuration variable missing on backend server.");
      res.status(500).json({ error: "Exchange registry credential configurations missing on the host server." });
      return;
    }

    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
    
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to extract fresh metric states from currency registry server." });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Exchange Rate Proxy Controller Exception Execution Failure:", error);
    res.status(500).json({ error: "Internal server error handling cross-border rate synchronization." });
  }
};
/* === SECTION 10 END === */