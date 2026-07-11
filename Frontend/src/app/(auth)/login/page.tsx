// src/app/(auth)/login/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"; 

// Import validation rules to ensure the user enters correct data
import { loginSchema, type LoginFormData } from "@/schemas/auth";

import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
type MarketTrendType = "STABLE_GROWTH" | "CORRECTIVE_RECOVERY" | "HIGH_VOLATILITY_BURST";

// Empty subscription setup needed for useSyncExternalStore to verify window availability safely
const emptySubscribe = () => () => {};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function LoginPage() {
  const router = useRouter();

  // UX Improvement: Add a toggle to let users double-check their typed password
  const [showPassword, setShowPassword] = useState(false);

  // Directly hooks into the rendering timeline to figure out if it is a server or browser environment
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Wire up the externally imported login schema parameters to the form engine
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // State elements kept for the reactive parts of the background graph UI
  const [marketVolatility, setMarketVolatility] = useState<number>(12);
  const [marketTrend, setMarketTrend] = useState<MarketTrendType>("STABLE_GROWTH");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseTime = useRef<number>(0);

  const currentAmplitude = useRef<number>(20);
  const targetAmplitude = useRef<number>(20);

  // Form submission handler connected directly to the Express backend API
  const onFormSubmit = async (data: LoginFormData) => {
    console.log("Validated Payload:", data);
    
    try {
      // RESTORED: Reverted route back to unified localhost path mapping for cleaner cookie parity
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        // CRITICAL CROSS-ORIGIN FLAG: Tells the browser it is explicitly allowed 
        // to capture and process the backend's secure HttpOnly 'Set-Cookie' header stream.
        credentials: "include", 
      });

      const result = await response.json();

      // Catch custom backend rejections (incorrect passwords, un-registered emails)
      if (!response.ok) {
        throw new Error(result.error || "Authentication failed. Please verify credentials.");
      }

      // BY THE BOOK: Client-side storage is bypassed completely. 
      // The browser automatically locked the cookie into secure storage.

      // Trigger the micro-feedback layout alert instantly upon validation check pass
      toast.success("Welcome back! Loading your dashboard securely...");

      // Simulate a brief network delay for better UX feedback, then redirect
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push("/dashboard");

    } catch (error: unknown) {
      console.error("Full-Stack Login Error Encountered:", error);
      
      // Strict type guard resolution to display native clean error logs safely
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred. Please verify your backend engine is running.";
        
      toast.error(errorMessage);
    }
  };

  // Helper to format the trend state into friendly text
  const getDisplayTrend = (trend: MarketTrendType) => {
    switch (trend) {
      case "STABLE_GROWTH": return "Stable";
      case "CORRECTIVE_RECOVERY": return "Recovering";
      case "HIGH_VOLATILITY_BURST": return "Volatile";
      default: return "Stable";
    }
  };

  // --- CANVAS VOLATILITY ENGINE ---
  useEffect(() => {
    if (!isClient) return;

    lastMouseTime.current = Date.now();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvasMatrix = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };

    resizeCanvasMatrix();
    window.addEventListener("resize", resizeCanvasMatrix);

    let animationFrameId: number;
    let waveOffset = 0;
    let lastStateUpdateTime = 0;

    const renderWaveframeLoop = () => {
      // Pause animation if the user switches browser tabs to save computer memory
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(renderWaveframeLoop);
        return;
      }

      const rootStyles = getComputedStyle(document.documentElement);
      const rawBgToken = rootStyles.getPropertyValue("--background").trim() || "#0A061B";
      const primaryToken = rootStyles.getPropertyValue("--color-primary").trim() || "#613bbf";
      const successToken = rootStyles.getPropertyValue("--color-success").trim() || "#16a34a";

      ctx.fillStyle = rawBgToken.startsWith("#") ? `${rawBgToken}26` : "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      waveOffset += 0.04;
      currentAmplitude.current += (targetAmplitude.current - currentAmplitude.current) * 0.08;

      if (targetAmplitude.current > 20) {
        targetAmplitude.current -= 0.5;
      }

      const calculatedSpikeIntensity = Math.round(currentAmplitude.current);
      
      // Throttling state calls to occur at most once every 100ms prevents React from lagging
      const now = Date.now();
      if (now - lastStateUpdateTime > 100) {
        setMarketVolatility(calculatedSpikeIntensity);

        if (calculatedSpikeIntensity > 60) {
          setMarketTrend("HIGH_VOLATILITY_BURST");
        } else if (calculatedSpikeIntensity > 35) {
          setMarketTrend("CORRECTIVE_RECOVERY");
        } else {
          setMarketTrend("STABLE_GROWTH");
        }
        lastStateUpdateTime = now;
      }

      ctx.beginPath();
      ctx.lineWidth = 3;

      const lineGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      lineGradient.addColorStop(0, primaryToken + "44");
      lineGradient.addColorStop(0.5, primaryToken);
      lineGradient.addColorStop(1, successToken);
      ctx.strokeStyle = lineGradient;

      for (let xCoord = 0; xCoord < canvas.width; xCoord++) {
        const baselineY = canvas.height * 0.6 - (xCoord / canvas.width) * 120;
        const primarySine = Math.sin(xCoord * 0.015 + waveOffset);
        const secondarySine = Math.sin(xCoord * 0.005 - waveOffset * 0.5);
        const totalYCalculated = baselineY + (primarySine + secondarySine) * currentAmplitude.current;

        if (xCoord === 0) {
          ctx.moveTo(xCoord, totalYCalculated);
        } else {
          ctx.lineTo(xCoord, totalYCalculated);
        }
      }
      ctx.stroke();

      const pulsingNodeX = (waveOffset * 40) % canvas.width;
      const nodeBaselineY = canvas.height * 0.6 - (pulsingNodeX / canvas.width) * 120;
      const nodeSineCalculated = Math.sin(pulsingNodeX * 0.015 + waveOffset) + Math.sin(pulsingNodeX * 0.005 - waveOffset * 0.5);
      const pulsingNodeY = nodeBaselineY + nodeSineCalculated * currentAmplitude.current;

      ctx.beginPath();
      ctx.arc(pulsingNodeX, pulsingNodeY, 6, 0, Math.PI * 2);
      ctx.fillStyle = successToken;
      ctx.fill();

      animationFrameId = requestAnimationFrame(renderWaveframeLoop);
    };

    renderWaveframeLoop();

    return () => {
      window.removeEventListener("resize", resizeCanvasMatrix);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isClient]);

  const handleWavePanelMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const currentTime = Date.now();
    const timeDelta = currentTime - lastMouseTime.current;

    // Only calculate speed if enough time has passed to avoid math errors
    if (timeDelta > 16) {
      const distanceX = event.clientX - lastMousePos.current.x;
      const distanceY = event.clientY - lastMousePos.current.y;
      const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      const calculatedVelocity = totalDistance / timeDelta;

      if (calculatedVelocity > 1.5) {
        const spikeIntensityMultiplier = Math.min(calculatedVelocity * 35, 120);
        if (spikeIntensityMultiplier > targetAmplitude.current) {
          targetAmplitude.current = spikeIntensityMultiplier;
        }
      }
      lastMousePos.current = { x: event.clientX, y: event.clientY };
      lastMouseTime.current = currentTime;
    }
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>← Back to Home</Link>

        <div className={styles.formContainerContent}>
          <div className={styles.formHeader}>
            <h1 className={styles.mainTitle}>Welcome Back</h1>
            <p className={styles.subtext}>Log in to RakhoKhata to manage your finances and track your goals.</p>
          </div>

          {isClient && (
            <form onSubmit={handleSubmit(onFormSubmit)} className={styles.registrationForm} noValidate>
              
              <div className={styles.inputControlGroup}>
                <label htmlFor="email" className={styles.fieldLabel}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className={`${styles.primaryInputField} ${errors.email ? styles.inputErrorState : ""}`}
                  autoFocus
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <span className={styles.fieldErrorText} role="alert">{errors.email.message}</span>}
              </div>

              <div className={styles.inputControlGroup}>
                <div className={styles.labelForgotRow}>
                  <label htmlFor="password" className={styles.fieldLabel}>Password</label>
                  <Link href="/forgot-password" className={styles.forgotPassLink}>Forgot password?</Link>
                </div>
                
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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

              <button type="submit" className={styles.submitPrimaryButton} disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </form>
          )}

          <div className={styles.footerRedirectArea}>
            <p>Don&apos;t have an account? <Link href="/signup" className={styles.hyperlinkInline}>Sign up here</Link></p>
          </div>
        </div>
      </section>

      <aside className={styles.rightGraphicsColumn} onMouseMove={handleWavePanelMouseMove}>
        <canvas ref={canvasRef} className={styles.pulseCanvasAsset} aria-label="Interactive market activity graph" role="img" />
        <div className={styles.gridOverlayMatrixPattern} />

        {isClient && (
          <div className={styles.waveformTelemetryHUD}>
            <div className={styles.hudHeaderRow}>
              <div className={styles.pulseActiveIndicatorDot} />
              <h3 className={styles.hudWidgetHeadline}>LIVE MARKET SIMULATION</h3>
            </div>

            <div className={styles.metricsGridSplitterRow}>
              <div className={styles.hudMetricCell}>
                <span className={styles.metricLabelText}>ACTIVITY LEVEL</span>
                <span className={styles.metricLiveValueText}>{marketVolatility} Hz</span>
              </div>
              <div className={styles.hudMetricCell}>
                <span className={styles.metricLabelText}>TREND STATUS</span>
                <span className={`${styles.metricLiveValueText} ${marketTrend !== "STABLE_GROWTH" ? styles.alertValueText : ""}`}>
                  {getDisplayTrend(marketTrend)}
                </span>
              </div>
            </div>

            <p className={styles.hudInstructionalSubtext}>
              *Move your mouse rapidly across this area to simulate market activity and see the chart react.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
/* === SECTION 4 END === */