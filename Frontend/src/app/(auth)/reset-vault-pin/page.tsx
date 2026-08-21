// src/app/(auth)/reset-vault-pin/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { vaultAuthService } from "@/utils/api";
import { toast } from "sonner";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: INNER FORM COMPONENT ===
   ========================================================================== */
function ResetVaultPinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!token) {
        toast.error("Invalid or missing reset token. Please request a new link.");
        return;
      }

      if (!/^\d{4}$/.test(pin)) {
        toast.error("New PIN must be exactly 4 numeric digits.");
        return;
      }

      if (pin !== confirmPin) {
        toast.error("PINs do not match. Please try again.");
        return;
      }

      try {
        setIsSubmitting(true);

        const response = await vaultAuthService.resetPinWithToken(token, pin);

        if (response.success) {
          toast.success(response.message || "Vault PIN updated successfully!");

          setTimeout(() => {
            router.push("/dashboard/investment-vault");
          }, 1500);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to reset vault PIN.";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, pin, confirmPin, router]
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <svg
              className={styles.shieldIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <h2 className={styles.title}>Reset Vault PIN</h2>
          <p className={styles.subtitle}>
            Enter a new 4-digit security PIN to unlock your Investment Vault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="newPin">
              New 4-Digit PIN
            </label>
            <input
              id="newPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              required
              disabled={isSubmitting}
              className={styles.input}
              autoComplete="off"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirmPin">
              Confirm New PIN
            </label>
            <input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              required
              disabled={isSubmitting}
              className={styles.input}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className={styles.submitButton}
          >
            {isSubmitting ? "Resetting PIN..." : "Save New PIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: EXPORT PAGE WITH SUSPENSE BOUNDARY ===
   ========================================================================== */
export default function ResetVaultPinPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <p className={styles.loadingText}>Loading reset page...</p>
        </div>
      }
    >
      <ResetVaultPinForm />
    </Suspense>
  );
}
/* === SECTION 3 END === */