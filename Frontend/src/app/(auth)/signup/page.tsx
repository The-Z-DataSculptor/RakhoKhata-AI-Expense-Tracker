// src/app/(auth)/signup/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FiMinus
} from "react-icons/fi";

import { signupSchema } from "@/schemas/auth"; 
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: GLOBAL DATA ===
   ========================================================================== */
const CURRENCIES = [
  "USD", "PKR", "EUR", "GBP", "JPY", "INR", "CAD", "AUD", "AED", "SAR",
  "SGD", "CHF", "CNY", "HKD", "NZD", "SEK", "KRW", "NOK", "MXN",
  "RUB", "ZAR", "TRY", "BRL", "TWD", "PLN", "THB", "IDR", "HUF", "DKK",
  "ILS", "CLP", "PHP", "COP", "MYR", "RON", "VND", "KWD",
  "💸 Other (Dynamic Base)"
];

const COUNTRIES = [
  "Pakistan", "United States", "United Kingdom", "Germany", "Japan", 
  "India", "Canada", "Australia", "United Arab Emirates", "Saudi Arabia",
  "Afghanistan", "Albania", "Algeria", "Argentina", "Austria", "Bangladesh", 
  "Belgium", "Brazil", "Chile", "China", "Colombia", "Denmark", "Egypt", 
  "Finland", "France", "Greece", "Hong Kong", "Indonesia", "Iran", "Iraq", 
  "Ireland", "Israel", "Italy", "Jordan", "Kenya", "Kuwait", "Malaysia", 
  "Mexico", "Morocco", "Netherlands", "New Zealand", "Norway", "Oman", 
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", 
  "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", 
  "Thailand", "Turkey", "Ukraine", "Vietnam", "Yemen", "Zimbabwe",
  "🌍 My Country is Not Listed / Prefer Private"
];

const PRIORITY_LANGUAGES = [
  "English", 
  "Urdu (اُردو)", 
  "Punjabi (پنجابی)", 
  "Sindhi (سنڌي)", 
  "Pashto (پښتو)", 
  "Hindi (हिन्दी)", 
  "Spanish (Español)", 
  "Arabic (العربية)",
  "French (Français)", 
  "German (Deutsch)", 
  "Japanese (日本語)"
];

const EXTENDED_LANGUAGES = [
  "Bengali (বাংলা)",
  "Tamil (தமிழ்)", 
  "Telugu (తెలుగు)", 
  "Marathi (मराठी)", 
  "Italian (Italiano)",
  "Portuguese (Português)", 
  "Russian (Русский)", 
  "Turkish (Türkçe)", 
  "Mandarin (中文)",
  "Korean (한국어)", 
  "Vietnamese (Tiếng Việt)", 
  "Thai (ภาษาไทย)", 
  "Kashmiri (کٲشُر)",
  "Saraiki (سرائیکی)", 
  "Balochi (بلوچی)", 
  "🤐 Standard English Only"
];

const OCCUPATIONS = [
  { id: "salaried", label: "Salaried Employee", desc: "Fixed monthly paycheck" },
  { id: "freelancer", label: "Freelancer / Contractor", desc: "Irregular client payouts" },
  { id: "entrepreneur", label: "Entrepreneur / Business", desc: "Focuses on business revenue" },
  { id: "student", label: "Student", desc: "Living on a tight budget" },
  { id: "gig_worker", label: "Gig Worker / Creator", desc: "Flexible earnings" },
  { id: "prefer_not_to_say", label: "Prefer Not to Say", desc: "Keep it private 🔒" },
];

const FINANCIAL_GOALS = [
  { id: "hustler", emoji: "🚀", title: "The Hustler", desc: "Managing gigs & multiple income streams." },
  { id: "saver", emoji: "🏦", title: "The Saver", desc: "Building an emergency fund or buying a home." },
  { id: "tight_budgeter", emoji: "🔍", title: "The Budgeter", desc: "Living paycheck-to-paycheck, finding leaks." },
  { id: "zen_master", emoji: "🧘‍♂️", title: "The Zen Master", desc: "Just tracking cash flows with zero stress." },
  { id: "wealth_builder", emoji: "📈", title: "The Wealth Builder", desc: "Investing, growing assets, and compound growth." },
  { id: "debt_destroyer", emoji: "🔨", title: "The Debt Destroyer", desc: "Aggressively tackling outstanding loans & debt." },
  { id: "nomad", emoji: "🗺️", title: "The Nomad / Expat", desc: "Working globally, handling multi-currency accounts." },
  { id: "privacy_sentinel", emoji: "🛡️", title: "Prefer Private", desc: "Do not categorize or analyze my financial intentions." },
];

