"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import styles from "../login/page.module.css"; // Reuses your beautiful structural theme
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: VERIFICATION PROCESS CORE ===
   ========================================================================== */
function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const executeVerification = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Missing security token parameters in your address link.");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Verification link failed or expired.");
        }

        setStatus("success");
        toast.success("Account activated successfully!");
        
        // Let them see the success screen for 2 seconds, then send to login
        setTimeout(() => {
          router.push("/login");
        }, 2000);

      } catch (error: unknown) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "A connection problem occurred.");
      }
    };

    executeVerification();
  }, [token, router]);

  return (
    <div className={styles.formContainerContent}>
      <div className={styles.formHeader}>
        <h1 className={styles.mainTitle}>Account Verification</h1>
        
        {status === "loading" && (
          <p className={styles.subtext}>Verifying your security credentials with our database servers...</p>
        )}

        {status === "success" && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "var(--color-success, #16a34a)", fontWeight: "bold" }}>
              ✓ Success! Your email is now verified.
            </p>
            <p className={styles.subtext} style={{ marginTop: "0.5rem" }}>
              Sending you to the login window right now...
            </p>
          </div>
        )}

        {status === "error" && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "var(--color-danger, #dc2626)", fontWeight: "bold" }}>
              ✕ Verification Failed
            </p>
            <p className={styles.subtext} style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
              {errorMessage}
            </p>
            <Link href="/login" className={styles.submitPrimaryButton} style={{ display: "block", textTransform: "none", textAlign: "center", textDecoration: "none" }}>
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MASTER LAYOUT CONTAINER ===
   ========================================================================== */
export default function VerifyEmailPage() {
  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>← Back to Home</Link>
        
        {/* Isolated inside a Suspense wrapper boundary to keep Next.js 15 compilers happy */}
        <Suspense fallback={
          <div className={styles.formContainerContent}>
            <p className={styles.subtext}>Loading layout streams...</p>
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </section>

      <aside className={styles.rightGraphicsColumn}>
        <div className={styles.gridOverlayMatrixPattern} style={{ opacity: 0.6 }} />
        <div className={styles.waveformTelemetryHUD} style={{ maxWidth: "380px" }}>
          <div className={styles.hudHeaderRow}>
            <div className={styles.pulseActiveIndicatorDot} style={{ backgroundColor: "#16a34a" }} />
            <h3 className={styles.hudWidgetHeadline}>IDENTITY VERIFICATION STATUS</h3>
          </div>
          <p className={styles.hudInstructionalSubtext} style={{ border: "none", paddingTop: 0 }}>
            Verifying your email address unlocks full database workspace sync mechanics, protecting your personal cashflow transactions.
          </p>
        </div>
      </aside>
    </div>
  );
}
/* === SECTION 3 END === */