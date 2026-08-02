"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import styles from "../login/page.module.css"; // Reuses login layout

type VerificationStatus = "loading" | "success" | "error";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: VERIFY EMAIL FORM COMPONENT ===
   ========================================================================== */

/**
 * Inner component that reads the token from the URL and performs email verification.
 * Must be wrapped in a Suspense boundary because of `useSearchParams()`.
 */
function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const executeVerification = async () => {
      // If the token is missing, we cannot proceed
      if (!token) {
        setStatus("error");
        setErrorMessage(
          "Missing security token in the verification link. You can log in and request a new verification email from the dashboard."
        );
        return;
      }

      try {
        // Uses relative /api endpoint for same-origin proxy rewrites
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });

        const result: unknown = await response.json();

        if (!response.ok) {
          const errorText =
            typeof result === "object" && result !== null && "error" in result
              ? (result as { error: string }).error
              : "Verification failed or link expired.";
          throw new Error(errorText);
        }

        setStatus("success");
        toast.success("Account activated successfully!");

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (error: unknown) {
        console.error("Verification error:", error);
        setStatus("error");
        const message =
          error instanceof Error
            ? error.message
            : "A network problem occurred during verification.";

        // If the error indicates an expired token, give a clear message
        if (message.toLowerCase().includes("expired")) {
          setErrorMessage(
            "Your verification link has expired. Please log in and click 'Resend Verification Email' from the dashboard."
          );
        } else {
          setErrorMessage(message);
        }
      }
    };

    executeVerification();
  }, [token, router]);

  return (
    <div className={styles.formContainerContent}>
      <div className={styles.formHeader}>
        <h1 className={styles.mainTitle}>Account Verification</h1>

        {status === "loading" && (
          <p className={styles.subtext}>
            Verifying your security credentials with our database servers...
          </p>
        )}

        {status === "success" && (
          <div style={{ marginTop: "1rem" }}>
            <p
              style={{
                color: "var(--color-success, #16a34a)",
                fontWeight: "bold",
              }}
            >
              ✓ Success! Your email is now verified.
            </p>
            <p className={styles.subtext} style={{ marginTop: "0.5rem" }}>
              Sending you to the login window right now...
            </p>
          </div>
        )}

        {status === "error" && (
          <div style={{ marginTop: "1rem" }}>
            <p
              style={{
                color: "var(--color-danger, #dc2626)",
                fontWeight: "bold",
              }}
            >
              ✕ Verification Failed
            </p>
            <p
              className={styles.subtext}
              style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}
            >
              {errorMessage}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/login"
                className={styles.submitPrimaryButton}
                style={{
                  display: "block",
                  textTransform: "none",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Log In to Resend Verification
              </Link>
              <Link
                href="/signup"
                className={styles.submitPrimaryButton}
                style={{
                  display: "block",
                  textTransform: "none",
                  textAlign: "center",
                  textDecoration: "none",
                  background: "transparent",
                  border: "1px solid var(--border-color, #e5e1f4)",
                  color: "var(--text-primary, #10043f)",
                }}
              >
                Back to Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RENDER ===
   ========================================================================== */

/**
 * Page wrapper that supplies a Suspense boundary for `useSearchParams`.
 */
export default function VerifyEmailPage() {
  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>
          ← Back to Home
        </Link>

        <Suspense
          fallback={
            <div className={styles.formContainerContent}>
              <p className={styles.subtext}>Loading secure verification form...</p>
            </div>
          }
        >
          <VerifyEmailForm />
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
              style={{ backgroundColor: "#16a34a" }}
            />
            <h3 className={styles.hudWidgetHeadline}>
              IDENTITY VERIFICATION STATUS
            </h3>
          </div>
          <p
            className={styles.hudInstructionalSubtext}
            style={{ border: "none", paddingTop: 0 }}
          >
            Verifying your email address unlocks full database workspace sync
            mechanics, protecting your personal cashflow transactions.
          </p>
        </div>
      </aside>
    </div>
  );
}
/* === SECTION 3 END === */