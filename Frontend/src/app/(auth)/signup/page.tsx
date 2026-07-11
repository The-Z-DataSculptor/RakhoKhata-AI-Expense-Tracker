// src/app/(auth)/signup/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"; 

// Import centralized validation blueprint from the schema folder
import { signupSchema, type SignupFormData } from "@/schemas/auth";

import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// No external property types needed for standalone signup page.
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function SignupPage() {
  const router = useRouter();

  // UX Improvement: Toggles to let users double-check their typed passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize the form engine using the external schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  // State to track mouse position for the ambient background glare effect
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const handleMouseMoveGlare = (event: React.MouseEvent<HTMLDivElement>) => {
    const componentViewport = event.currentTarget.getBoundingClientRect();
    setMouseX(event.clientX - componentViewport.left);
    setMouseY(event.clientY - componentViewport.top);
  };

  // Upgraded Full-Stack Form Submission Engine
  const onFormSubmit = async (data: SignupFormData) => {
    console.log("Validated New Account Payload:", data);
    
    try {
      // Pass the form payload directly to the server since the backend now natively handles fullName
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        // CRITICAL CROSS-ORIGIN FLAG: Mandates the browser to listen for and store 
        // the backend server's secure HttpOnly cookie response automatically.
        credentials: "include",
      });

      const result = await response.json();

      // If our backend rejected the request (e.g., email already exists or invalid data)
      if (!response.ok) {
        throw new Error(result.error || "An error occurred during registration.");
      }

      // BY THE BOOK: Plaintext token scraping is deleted completely. 
      // The browser natively captures the cookie behind the scenes.

      // Trigger global notification engine to instantly confirm registration success
      toast.success("Account created successfully! Preparing your secure ledger...");

      // Simulate a brief network delay for better UX feedback, then redirect to core application
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/dashboard");

    } catch (error: unknown) {
      console.error("Full-Stack Connection Failure:", error);
      
      // Type Guard: Safely verify if the caught error is an instance of the native Error class
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Unable to reach the server. Please verify your backend engine is running.";
        
      // Pass the clean error string directly to our user's notification system
      toast.error(errorMessage);
    }
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div 
      className={styles.fullScreenMasterLayout}
      onMouseMove={handleMouseMoveGlare}
      suppressHydrationWarning
      style={{ "--mouse-x": `${mouseX}px`, "--mouse-y": `${mouseY}px` } as React.CSSProperties}
    >
      <div className={styles.mouseGlareLayer} />

      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>← Back to Home</Link>

        <div className={styles.formContainerContent}>
          <div className={styles.formHeader}>
            <h1 className={styles.mainTitle}>Create Account</h1>
            <p className={styles.subtext}>Join RakhoKhata to easily manage your budget, track expenses, and grow your wealth.</p>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className={styles.registrationForm} noValidate>
            
            <div className={styles.inputControlGroup}>
              <label htmlFor="fullName" className={styles.fieldLabel}>Full Name</label>
              <input 
                id="fullName" 
                type="text"
                placeholder="e.g. Zain Hassan"
                {...register("fullName")} 
                className={`${styles.primaryInputField} ${errors.fullName ? styles.inputErrorState : ""}`}
                autoFocus
                aria-invalid={errors.fullName ? "true" : "false"}
              />
              {errors.fullName && <span className={styles.fieldErrorText} role="alert">{errors.fullName.message}</span>}
            </div>

            <div className={styles.inputControlGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>Email Address</label>
              <input 
                id="email" 
                type="email"
                placeholder="name@example.com"
                {...register("email")} 
                className={`${styles.primaryInputField} ${errors.email ? styles.inputErrorState : ""}`} 
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <span className={styles.fieldErrorText} role="alert">{errors.email.message}</span>}
            </div>

            <div className={styles.inputControlGroup}>
              <label htmlFor="password" className={styles.fieldLabel}>Password</label>
              <div className={styles.passwordInputWrapper}>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a strong password"
                  {...register("password")} 
                  className={`${styles.primaryInputField} ${styles.passwordInput} ${errors.password ? styles.inputErrorState : ""}`} 
                  aria-invalid={errors.password ? "true" : "false"}
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
              {errors.password && <span className={styles.fieldErrorText} role="alert">{errors.password.message}</span>}
            </div>

            <div className={styles.inputControlGroup}>
              <label htmlFor="confirmPassword" className={styles.fieldLabel}>Confirm Password</label>
              <div className={styles.passwordInputWrapper}>
                <input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Type your password again"
                  {...register("confirmPassword")} 
                  className={`${styles.primaryInputField} ${styles.passwordInput} ${errors.confirmPassword ? styles.inputErrorState : ""}`} 
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                <button 
                  type="button" 
                  className={styles.showPasswordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && <span className={styles.fieldErrorText} role="alert">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className={styles.submitPrimaryButton} disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className={styles.footerRedirectArea}>
            <p>Already have an account? <Link href="/login" className={styles.hyperlinkInline}>Log in here</Link></p>
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
            <p className={styles.telemetryStaticLabel}>Security Status</p>
            <h4 className={styles.telemetryLiveValueText}>SYSTEM READY</h4>
            <div className={styles.terminalNetworkSubtextRow}>
              <span>ENCRYPTION_ACTIVE</span><span className={styles.blinkingTerminalDot}>● SECURE</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
/* === SECTION 4 END === */