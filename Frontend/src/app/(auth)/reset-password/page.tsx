"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import styles from "../login/page.module.css"; 
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: PASSWORD RESET FORM ===
   ========================================================================== */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the reset token from the URL link
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid link. Missing your security token.");
    }
  }, [token]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Your reset link is invalid or has expired.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not reset password. Please try again.");
      }

      toast.success("Password changed successfully! Sending you to login...");
      
      // Wait 1 second so the user can read the success message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/login");
    } catch (error: unknown) {
      console.error("Reset Password Error:", error);
      const outputMsg = error instanceof Error ? error.message : "A network error occurred. Please try again.";
      toast.error(outputMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainerContent}>
      <div className={styles.formHeader}>
        <h1 className={styles.mainTitle}>Reset Password</h1>
        <p className={styles.subtext}>Please choose a strong, secure new password below.</p>
      </div>

      <form onSubmit={handlePasswordResetSubmit} className={styles.registrationForm} noValidate>
        
        <div className={styles.inputControlGroup}>
          <label htmlFor="newPassword" className={styles.fieldLabel}>New Password</label>
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

        <div className={styles.inputControlGroup}>
          <label htmlFor="confirmPassword" className={styles.fieldLabel}>Confirm Password</label>
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

        <button type="submit" className={styles.submitPrimaryButton} disabled={isSubmitting || !token}>
          {isSubmitting ? "Saving..." : "Update Password"}
        </button>
      </form>

      <div className={styles.footerRedirectArea}>
        <p>Remembered your password? <Link href="/login" className={styles.hyperlinkInline}>Back to login</Link></p>
      </div>
    </div>
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PAGE LAYOUT WRAPPER ===
   ========================================================================== */
export default function ResetPasswordPage() {
  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>← Back to Home</Link>
        
        <Suspense fallback={
          <div className={styles.formContainerContent}>
            <p className={styles.subtext}>Loading secure reset form...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </section>

      <aside className={styles.rightGraphicsColumn}>
        <div className={styles.gridOverlayMatrixPattern} style={{ opacity: 0.6 }} />
        <div className={styles.waveformTelemetryHUD} style={{ maxWidth: "380px" }}>
          <div className={styles.hudHeaderRow}>
            <div className={styles.pulseActiveIndicatorDot} style={{ backgroundColor: "#6366f1" }} />
            <h3 className={styles.hudWidgetHeadline}>SECURE PASSWORD VAULT</h3>
          </div>
          <p className={styles.hudInstructionalSubtext} style={{ border: "none", paddingTop: 0 }}>
            Your temporary link tokens are automatically hashed and deleted as soon as they are used to keep your RakhoKhata account completely safe.
          </p>
        </div>
      </aside>
    </div>
  );
}
/* === SECTION 3 END === */