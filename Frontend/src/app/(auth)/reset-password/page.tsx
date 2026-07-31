// src/app/(auth)/reset-password/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import styles from "../login/page.module.css"; // Reuses login layout styles

/**
 * Checks whether a password meets the minimum length requirement.
 * The backend performs additional validation (complexity, history, etc.).
 */
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: RESET PASSWORD FORM COMPONENT ===
   ========================================================================== */

/**
 * Inner form component that reads the reset token from the URL and
 * allows the user to set a new password.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract the token from the query string (e.g., ?token=abc123)
  const token = searchParams.get("token");

  // Local form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show a warning if the page was opened without a valid token
  useEffect(() => {
    if (!token) {
      toast.error("Invalid or expired reset link. Please request a new one.");
    }
  }, [token]);

  /**
   * Handles the password reset form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate token presence
    if (!token) {
      toast.error("Your reset link is invalid or has expired.");
      return;
    }

    // 2. Validate new password length
    if (!isValidPassword(newPassword)) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    // 3. Check that the two passwords match
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Uses relative /api endpoint for proxy rewrite handling
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
        credentials: "include",
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result
            ? (result as { error: string }).error
            : "Could not reset password. Please try again.";
        throw new Error(errorMessage);
      }

      toast.success("Password changed successfully! Redirecting...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/login");
    } catch (error: unknown) {
      console.error("Reset Password Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "A network error occurred. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainerContent}>
      <div className={styles.formHeader}>
        <h1 className={styles.mainTitle}>Reset Password</h1>
        <p className={styles.subtext}>
          Please choose a strong, secure new password below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={styles.registrationForm}
        noValidate
      >
        {/* New Password field */}
        <div className={styles.inputControlGroup}>
          <label htmlFor="newPassword" className={styles.fieldLabel}>
            New Password
          </label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${styles.primaryInputField} ${styles.passwordInput}`}
              autoFocus
              required
            />
            <button
              type="button"
              className={styles.showPasswordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm Password field */}
        <div className={styles.inputControlGroup}>
          <label htmlFor="confirmPassword" className={styles.fieldLabel}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.primaryInputField}
            required
          />
        </div>

        <button
          type="submit"
          className={styles.submitPrimaryButton}
          disabled={isSubmitting || !token}
        >
          {isSubmitting ? "Saving..." : "Update Password"}
        </button>
      </form>

      <div className={styles.footerRedirectArea}>
        <p>
          Remembered your password?{" "}
          <Link href="/login" className={styles.hyperlinkInline}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Page wrapper that provides the `<Suspense>` boundary required by
 * `useSearchParams()` and applies the shared login page layout.
 */
export default function ResetPasswordPage() {
  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>
          ← Back to Home
        </Link>

        <Suspense
          fallback={
            <div className={styles.formContainerContent}>
              <p className={styles.subtext}>Loading secure reset form...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </section>

      <aside className={styles.rightGraphicsColumn}>
        <div
          className={styles.gridOverlayMatrixPattern}
          style={{ opacity: 0.6 }}
        />
        <div
          className={styles.waveformTelemetryHUD}
          style={{ maxWidth: "380px" }}
        >
          <div className={styles.hudHeaderRow}>
            <div
              className={styles.pulseActiveIndicatorDot}
              style={{ backgroundColor: "#6366f1" }}
            />
            <h3 className={styles.hudWidgetHeadline}>
              SECURE PASSWORD VAULT
            </h3>
          </div>
          <p
            className={styles.hudInstructionalSubtext}
            style={{ border: "none", paddingTop: 0 }}
          >
            Your temporary link tokens are automatically hashed and deleted
            once used to keep your RakhoKhaata account completely safe.
          </p>
        </div>
      </aside>
    </div>
  );
}
/* === SECTION 3 END === */