const AI_PERSONAS = [
  { id: "savage_roaster", emoji: "🔥", title: "Savage Roaster", desc: "Tough love. Will playfully roast your spending habits." },
  { id: "supportive_coach", emoji: "🤝", title: "Supportive Coach", desc: "Warm mentor. Celebrates wins and guides gently." },
  { id: "forensic_detective", emoji: "🕵️‍♂️", title: "Forensic Detective", desc: "Hyper-analytical. Finds sneaky hidden spending leaks." },
  { id: "silent_accountant", emoji: "📊", title: "Silent Accountant", desc: "Professional. No jokes, just raw mathematical logic." },
];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false); 

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    currency: "USD",
    languages: [] as string[],
    occupation: "",
    financialGoal: "",
    aiPersona: "",
  });

  useEffect(() => {
    const detectionTimer = setTimeout(() => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Karachi")) {
        setFormData(prev => ({ ...prev, currency: "PKR", country: "Pakistan" }));
      } else if (tz.includes("Europe")) {
        setFormData(prev => ({ ...prev, currency: "EUR" }));
      } else if (tz.includes("London")) {
        setFormData(prev => ({ ...prev, currency: "GBP", country: "United Kingdom" }));
      }
    }, 0);

    return () => clearTimeout(detectionTimer);
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const validation = signupSchema.safeParse(formData);

      if (!validation.success) {
        // 🚀 FIX: Used .issues instead of .errors to satisfy strict TypeScript rules
        const firstErrorMessage = validation.error.issues[0]?.message || "Please check your inputs.";
        toast.error(firstErrorMessage);
        return; 
      }
    }
    
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const toggleLanguage = (lang: string) => {
    setFormData(prev => {
      const current = prev.languages;
      if (current.includes(lang)) return { ...prev, languages: current.filter(l => l !== lang) };
      return { ...prev, languages: [...current, lang] };
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Registration failed.");

      toast.success("Welcome to RakhoKhata! Personalizing your ledger...");
      setTimeout(() => router.push("/dashboard"), 1500);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to server.";
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContainer} suppressHydrationWarning>
            <div className={styles.stepHeader}>
              <div className={styles.stepIconBox}><FiUser className={styles.stepIcon} /></div>
              <h2>Let's start with the basics</h2>
              <p>Create your secure account to access the vault.</p>
            </div>
            <div className={styles.inputGroup}>
              <label>Full Name / Nickname</label>
              <input 
                type="text" 
                placeholder="What should AI call you?" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className={styles.textInput}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className={styles.textInput}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="Secure password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className={styles.textInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Confirm</label>
                <input 
                  type="password" 
                  placeholder="Confirm password" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
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
              <div className={styles.stepIconBox}><FiGlobe className={styles.stepIcon} /></div>
              <h2>Localize Your Experience</h2>
              <p>We'll adapt the charts, currency, and AI jokes to your region.</p>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Default Currency</label>
                <select 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                  className={styles.selectInput}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Country / Region</label>
                <select 
                  value={formData.country} 
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  className={styles.selectInput}
                >
                  <option value="">Select a country...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Other Languages You Speak (Optional)</label>
              <p className={styles.helperText}>Lets your AI Buddy use local slang and idioms!</p>
              
              <div className={styles.tagsContainerOuter}>
                <div className={styles.tagsGrid}>
                  {PRIORITY_LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`${styles.tagBtn} ${formData.languages.includes(lang) ? styles.tagBtnActive : ""}`}
                    >
                      {lang}
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setShowAllLanguages(!showAllLanguages)}
                    className={`${styles.tagBtn} ${styles.moreToggleBtn} ${showAllLanguages ? styles.moreToggleActive : ""}`}
                  >
                    {showAllLanguages ? (
                      <>Show Less <FiMinus style={{marginLeft: "4px"}}/></>
                    ) : (
                      <>+ More Languages <FiPlus style={{marginLeft: "4px"}}/></>
                    )}
                  </button>
                </div>

                {showAllLanguages && (
                  <div className={styles.scrollableLanguagesContainer}>
                    <div className={styles.tagsGrid}>
                      {EXTENDED_LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`${styles.tagBtn} ${formData.languages.includes(lang) ? styles.tagBtnActive : ""}`}
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
              <div className={styles.stepIconBox}><FiTarget className={styles.stepIcon} /></div>
              <h2>Your Financial Vibe</h2>
              <p>How do you earn, and what's your ultimate goal?</p>
            </div>

            <div className={styles.inputGroup}>
              <label>Primary Occupation / Income Style</label>
              <select 
                value={formData.occupation} 
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                className={styles.selectInput}
              >
                <option value="">Select an option...</option>
                {OCCUPATIONS.map(o => (
                  <option key={o.id} value={o.id}>{o.label} - {o.desc}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Financial Focus</label>
              <div className={styles.cardsGrid}>
                {FINANCIAL_GOALS.map(goal => (
                  <div 
                    key={goal.id} 
                    className={`${styles.selectionCard} ${formData.financialGoal === goal.id ? styles.cardActive : ""}`}
                    onClick={() => setFormData({...formData, financialGoal: goal.id})}
                  >
                    <span className={styles.cardEmoji}>{goal.emoji}</span>
                    <div className={styles.cardText}>
                      <h4>{goal.title}</h4>
                      <p>{goal.desc}</p>
                    </div>
                    {formData.financialGoal === goal.id && <FiCheckCircle className={styles.checkIcon} />}
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
              <div className={styles.stepIconBox}><FiCpu className={styles.stepIcon} /></div>
              <h2>Tune Your AI Companion</h2>
              <p>Choose the personality for your personal financial assistant.</p>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.cardsGridVertical}>
                {AI_PERSONAS.map(persona => (
                  <div 
                    key={persona.id} 
                    className={`${styles.selectionCard} ${styles.aiCard} ${formData.aiPersona === persona.id ? styles.aiCardActive : ""}`}
                    onClick={() => setFormData({...formData, aiPersona: persona.id})}
                  >
                    <span className={styles.cardEmoji}>{persona.emoji}</span>
                    <div className={styles.cardText}>
                      <h4>{persona.title}</h4>
                      <p>{persona.desc}</p>
                    </div>
                    {formData.aiPersona === persona.id && <FiCheckCircle className={styles.checkIcon} />}
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
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.wizardMasterLayout} suppressHydrationWarning>
      <div className={styles.ambientGlow} />

      <div className={styles.wizardContainer}>
        {/* Progress Sidebar */}
        <div className={styles.progressSidebar}>
          <Link href="/" className={styles.backHomeBtn}>← Cancel</Link>
          <div className={styles.sidebarContent}>
            <h1 className={styles.brandTitle}>RakhoKhata.</h1>
            <p className={styles.brandSubtitle}>Personalized financial intelligence.</p>
            
            <div className={styles.stepperTracker}>
              {[1, 2, 3, 4].map(num => (
                <div key={num} className={`${styles.stepIndicator} ${step >= num ? styles.stepIndicatorActive : ""}`}>
                  <div className={styles.stepNumber}>{num < step ? <FiCheckCircle /> : num}</div>
                  <div className={styles.stepLabels}>
                    <span className={styles.stepLabelTitle}>
                      {num === 1 ? "Identity" : num === 2 ? "Region" : num === 3 ? "Goals" : "AI Buddy"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className={styles.formBody}>
          <div className={styles.formContentArea}>
            {renderStepContent()}
          </div>

          <div className={styles.wizardFooter}>
            {step > 1 ? (
              <button onClick={handlePrev} className={styles.btnSecondary} disabled={isSubmitting}>
                <FiChevronLeft /> Back
              </button>
            ) : (
              <div /> 
            )}
            
            {step < 4 ? (
              <button onClick={handleNext} className={styles.btnPrimary}>
                Continue <FiChevronRight />
              </button>
            ) : (
              <button onClick={submitForm} className={styles.btnFinish} disabled={isSubmitting || !formData.aiPersona}>
                {isSubmitting ? "Initializing..." : "Complete Setup"} <FiCheckCircle style={{marginLeft: "8px"}}/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */