// FILE LOCATION: src/app/(auth)/login/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES START ===
   ========================================================================== */
import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// WHY: We clean up our codebase by importing our logic requirements from the schema layer.
import { loginSchema, type LoginFormData } from "@/schemas/auth";

import styles from "./page.module.css";
/* === SECTION 1: IMPORTS AND DEPENDENCIES END === */

type MarketTrendType = "STABLE_GROWTH" | "CORRECTIVE_RECOVERY" | "HIGH_VOLATILITY_BURST";

// FIXED / WHY: Empty subscription setup needed for useSyncExternalStore to verify window availability safely
const emptySubscribe = () => () => {};

export default function InteractivePulseLoginPage() {
  /* ==========================================================================
     === SECTION 2: STATE INITIALIZATION AND HOOKS START ===
     ========================================================================== */
  const router = useRouter();

  // FIXED / WHY: Directly hooks into the rendering timeline to figure out if it is server or browser environment.
  // This removes the need for useEffect + setIsClient(true), totally solving the linter error.
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // WHY: We wire up the externally imported login schema parameters directly to the engine.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // State elements kept for the reactive parts of the telemetry UI
  const [marketVolatility, setMarketVolatility] = useState<number>(12);
  const [marketTrend, setMarketTrend] = useState<MarketTrendType>("STABLE_GROWTH");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseTime = useRef<number>(0);

  const currentAmplitude = useRef<number>(20);
  const targetAmplitude = useRef<number>(20);
  /* === SECTION 2: STATE INITIALIZATION AND HOOKS END === */

  /* ==========================================================================
     === SECTION 3: FORM SUBMISSION LOGIC START ===
     ========================================================================== */
  const onFormSubmit = async (data: LoginFormData) => {
    console.log("Validated Payload:", data);
    router.push("/dashboard");
  };
  /* === SECTION 3: FORM SUBMISSION LOGIC END === */

  /* ==========================================================================
     === SECTION 4: CANVAS VOLATILITY ENGINE START ===
     ========================================================================== */
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
      const primaryToken = rootStyles.getPropertyValue("--color-primary").trim() || "#9266FA";
      const successToken = rootStyles.getPropertyValue("--color-success").trim() || "#4ade80";

      ctx.fillStyle = rawBgToken.startsWith("#") ? `${rawBgToken}26` : "rgba(10, 6, 27, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      waveOffset += 0.04;
      currentAmplitude.current += (targetAmplitude.current - currentAmplitude.current) * 0.08;

      if (targetAmplitude.current > 20) {
        targetAmplitude.current -= 0.5;
      }

      const calculatedSpikeIntensity = Math.round(currentAmplitude.current);
      
      // FIXED / WHY: Throttling state calls to occur at most once every 100ms. 
      // Running react state changes 60 to 120 times per second inside an animation frame causes massive lag.
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
  /* === SECTION 4: CANVAS VOLATILITY ENGINE END === */

  /* ==========================================================================
     === SECTION 5: MAIN JSX RENDER LAYOUT START ===
     ========================================================================== */
  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>← Back to main website</Link>

        <div className={styles.formContainerContent}>
          <div className={styles.formHeader}>
            <h1 className={styles.mainTitle}>Access Hub</h1>
            <p className={styles.subtext}>Synchronize your credentials to access your secure station parameters.</p>
          </div>

          {isClient && (
            <form onSubmit={handleSubmit(onFormSubmit)} className={styles.registrationForm}>
              
              <div className={styles.inputControlGroup}>
                <label htmlFor="email" className={styles.fieldLabel}>Security Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="zain@domain.com"
                  {...register("email")}
                  className={`${styles.primaryInputField} ${errors.email ? styles.inputErrorState : ""}`}
                  autoFocus
                />
                {errors.email && <span className={styles.fieldErrorText}>{errors.email.message}</span>}
              </div>

              <div className={styles.inputControlGroup}>
                <div className={styles.labelForgotRow}>
                  <label htmlFor="password" className={styles.fieldLabel}>Master Password</label>
                  <Link href="/forgot" className={styles.forgotPassLink}>Recover Dial Keys?</Link>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`${styles.primaryInputField} ${errors.password ? styles.inputErrorState : ""}`}
                />
                {errors.password && <span className={styles.fieldErrorText}>{errors.password.message}</span>}
              </div>

              <button type="submit" className={styles.submitPrimaryButton} disabled={isSubmitting}>
                {isSubmitting ? "Authorizing..." : "Authorize Master Handshake"}
              </button>
            </form>
          )}

          <div className={styles.footerRedirectArea}>
            <p>Unregistered operative? <Link href="/signup" className={styles.hyperlinkInline}>Provision new safe locks</Link></p>
          </div>
        </div>
      </section>

      <aside className={styles.rightGraphicsColumn} onMouseMove={handleWavePanelMouseMove}>
        <canvas ref={canvasRef} className={styles.pulseCanvasAsset} aria-label="Interactive asset tracker data canvas graph" role="img" />
        <div className={styles.gridOverlayMatrixPattern} />

        {isClient && (
          <div className={styles.waveformTelemetryHUD}>
            <div className={styles.hudHeaderRow}>
              <div className={styles.pulseActiveIndicatorDot} />
              <h3 className={styles.hudWidgetHeadline}>LIVE CAPITAL PULSE</h3>
            </div>

            <div className={styles.metricsGridSplitterRow}>
              <div className={styles.hudMetricCell}>
                <span className={styles.metricLabelText}>VOLATILITY_INDEX</span>
                <span className={styles.metricLiveValueText}>{marketVolatility} Hz</span>
              </div>
              <div className={styles.hudMetricCell}>
                <span className={styles.metricLabelText}>CALIBRATION_FLOW</span>
                <span className={`${styles.metricLiveValueText} ${marketTrend !== "STABLE_GROWTH" ? styles.alertValueText : ""}`}>
                  {marketTrend}
                </span>
              </div>
            </div>

            <p className={styles.hudInstructionalSubtext}>
              *Whip your cursor across the panel void spaces to simulate volatile transactional velocity bursts.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
/* === SECTION 5: MAIN JSX RENDER LAYOUT END === */