// src/app/(auth)/onboarding/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FiGlobe,
  FiTarget,
  FiCpu,
  FiChevronRight,
  FiChevronLeft,
  FiCheckCircle,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

import {
  WORLD_CURRENCIES,
  WORLD_COUNTRIES,
  PRIORITY_LANGUAGES,
  EXTENDED_LANGUAGES,
} from "@/constants/geoData";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

/** Occupation options for the onboarding form */
interface OccupationOption {
  id: string;
  label: string;
  desc: string;
}

/** Financial goal cards */
interface FinancialGoal {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

/** AI persona cards */
interface AiPersona {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

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

const STEP_TITLES = ["Region", "Goals", "AI Assistant"];

/** Shape of the onboarding form data */
interface OnboardingFormData {
  country: string;
  currency: string;
  languages: string[];
  occupation: string;
  financialGoal: string;
  aiPersona: string;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */

export default function OnboardingPage() {
  const router = useRouter();

  // Step tracker (1‑3)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    country: "",
    currency: "USD",
    languages: [],
    occupation: "",
    financialGoal: "",
    aiPersona: "",
  });

  // Auto‑detect user’s region from timezone
  useEffect(() => {
    const timer = setTimeout(() => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Karachi")) {
        setFormData((prev) => ({
          ...prev,
          currency: "PKR",
          country: "Pakistan",
          languages: ["Urdu (اُردو)", "English"],
        }));
      } else if (tz.includes("Europe")) {
        setFormData((prev) => ({ ...prev, currency: "EUR" }));
      } else if (tz.includes("London")) {
        setFormData((prev) => ({
          ...prev,
          currency: "GBP",
          country: "United Kingdom",
          languages: ["English"],
        }));
      } else if (tz.includes("Calcutta") || tz.includes("Kolkata")) {
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

  // Country change handler (auto‑sets currency & language)
  const handleCountryChange = (selectedCountryName: string) => {
    const match = WORLD_COUNTRIES.find((c) => c.name === selectedCountryName);
    setFormData((prev) => {
      const languagesSet = new Set(prev.languages);
      if (match) {
        languagesSet.add(match.defaultLanguage);
        return {
          ...prev,
          country: selectedCountryName,
          currency: match.defaultCurrency,
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

  // Step navigation
  const goNext = () => {
    if (step === 1 && !formData.country) {
      toast.error("Please choose your home country before continuing.");
      return;
    }
    if (step === 2 && (!formData.occupation || !formData.financialGoal)) {
      toast.error("Please pick your job style and core financial goal.");
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  // Final submission
  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/complete-onboarding",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result
            ? (result as { error: string }).error
            : "Profile initialization failed.";
        throw new Error(errorMessage);
      }

      toast.success("Profile customized! Opening your intelligence suite...");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error: unknown) {
      console.error("Onboarding Submit Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Could not synchronize with personalization tables.";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContainer}>
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

      case 2:
        return (
          <div className={styles.stepContainer}>
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

      case 3:
        return (
          <div className={styles.stepContainer}>
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
    <div className={styles.wizardMasterLayout}>
      <div className={styles.ambientGlow} />

      <div className={styles.wizardContainer}>
        {/* Progress sidebar */}
        <div className={styles.progressSidebar}>
          <Link href="/login" className={styles.backHomeBtn}>
            ← Abort Setup
          </Link>
          <div className={styles.sidebarContent}>
            <h1 className={styles.brandTitle}>RakhoKhata.</h1>
            <p className={styles.brandSubtitle}>
              Simple financial intelligence.
            </p>

            <div className={styles.stepperTracker}>
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`${styles.stepIndicator} ${
                    step >= num ? styles.stepIndicatorActive : ""
                  }`}
                >
                  <div className={styles.stepNumber}>
                    {num < step ? <FiCheckCircle /> : num}
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

          {/* DEDICATED MOBILE-ONLY STEP TRACKER CONTAINER */}
          <div className={styles.mobileStepTracker}>
            <span className={styles.mobileStepBadge}>
              Step {step} of 3: <strong>{STEP_TITLES[step - 1]}</strong>
            </span>
            <div className={styles.mobileProgressBarTrack}>
              <div
                className={styles.mobileProgressBarFill}
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className={styles.formBody}>
          <div className={styles.formContentArea}>
            {renderStepContent()}
          </div>

          <div className={styles.wizardFooter}>
            {step > 1 ? (
              <button
                onClick={goPrev}
                className={styles.btnSecondary}
                disabled={isSubmitting}
              >
                <FiChevronLeft /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button onClick={goNext} className={styles.btnPrimary}>
                Continue <FiChevronRight />
              </button>
            ) : (
              <button
                onClick={submitForm}
                className={styles.btnFinish}
                disabled={isSubmitting || !formData.aiPersona}
              >
                {isSubmitting ? "Finalizing..." : "Complete Customization"}
                <FiCheckCircle style={{ marginLeft: "8px" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */