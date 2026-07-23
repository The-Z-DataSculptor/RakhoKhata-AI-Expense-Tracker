// src/app/(auth)/signup/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FiUser,
  FiGlobe,
  FiTarget,
  FiCpu,
  FiChevronRight,
  FiChevronLeft,
  FiCheckCircle,
  FiPlus,
  FiMinus,
  FiMail,
  FiShield,
} from "react-icons/fi";

import { signupSchema } from "@/schemas/auth";
import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  PRIORITY_LANGUAGES,
  EXTENDED_LANGUAGES,
} from "@/constants/geoData";
import styles from "./page.module.css";

/**
 * WHY an environment variable is used for the backend URL:
 * Hardcoding "localhost:5000" would break the app in any non‑local environment.
 * NEXT_PUBLIC_API_URL is available at build time and makes the frontend
 * work in staging, production, and Docker without code changes.
 */
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Signup registration flow mode */
type SignupMethod = "CHOOSE" | "EMAIL";

/** Shape of the form data used throughout the wizard */
interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  currency: string;
  languages: string[];
  occupation: string;
  financialGoal: string;
  aiPersona: string;
}

/** Occupation options */
interface OccupationOption {
  id: string;
  label: string;
  desc: string;
}

/** Financial goal card */
interface FinancialGoal {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

/** AI persona card */
interface AiPersona {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

// Static data arrays – defined outside the component to avoid re‑creation
const OCCUPATIONS: OccupationOption[] = [
  { id: "salaried", label: "Salaried Employee", desc: "Fixed monthly paycheck" },
  { id: "freelancer", label: "Freelancer / Contractor", desc: "Irregular client payouts" },
  { id: "entrepreneur", label: "Entrepreneur / Business", desc: "Focuses on business revenue" },
  { id: "student", label: "Student", desc: "Living on a tight budget" },
  { id: "gig_worker", label: "Gig Worker / Creator", desc: "Flexible earnings" },
  { id: "prefer_not_to_say", label: "Prefer Not to Say", desc: "Keep it private 🔒" },
];

const FINANCIAL_GOALS: FinancialGoal[] = [
  { id: "hustler", emoji: "🚀", title: "The Hustler", desc: "Managing gigs & multiple income streams." },
  { id: "saver", emoji: "🏦", title: "The Saver", desc: "Building an emergency fund or buying a home." },
  { id: "tight_budgeter", emoji: "🔍", title: "The Budgeter", desc: "Living paycheck-to-paycheck, finding leaks." },
  { id: "zen_master", emoji: "🧘‍♂️", title: "The Zen Master", desc: "Just tracking cash flows with zero stress." },
  { id: "wealth_builder", emoji: "📈", title: "The Wealth Builder", desc: "Investing, growing assets, and compound growth." },
  { id: "debt_destroyer", emoji: "🔨", title: "The Debt Destroyer", desc: "Aggressively tackling outstanding loans & debt." },
  { id: "nomad", emoji: "🗺️", title: "The Nomad / Expat", desc: "Working globally, handling multi-currency accounts." },
  { id: "privacy_sentinel", emoji: "🛡️", title: "Prefer Private", desc: "Do not categorize or analyze my financial intentions." },
];

const AI_PERSONAS: AiPersona[] = [
  { id: "savage_roaster", emoji: "🔥", title: "Savage Roaster", desc: "Tough love. Will playfully roast your spending habits." },
  { id: "supportive_coach", emoji: "🤝", title: "Supportive Coach", desc: "Warm mentor. Celebrates wins and guides gently." },
  { id: "forensic_detective", emoji: "🕵️‍♂️", title: "Forensic Detective", desc: "Hyper-analytical. Finds sneaky hidden spending leaks." },
  { id: "silent_accountant", emoji: "📊", title: "Silent Accountant", desc: "Professional. No jokes, just raw mathematical logic." },
];

const STEP_TITLES = ["Account", "Region", "Goals", "AI Assistant"];
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

export default function SignupPage() {
  // Mode selection state: "CHOOSE" displays options; "EMAIL" displays standard wizard
  const [signupMethod, setSignupMethod] = useState<SignupMethod>("CHOOSE");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    currency: "USD",
    languages: [],
    occupation: "",
    financialGoal: "",
    aiPersona: "",
  });

