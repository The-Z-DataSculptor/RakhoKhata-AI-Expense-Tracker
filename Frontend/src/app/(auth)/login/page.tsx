// Frontend/src/app/(auth)/login/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginSchema, type LoginFormData } from "@/schemas/auth";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

type MarketTrend = "STABLE_GROWTH" | "CORRECTIVE_RECOVERY" | "HIGH_VOLATILITY_BURST";

interface LoginSuccessPayload {
  message: string;
  user: {
    id: string;
    email: string;
    isOnboardingCompleted: boolean;
  };
}

const noopSubscribe = () => (): void => {};

function marketTrendLabel(trend: MarketTrend): string {
  switch (trend) {
    case "STABLE_GROWTH":
      return "Stable";
    case "CORRECTIVE_RECOVERY":
      return "Recovering";
    case "HIGH_VOLATILITY_BURST":
      return "Volatile";
    default:
      return "Stable";
  }
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const [marketVolatility, setMarketVolatility] = useState(12);
  const [marketTrend, setMarketTrend] = useState<MarketTrend>("STABLE_GROWTH");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseTime = useRef<number>(0);

  const currentAmplitude = useRef(20);
  const targetAmplitude = useRef(20);

  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result
            ? (result as { error: string }).error
            : "Authentication failed. Please verify credentials.";
        throw new Error(errorMessage);
      }

      const payload = result as LoginSuccessPayload;
      toast.success("Welcome back! Loading your session...");

      const targetPath =
        payload.user?.isOnboardingCompleted ? "/dashboard" : "/onboarding";

      setTimeout(() => {
        window.location.href = targetPath;
      }, 500);
    } catch (error: unknown) {
      console.error("Login Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please check your internet connection.";
      toast.error(message);
    }
  };

  const handleForgotPasswordSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const trimmedEmail = forgotEmail.trim();
    if (trimmedEmail.length === 0) {
      toast.error("Please provide a valid email address.");
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const response = await fetch(
        `/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail.toLowerCase() }),
        }
      );

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result
            ? (result as { error: string }).error
            : "Failed to process password reset request.";
        throw new Error(errorMessage);
      }

      const successMessage =
        typeof result === "object" && result !== null && "message" in result
          ? (result as { message: string }).message
          : "Recovery email dispatched.";

      toast.success(successMessage);
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (error: unknown) {
      console.error("Forgot Password UI Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Network error while sending recovery email.";
      toast.error(message);
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let waveOffset = 0;
    let lastStateUpdate = 0;
    let animFrameId: number;

    const animate = () => {
      if (document.hidden) {
        animFrameId = requestAnimationFrame(animate);
        return;
      }

      const rootStyles = getComputedStyle(document.documentElement);
      const bg =
        rootStyles.getPropertyValue("--background").trim() || "#0A061B";
      const primary =
        rootStyles.getPropertyValue("--color-primary").trim() || "#613bbf";
      const success =
        rootStyles.getPropertyValue("--color-success").trim() || "#16a34a";

      ctx.fillStyle = bg.startsWith("#")
        ? `${bg}26`
        : "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      waveOffset += 0.04;

      currentAmplitude.current +=
        (targetAmplitude.current - currentAmplitude.current) * 0.08;
      if (targetAmplitude.current > 20) {
        targetAmplitude.current -= 0.5;
      }

      const amplitude = Math.round(currentAmplitude.current);
      const now = Date.now();

      if (now - lastStateUpdate > 100) {
        setMarketVolatility(amplitude);
        if (amplitude > 60) {
          setMarketTrend("HIGH_VOLATILITY_BURST");
        } else if (amplitude > 35) {
          setMarketTrend("CORRECTIVE_RECOVERY");
        } else {
          setMarketTrend("STABLE_GROWTH");
        }
        lastStateUpdate = now;
      }

      ctx.beginPath();
      ctx.lineWidth = 3;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, primary + "44");
      gradient.addColorStop(0.5, primary);
      gradient.addColorStop(1, success);
      ctx.strokeStyle = gradient;

      for (let x = 0; x < canvas.width; x++) {
        const baseline = canvas.height * 0.6 - (x / canvas.width) * 120;
        const sine1 = Math.sin(x * 0.015 + waveOffset);
        const sine2 = Math.sin(x * 0.005 - waveOffset * 0.5);
        const y = baseline + (sine1 + sine2) * currentAmplitude.current;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const nodeX = (waveOffset * 40) % canvas.width;
      const nodeBaseline =
        canvas.height * 0.6 - (nodeX / canvas.width) * 120;
      const nodeSine =
        Math.sin(nodeX * 0.015 + waveOffset) +
        Math.sin(nodeX * 0.005 - waveOffset * 0.5);
      const nodeY = nodeBaseline + nodeSine * currentAmplitude.current;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
      ctx.fillStyle = success;
      ctx.fill();

      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameId);
    };
  }, [isClient]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const deltaTime = now - lastMouseTime.current;

    if (deltaTime < 16) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / deltaTime;

    if (velocity > 1.5) {
      const spike = Math.min(velocity * 35, 120);
      if (spike > targetAmplitude.current) {
        targetAmplitude.current = spike;
      }
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
    lastMouseTime.current = now;
  };

  return (
    <div className={styles.fullScreenMasterLayout} suppressHydrationWarning>
      <section className={styles.leftFormColumn}>
        <Link href="/" className={styles.escapeHomeButton}>
          ← Back to Home
        </Link>

        <div className={styles.formContainerContent}>
          <div className={styles.formHeader}>
            <h1 className={styles.mainTitle}>Welcome Back</h1>
            <p className={styles.subtext}>
              Log in to RakhoKhata to manage your finances and track your
              goals.
            </p>
          </div>

          {isClient && (
            <>
              <form
                onSubmit={handleSubmit(handleLoginSubmit)}
                className={styles.registrationForm}
                noValidate
              >
                <div className={styles.inputControlGroup}>
                  <label htmlFor="email" className={styles.fieldLabel}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className={`${styles.primaryInputField} ${
                      errors.email ? styles.inputErrorState : ""
                    }`}
                    autoFocus
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                  {errors.email && (
                    <span className={styles.fieldErrorText} role="alert">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div className={styles.inputControlGroup}>
                  <div className={styles.labelForgotRow}>
                    <label htmlFor="password" className={styles.fieldLabel}>
                      Password
                    </label>
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
                      className={`${styles.primaryInputField} ${
                        styles.passwordInput
                      } ${
                        errors.password ? styles.inputErrorState : ""
                      }`}
                      aria-invalid={errors.password ? "true" : "false"}
                    />
                    <button
                      type="button"
                      className={styles.showPasswordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className={styles.fieldErrorText} role="alert">
                      {errors.password.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.submitPrimaryButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Log In"}
                </button>
              </form>

              <div className={styles.authSeparatorContainer}>or</div>

              <a
                href="/api/auth/google"
                className={styles.googleOAuthHighwayButton}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.64 9.20455C17.64 8.59091 17.5855 8.00455 17.4845 7.44545H9V10.783H13.8436C13.635 11.91 13.0009 12.8645 12.0477 13.5027V15.6695H14.9564C16.6582 14.1027 17.64 11.8705 17.64 9.20455Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18C11.43 18 13.4673 17.1955 14.9591 15.6695L12.0505 13.5027C11.2445 14.0427 10.2136 14.3645 9 14.3645C6.65455 14.3645 4.66636 12.7841 3.95727 10.6555H0.949091V12.9886C2.43545 15.9409 5.48182 18 9 18Z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.95727 10.6555C3.77727 10.1155 3.67636 9.54273 3.67636 8.95455C3.67636 8.36636 3.77727 7.79364 3.95727 7.25364V4.92045H0.949091C0.340909 6.13364 0 7.50545 0 8.95455C0 10.4036 0.340909 11.7755 0.949091 12.9886L3.95727 10.6555Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.63545C10.3227 3.63545 11.5091 4.09091 12.4418 4.98273L15.0245 2.40001C13.4645 0.946364 11.4245 0 9 0C5.48182 0 2.43545 2.05909 0.949091 5.01136L3.95727 7.34455C4.66636 5.21591 6.65455 3.63545 9 3.63545Z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </a>
            </>
          )}

          <div className={styles.footerRedirectArea}>
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className={styles.hyperlinkInline}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </section>

      <aside
        className={styles.rightGraphicsColumn}
        onMouseMove={handleMouseMove}
      >
        <canvas
          ref={canvasRef}
          className={styles.pulseCanvasAsset}
          aria-label="Interactive market activity graph"
          role="img"
        />
        <div className={styles.gridOverlayMatrixPattern} />

        {isClient && (
          <div className={styles.waveformTelemetryHUD}>
            <div className={styles.hudHeaderRow}>
              <div className={styles.pulseActiveIndicatorDot} />
              <h3 className={styles.hudWidgetHeadline}>
                LIVE MARKET SIMULATION
              </h3>
            </div>

            <div className={styles.metricsGridSplitterRow}>
              <div className={styles.hudMetricCell}>
                <span className={styles.metricLabelText}>ACTIVITY LEVEL</span>
                <span className={styles.metricLiveValueText}>
                  {marketVolatility} Hz
                </span>
              </div>
              <div className={styles.hudMetricCell}>
                <span className={styles.metricLabelText}>TREND STATUS</span>
                <span
                  className={`${styles.metricLiveValueText} ${
                    marketTrend !== "STABLE_GROWTH"
                      ? styles.alertValueText
                      : ""
                  }`}
                >
                  {marketTrendLabel(marketTrend)}
                </span>
              </div>
            </div>

            <p className={styles.hudInstructionalSubtext}>
              *Move your mouse rapidly across this area to simulate market
              activity and see the chart react.
            </p>
          </div>
        )}
      </aside>

      {showForgotModal && (
        <div className={styles.modalScreenDimmer}>
          <div className={styles.modalCardSurface}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Recover Account Credentials</h2>
              <p className={styles.modalSubtext}>
                Provide your verified account registration email. A secure
                15‑minute recovery link will be sent.
              </p>
            </div>
            <form
              onSubmit={handleForgotPasswordSubmit}
              className={styles.registrationForm}
            >
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
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotEmail("");
                  }}
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
                  {isForgotSubmitting
                    ? "Processing Link..."
                    : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}