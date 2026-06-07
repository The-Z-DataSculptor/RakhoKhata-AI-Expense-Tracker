"use client";

// FILE LOCATION: src/app/signup/page.tsx
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// WHY: We import our centralized validation blueprint from the schema folder.
import { signupSchema, type SignupFormData } from "@/schemas/auth";

import styles from "./page.module.css";

export default function FullScreenBiometricSignupPage() {
  const router = useRouter();

  // WHY: We initialize the form engine using the external schema.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const handleMouseMoveGlare = (event: React.MouseEvent<HTMLDivElement>) => {
    const componentViewport = event.currentTarget.getBoundingClientRect();
    setMouseX(event.clientX - componentViewport.left);
    setMouseY(event.clientY - componentViewport.top);
  };

  const onFormSubmit = async (data: SignupFormData) => {
    console.log("Validated New Vault Payload:", data);
    router.push("/dashboard");
  };

  return (
    <div 
      className={styles.fullScreenMasterLayout}
      onMouseMove={handleMouseMoveGlare}
      suppressHydrationWarning
      style={{ "--mouse-x": `${mouseX}px`, "--mouse-y": `${mouseY}px` } as React.CSSProperties}
    >
      <div className={styles.mouseGlareLayer} />

      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>← Back to main website</Link>

        <div className={styles.formContainerContent}>
          <div className={styles.formHeader}>
            <h1 className={styles.mainTitle}>Create Vault</h1>
            <p className={styles.subtext}>Deploy an encrypted accounting workspace instance.</p>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className={styles.registrationForm}>
            
            <div className={styles.inputControlGroup}>
              <label htmlFor="fullName" className={styles.fieldLabel}>Full Name</label>
              <input id="fullName" {...register("fullName")} className={`${styles.primaryInputField} ${errors.fullName ? styles.inputErrorState : ""}`} />
              {errors.fullName && <span className={styles.fieldErrorText}>{errors.fullName.message}</span>}
            </div>

            <div className={styles.inputControlGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>Security Email</label>
              <input id="email" {...register("email")} className={`${styles.primaryInputField} ${errors.email ? styles.inputErrorState : ""}`} />
              {errors.email && <span className={styles.fieldErrorText}>{errors.email.message}</span>}
            </div>

            <div className={styles.inputControlGroup}>
              <label htmlFor="password" className={styles.fieldLabel}>Master Password</label>
              <input id="password" type="password" {...register("password")} className={`${styles.primaryInputField} ${errors.password ? styles.inputErrorState : ""}`} />
              {errors.password && <span className={styles.fieldErrorText}>{errors.password.message}</span>}
            </div>

            <div className={styles.inputControlGroup}>
              <label htmlFor="confirmPassword" className={styles.fieldLabel}>Verify Password</label>
              <input id="confirmPassword" type="password" {...register("confirmPassword")} className={`${styles.primaryInputField} ${errors.confirmPassword ? styles.inputErrorState : ""}`} />
              {errors.confirmPassword && <span className={styles.fieldErrorText}>{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className={styles.submitPrimaryButton} disabled={isSubmitting}>
              {isSubmitting ? "Initializing..." : "Initialize Secure Ledger"}
            </button>
          </form>

          <div className={styles.footerRedirectArea}>
            <p>Already certified? <Link href="/login" className={styles.hyperlinkInline}>Unlock existing vault</Link></p>
          </div>
        </div>
      </section>

      <aside className={styles.rightGraphicsColumn}>
        <div className={styles.biometricScannerFullscreenWrapper}>
          <div className={styles.laserScanningBeam} />
          <div className={styles.targetScannerRing}>
            <div className={styles.crosshairX} /><div className={styles.crosshairY} />
            <div className={styles.securePadlockCoreIcon}>
              <div className={styles.padlockShackleMock} /><div className={styles.padlockBodyMock} />
            </div>
          </div>
          <div className={styles.statusTelemetryReadout}>
            <p className={styles.telemetryStaticLabel}>System Encryption Status</p>
            <h4 className={styles.telemetryLiveValueText}>READY_TO_INITIALIZE</h4>
            <div className={styles.terminalNetworkSubtextRow}>
              <span>SECURE_SHELL_v3.3</span><span className={styles.blinkingTerminalDot}>● LIVE</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}