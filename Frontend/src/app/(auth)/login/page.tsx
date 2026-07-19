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

import { loginSchema, type LoginFormData } from "@/schemas/auth";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
type MarketTrendType = "STABLE_GROWTH" | "CORRECTIVE_RECOVERY" | "HIGH_VOLATILITY_BURST";

const emptySubscribe = () => () => {};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const [marketVolatility, setMarketVolatility] = useState<number>(12);
  const [marketTrend, setMarketTrend] = useState<MarketTrendType>("STABLE_GROWTH");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseTime = useRef<number>(0);

  const currentAmplitude = useRef<number>(20);
  const targetAmplitude = useRef<number>(20);

  const onFormSubmit = async (data: LoginFormData) => {
    console.log("Validated Payload:", data);
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", 
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Authentication failed. Please verify credentials.");
      }

      toast.success("Welcome back! Loading your dashboard securely...");

      await new Promise(resolve => setTimeout(resolve, 800));
      router.push("/dashboard");

    } catch (error: unknown) {
      console.error("Full-Stack Login Error Encountered:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred. Please verify your backend engine is running.";
        
      toast.error(errorMessage);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please provide a valid account email address.");
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process recovery transmission.");
      }

      toast.success(result.message || "Recovery transmission dispatched safely.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (error: unknown) {
      console.error("Forgot Password UI Error:", error);
      const msg = error instanceof Error ? error.message : "Network failure communicating with recovery cluster.";
      toast.error(msg);
    } finally {
      setIsForgotSubmitting(false);
    }
  };

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
            <>
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
                    <button 
                      type="button" 
                      onClick={() => setShowForgotModal(true)} 
                      className={styles.forgotPassLinkButton}
                    >
                      Forgot password?
                    </button>
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

              {/* 🚀 ADDED: Visual Design Separator Vector */}
              <div className={styles.authSeparatorContainer}>or</div>

              {/* 🚀 ADDED: Unified Google OAuth Pipeline Connection Link Box */}
              <a href="http://localhost:5000/api/auth/google" className={styles.googleOAuthHighwayButton}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.59091 17.5855 8.00455 17.4845 7.44545H9V10.783H13.8436C13.635 11.91 13.0009 12.8645 12.0477 13.5027V15.6695H14.9564C16.6582 14.1027 17.64 11.8705 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1955 14.9591 15.6695L12.0505 13.5027C11.2445 14.0427 10.2136 14.3645 9 14.3645C6.65455 14.3645 4.66636 12.7841 3.95727 10.6555H0.949091V12.9886C2.43545 15.9409 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.95727 10.6555C3.77727 10.1155 3.67636 9.54273 3.67636 8.95455C3.67636 8.36636 3.77727 7.79364 3.95727 7.25364V4.92045H0.949091C0.340909 6.13364 0 7.50545 0 8.95455C0 10.4036 0.340909 11.7755 0.949091 12.9886L3.95727 10.6555Z" fill="#FBBC05"/>
                  <path d="M9 3.63545C10.3227 3.63545 11.5091 4.09091 12.4418 4.98273L15.0245 2.40001C13.4645 0.946364 11.4245 0 9 0C5.48182 0 2.43545 2.05909 0.949091 5.01136L3.95727 7.34455C4.66636 5.21591 6.65455 3.63545 9 3.63545Z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </a>
            </>
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

      {/* 🚀 MODAL OVERLAY PORTAL VIEW LAYER */}
      {showForgotModal && (
        <div className={styles.modalScreenDimmer}>
          <div className={styles.modalCardSurface}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Recover Account Credentials</h2>
              <p className={styles.modalSubtext}>Provide your verified account registration email. We will process a secure 15-minute recovery bridge link.</p>
            </div>
            <form onSubmit={handleForgotPasswordSubmit} className={styles.registrationForm}>
              <div className={styles.inputControlGroup}>
                <label className={styles.fieldLabel}>Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="yourname@domain.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={styles.primaryInputField}
                />
              </div>
              <div className={styles.modalActionButtonsRow}>
                <button 
                  type="button" 
                  onClick={() => { setShowForgotModal(false); setForgotEmail(""); }} 
                  className={styles.modalCancelButton}
                  disabled={isForgotSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.modalSubmitButton}
                  disabled={isForgotSubmitting}
                >
                  {isForgotSubmitting ? "Processing Link..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}