  // Auto‑detect region from timezone (runs once on mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes("Karachi")) {
        setFormData((prev) => ({
          ...prev,
          currency: "PKR",
          country: "Pakistan",
          languages: ["Urdu (اُردو)", "English"],
        }));
      } else if (timezone.includes("Europe")) {
        setFormData((prev) => ({ ...prev, currency: "EUR" }));
      } else if (timezone.includes("London")) {
        setFormData((prev) => ({
          ...prev,
          currency: "GBP",
          country: "United Kingdom",
          languages: ["English"],
        }));
      } else if (timezone.includes("Calcutta") || timezone.includes("Kolkata")) {
        setFormData((prev) => ({
          ...prev,
          currency: "INR",
          country: "India",
          languages: ["Hindi (हिन्दी)", "English"],
        }));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Country change → auto‑sets currency & language
  const handleCountryChange = (selectedCountryName: string) => {
    const matchedCountry = WORLD_COUNTRIES.find(
      (c) => c.name === selectedCountryName
    );

    setFormData((prev) => {
      const languagesSet = new Set(prev.languages);
      if (matchedCountry) {
        languagesSet.add(matchedCountry.defaultLanguage);
        return {
          ...prev,
          country: selectedCountryName,
          currency: matchedCountry.defaultCurrency,
          languages: Array.from(languagesSet),
        };
      }
      return { ...prev, country: selectedCountryName };
    });
  };

  // Language toggling
  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const current = prev.languages;
      if (current.includes(lang)) {
        return { ...prev, languages: current.filter((l) => l !== lang) };
      }
      return { ...prev, languages: [...current, lang] };
    });
  };

  // Step navigation with explicit field validations
  const handleNext = () => {
    if (step === 1) {
      const validation = signupSchema.safeParse(formData);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message ?? "Please check your inputs.";
        toast.error(firstError);
        return;
      }
    }

    if (step === 2) {
      if (!formData.country.trim()) {
        toast.error("Please select your country to continue.");
        return;
      }
      if (!formData.currency.trim()) {
        toast.error("Please select a default currency.");
        return;
      }
    }

    if (step === 3) {
      if (!formData.occupation) {
        toast.error("Please select your income style / job type.");
        return;
      }
      if (!formData.financialGoal) {
        toast.error("Please select a main financial goal.");
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    if (step === 1) {
      setSignupMethod("CHOOSE");
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Final submission validation
  const submitForm = async () => {
    if (!formData.aiPersona) {
      toast.error("Please pick an AI assistant personality style to complete registration.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result
            ? (result as { error: string }).error
            : "Registration failed.";
        throw new Error(errorMessage);
      }

      toast.success("Account created! Please check your email to verify your account.");
      /*
       * WHY we use a hard navigation here instead of Next.js router.push:
       * Signup creates a new session and sets an HttpOnly cookie. A full
       * page reload ensures the browser fully applies the new cookie state,
       * avoiding potential redirect loops or stale client‑side caches.
       */
      setTimeout(() => {
        window.location.href = "/login";
      }, 2500);
    } catch (error: unknown) {
      console.error("Signup Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Could not connect to the server.";
      toast.error(message);
      setIsSubmitting(false);
    }
  };
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RENDER HELPERS ===
   ========================================================================== */

  // Step content rendering
  const renderStepContent = () => {
    // Initial choice screen – Google OAuth vs Email
    if (signupMethod === "CHOOSE") {
      return (
        <div className={styles.stepContainer} suppressHydrationWarning>
          <div className={styles.stepHeader}>
            <div className={styles.stepIconBox}>
              <FiShield className={styles.stepIcon} />
            </div>
            <h2>Get Started with RakhoKhata</h2>
            <p>Choose your preferred account creation method below.</p>
          </div>

          <div className={styles.methodChoiceGrid}>
            {/* Google OAuth Option */}
            <a
              href={`${BACKEND_API_URL}/api/auth/google`}
              className={`${styles.methodChoiceCard} ${styles.googleChoiceCard}`}
            >
              <div className={`${styles.methodIconBox} ${styles.googleIconBox}`}>
                <svg
                  width="22"
                  height="22"
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
              </div>
              <div className={styles.methodText}>
                <h4>Continue with Google</h4>
                <p>1‑click fast registration using your Google account.</p>
              </div>
              <FiChevronRight className={styles.methodArrow} />
            </a>

            <div className={styles.authChoiceDivider}>
              <span>or create an account manually</span>
            </div>

            {/* Email Registration Option */}
            <button
              type="button"
              onClick={() => {
                setSignupMethod("EMAIL");
                setStep(1);
              }}
              className={`${styles.methodChoiceCard} ${styles.emailChoiceCard}`}
            >
              <div className={`${styles.methodIconBox} ${styles.emailIconBox}`}>
                <FiMail />
              </div>
              <div className={styles.methodText}>
                <h4>Sign up with Email</h4>
                <p>Set up a password‑protected account step‑by‑step.</p>
              </div>
              <FiChevronRight className={styles.methodArrow} />
            </button>
          </div>

          <div className={styles.existingAccountLinkBlock}>
            Already have an account?{" "}
            <Link href="/login" className={styles.hyperlinkHighlight}>
              Log in here
            </Link>
          </div>
        </div>
      );
    }

    // Email signup wizard steps (1‑4)
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContainer} suppressHydrationWarning>
            <div className={styles.stepHeader}>
              <div className={styles.stepIconBox}>
                <FiUser className={styles.stepIcon} />
              </div>
              <h2>Create Your Account</h2>
              <p>Please fill in your basic details below.</p>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className={styles.textInput}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={styles.textInput}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Choose a password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={styles.textInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className={styles.textInput}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContainer} suppressHydrationWarning>
            <div className={styles.stepHeader}>
              <div className={styles.stepIconBox}>
                <FiGlobe className={styles.stepIcon} />
              </div>
              <h2>Region & Currency</h2>
              <p>Choose your default currency and home country.</p>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="">Choose your country...</option>
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Private">
                    🌍 My Country is Not Listed / Prefer Private
                  </option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="currency">Default Currency</label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className={styles.selectInput}
                >
                  {WORLD_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol}) - {c.label}
                    </option>
                  ))}
                  <option value="OTHER">💸 Other (Dynamic Base)</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Other Languages You Speak (Optional)</label>
              <p className={styles.helperText}>
                This helps your AI assistant use comfortable wording!
              </p>

              <div className={styles.tagsContainerOuter}>
                <div className={styles.tagsGrid}>
                  {PRIORITY_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`${styles.tagBtn} ${
                        formData.languages.includes(lang)
                          ? styles.tagBtnActive
                          : ""
                      }`}
                    >
                      {lang}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowAllLanguages(!showAllLanguages)}
                    className={`${styles.tagBtn} ${styles.moreToggleBtn} ${
                      showAllLanguages ? styles.moreToggleActive : ""
                    }`}
                  >
                    {showAllLanguages ? (
                      <>
                        Show Less <FiMinus style={{ marginLeft: "4px" }} />
                      </>
                    ) : (
                      <>
                        + More Languages <FiPlus style={{ marginLeft: "4px" }} />
                      </>
                    )}
                  </button>
                </div>

                {showAllLanguages && (
                  <div className={styles.scrollableLanguagesContainer}>
                    <div className={styles.tagsGrid}>
                      {EXTENDED_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`${styles.tagBtn} ${
                            formData.languages.includes(lang)
                              ? styles.tagBtnActive
                              : ""
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContainer} suppressHydrationWarning>
            <div className={styles.stepHeader}>
              <div className={styles.stepIconBox}>
                <FiTarget className={styles.stepIcon} />
              </div>
              <h2>Your Financial Goals</h2>
              <p>How do you earn money, and what are you tracking?</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="occupation">Job / Income Style</label>
              <select
                id="occupation"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                className={styles.selectInput}
              >
                <option value="">Choose an option...</option>
                {OCCUPATIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} - {o.desc}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Main Financial Goal</label>
              <div className={styles.cardsGrid}>
                {FINANCIAL_GOALS.map((goal) => (
                  <div
                    key={goal.id}
                    className={`${styles.selectionCard} ${
                      formData.financialGoal === goal.id
                        ? styles.cardActive
                        : ""
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, financialGoal: goal.id })
                    }
                  >
                    <span className={styles.cardEmoji}>{goal.emoji}</span>
                    <div className={styles.cardText}>
                      <h4>{goal.title}</h4>
                      <p>{goal.desc}</p>
                    </div>
                    {formData.financialGoal === goal.id && (
                      <FiCheckCircle className={styles.checkIcon} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContainer} suppressHydrationWarning>
            <div className={styles.stepHeader}>
              <div className={styles.stepIconBox}>
                <FiCpu className={styles.stepIcon} />
              </div>
              <h2>Choose Your AI Assistant</h2>
              <p>Pick a personality style for your personal money coach.</p>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.cardsGridVertical}>
                {AI_PERSONAS.map((persona) => (
                  <div
                    key={persona.id}
                    className={`${styles.selectionCard} ${styles.aiCard} ${
                      formData.aiPersona === persona.id
                        ? styles.aiCardActive
                        : ""
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, aiPersona: persona.id })
                    }
                  >
                    <span className={styles.cardEmoji}>{persona.emoji}</span>
                    <div className={styles.cardText}>
                      <h4>{persona.title}</h4>
                      <p>{persona.desc}</p>
                    </div>
                    {formData.aiPersona === persona.id && (
                      <FiCheckCircle className={styles.checkIcon} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER COMPONENT ===
   ========================================================================== */
  return (
    <div className={styles.wizardMasterLayout} suppressHydrationWarning>
      <div className={styles.ambientGlow} />

      <div className={styles.wizardContainer}>
        {/* Progress sidebar */}
        <div className={styles.progressSidebar}>
          <Link href="/" className={styles.backHomeBtn}>
            ← Cancel
          </Link>

          <div className={styles.sidebarContent}>
            <h1 className={styles.brandTitle}>RakhoKhata.</h1>
            <p className={styles.brandSubtitle}>
              Simple financial intelligence.
            </p>

            <div className={styles.stepperTracker}>
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`${styles.stepIndicator} ${
                    signupMethod === "EMAIL" && step >= num
                      ? styles.stepIndicatorActive
                      : ""
                  }`}
                >
                  <div className={styles.stepNumber}>
                    {signupMethod === "EMAIL" && num < step ? (
                      <FiCheckCircle />
                    ) : (
                      num
                    )}
                  </div>
                  <div className={styles.stepLabels}>
                    <span className={styles.stepLabelTitle}>
                      {STEP_TITLES[num - 1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile‑only step tracker */}
          <div className={styles.mobileStepTracker}>
            <span className={styles.mobileStepBadge}>
              {signupMethod === "CHOOSE" ? (
                <>Welcome to <strong>RakhoKhata</strong></>
              ) : (
                <>
                  Step {step} of 4: <strong>{STEP_TITLES[step - 1]}</strong>
                </>
              )}
            </span>
            <div className={styles.mobileProgressBarTrack}>
              <div
                className={styles.mobileProgressBarFill}
                style={{
                  width: `${signupMethod === "CHOOSE" ? 0 : (step / 4) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className={styles.formBody}>
          <div className={styles.formContentArea}>
            {renderStepContent()}
          </div>

          {signupMethod === "EMAIL" && (
            <div className={styles.wizardFooter}>
              <button
                onClick={handlePrev}
                className={styles.btnSecondary}
                disabled={isSubmitting}
              >
                <FiChevronLeft /> {step === 1 ? "Change Method" : "Back"}
              </button>

              {step < 4 ? (
                <button onClick={handleNext} className={styles.btnPrimary}>
                  Continue <FiChevronRight />
                </button>
              ) : (
                <button
                  onClick={submitForm}
                  className={styles.btnFinish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Finish Registration"}
                  <FiCheckCircle style={{ marginLeft: "8px" }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */