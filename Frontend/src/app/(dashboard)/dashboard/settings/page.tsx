// Frontend/src/app/(dashboard)/dashboard/settings/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & STATIC DATA ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { useUser } from "@/app/(dashboard)/context/UserContext";
import { vaultAuthService, userService, workspaceService } from "@/utils/api";
import { PinSetupModal } from "@/components/investments/PinSetupModal/PinSetupModal";
import {
  FiShield,
  FiSliders as FiLayers,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiLoader,
  FiUser,
  FiLock,
  FiGlobe,
  FiTarget,
  FiCpu,
  FiChevronDown,
  FiZap,
  FiAward,
  FiSearch,
  FiSmile,
  FiTrendingUp,
  FiActivity,
  FiCompass,
  FiHeart,
  FiEye,
  FiBarChart2,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "sonner";
import styles from "./page.module.css";

const CURRENCIES = [
  "USD", "PKR", "EUR", "GBP", "JPY", "INR", "CAD", "AUD", "AED", "SAR",
  "SGD", "CHF", "CNY", "HKD", "NZD", "SEK", "KRW", "NOK", "MXN",
  "RUB", "ZAR", "TRY", "BRL", "TWD", "PLN", "THB", "IDR", "HUF", "DKK",
  "ILS", "CLP", "PHP", "COP", "MYR", "RON", "VND", "KWD",
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
];

const PRIORITY_LANGUAGES = [
  "English", "Urdu (اُردو)", "Punjabi (پنجابی)", "Sindhi (سنڌي)", 
  "Pashto (پښتو)", "Hindi (हिन्दी)", "Spanish (Español)", 
  "Arabic (العربية)", "French (Français)", "German (Deutsch)", "Japanese (日本語)"
];

const EXTENDED_LANGUAGES = [
  "Bengali (বাংলা)", "Tamil (தமிழ்)", "Telugu (తెలుగు)", "Marathi (مراٹھی)",
  "Italian (Italiano)", "Portuguese (Português)", "Russian (Русский)",
  "Turkish (Türkçe)", "Mandarin (中文)", "Korean (한국어)", 
  "Vietnamese (Tiếng Việt)", "Thai (ภาษาไทย)", "Kashmiri (کٲشُر)",
  "Saraiki (سرائیکی)", "Balochi (بلوچی)"
];

const OCCUPATIONS = [
  { id: "salaried", label: "Salaried Employee", desc: "Fixed monthly paycheck" },
  { id: "freelancer", label: "Freelancer / Contractor", desc: "Irregular client payouts" },
  { id: "entrepreneur", label: "Entrepreneur / Business", desc: "Focuses on business revenue" },
  { id: "student", label: "Student", desc: "Living on a tight budget" },
  { id: "gig_worker", label: "Gig Worker / Creator", desc: "Flexible earnings" },
  { id: "prefer_not_to_say", label: "Prefer Not to Say", desc: "Keep it private and unlisted" },
];

const FINANCIAL_GOALS = [
  { id: "hustler", icon: <FiZap />, title: "The Hustler", desc: "Managing gigs & multiple income streams." },
  { id: "saver", icon: <FiAward />, title: "The Saver", desc: "Building an emergency fund or buying a home." },
  { id: "tight_budgeter", icon: <FiSearch />, title: "The Budgeter", desc: "Living paycheck-to-paycheck, finding leaks." },
  { id: "zen_master", icon: <FiSmile />, title: "The Zen Master", desc: "Just tracking cash flows with zero stress." },
  { id: "wealth_builder", icon: <FiTrendingUp />, title: "The Wealth Builder", desc: "Investing, growing assets, and compound growth." },
  { id: "debt_destroyer", icon: <FiActivity />, title: "The Debt Destroyer", desc: "Aggressively tackling outstanding loans & debt." },
  { id: "nomad", icon: <FiCompass />, title: "The Nomad / Expat", desc: "Working globally, handling multi-currency accounts." },
  { id: "privacy_sentinel", icon: <FiShield />, title: "Prefer Private", desc: "Do not categorize or analyze my financial intentions." },
];

const AI_PERSONAS = [
  { id: "savage_roaster", icon: <FiZap />, title: "Savage Roaster", desc: "Tough love. Will playfully challenge your unnecessary spending habits." },
  { id: "supportive_coach", icon: <FiHeart />, title: "Supportive Coach", desc: "Warm mentor. Celebrates wins and guides your journey gently." },
  { id: "forensic_detective", icon: <FiEye />, title: "Forensic Detective", desc: "Hyper-analytical. Finds subtle recurring and hidden spending leaks." },
  { id: "silent_accountant", icon: <FiBarChart2 />, title: "Silent Accountant", desc: "Professional precision. Direct financial ledger calculations without banter." },
];

const clearAiBuddyCache = () => {
  if (typeof window !== "undefined") {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("rakhokhaata_greeting_")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: COMPONENT STATE & HANDLERS ===
   ========================================================================== */
export default function SettingsPage() {
  const { workspaces, activeWorkspace, activeWorkspaceId, deleteWorkspace, updateWorkspaceInState } = useWorkspace();
  const { setCurrencyWithWorkspace } = useCurrency();
  const { refreshUser, updateUserInState } = useUser();

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "location" | "vibe" | "ai" | "security">("general");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [occupation, setOccupation] = useState("");
  const [financialGoal, setFinancialGoal] = useState("");
  const [aiPersona, setAiPersona] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Workspace rename / delete state
  const [renameInput, setRenameInput] = useState<string>(activeWorkspace?.name || "");
  const [prevWorkspaceId, setPrevWorkspaceId] = useState<string | undefined>(activeWorkspaceId);
  const [isWorkspaceSaving, setIsWorkspaceSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Vault security
  const [isVaultSecurityEnabled, setIsVaultSecurityEnabled] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isSecurityLoading, setIsSecurityLoading] = useState<boolean>(true);
  const [pinModalMode, setPinModalMode] = useState<"SETUP" | "DISABLE" | "CHANGE">("SETUP");

  // FIX: Recommended React pattern for adjusting state during render when props/context change
  if (activeWorkspaceId !== prevWorkspaceId) {
    setPrevWorkspaceId(activeWorkspaceId);
    setRenameInput(activeWorkspace?.name || "");
  }

  // ---------------------------------------------------------------------------
  // PROFILE DATA FETCHING
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      setIsProfileLoading(true);
      try {
        const response = await userService.getProfile();
        if (!cancelled) {
          const user = response.user;
          setName(user.name || "");
          setEmail(user.email || "");
          setCountry(user.country || "");
          setCurrency(user.currency || activeWorkspace?.currency || "USD");
          setLanguages(user.languages || []);
          setOccupation(user.occupation || "");
          setFinancialGoal(user.financialGoal || "");
          setAiPersona(user.aiPersona || "");
        }
      } catch {
        if (!cancelled) toast.error("Could not load your profile data.");
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [activeWorkspace?.currency]);

  // ---------------------------------------------------------------------------
  // VAULT PIN STATUS
  // ---------------------------------------------------------------------------
  const fetchVaultPinStatus = async () => {
    try {
      const status = await vaultAuthService.checkStatus();
      setIsVaultSecurityEnabled(status.hasPin);
    } catch {
      // retain state
    } finally {
      setIsSecurityLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const status = await vaultAuthService.checkStatus();
        if (!cancelled) setIsVaultSecurityEnabled(status.hasPin);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsSecurityLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // SAVE ACTIONS
  // ---------------------------------------------------------------------------
  const refetchProfile = async () => {
    await refreshUser();
    const response = await userService.getProfile();
    const user = response.user;
    setName(user.name || "");
    setEmail(user.email || "");
    setCountry(user.country || "");
    setCurrency(user.currency || "");
    setLanguages(user.languages || []);
    setOccupation(user.occupation || "");
    setFinancialGoal(user.financialGoal || "");
    setAiPersona(user.aiPersona || "");
  };

  const handleSaveBasicInfo = async () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setIsSaving(true);
    try {
      await userService.updateProfile({ name: name.trim() });
      updateUserInState({ name: name.trim() });
      clearAiBuddyCache();
      await refetchProfile();
      toast.success("Profile updated!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      toast.error(message);
    } finally { setIsSaving(false); }
  };

  const handleSaveLocation = async () => {
    setIsSaving(true);
    try {
      await userService.updateProfile({ country, currency, languages });
      
      if (activeWorkspaceId && currency) {
        await setCurrencyWithWorkspace(currency, activeWorkspaceId);
      }

      clearAiBuddyCache();
      await refetchProfile();
      toast.success("Location & language updated!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update location.";
      toast.error(message);
    } finally { setIsSaving(false); }
  };

  const handleSaveVibe = async () => {
    setIsSaving(true);
    try {
      await userService.updateProfile({ occupation, financialGoal });
      updateUserInState({ occupation, financialGoal });
      clearAiBuddyCache();
      await refetchProfile();
      toast.success("Financial profile updated!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      toast.error(message);
    } finally { setIsSaving(false); }
  };

  const handleSaveAIPersona = async () => {
    setIsSaving(true);
    try {
      await userService.updateProfile({ aiPersona });
      updateUserInState({ aiPersona });
      clearAiBuddyCache();
      await refreshUser();
      await refetchProfile();
      toast.success("AI personality updated!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update AI persona.";
      toast.error(message);
    } finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change password.";
      toast.error(message);
    } finally { setIsChangingPassword(false); }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameInput.trim();
    if (!trimmed || !activeWorkspace) return;

    setIsWorkspaceSaving(true);
    try {
      await workspaceService.update(activeWorkspace.id, { name: trimmed });
      updateWorkspaceInState(activeWorkspace.id, { name: trimmed });
      clearAiBuddyCache();
      toast.success("Workspace renamed!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to rename workspace.";
      toast.error(message);
    } finally { setIsWorkspaceSaving(false); }
  };

  const handleDeleteClick = async (targetWorkspaceId: string) => {
    if (targetWorkspaceId === activeWorkspaceId) {
      toast.error("You cannot delete the active workspace.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      setDeletingId(targetWorkspaceId);
      await deleteWorkspace(targetWorkspaceId);
    } catch (error: unknown) {
      console.error("Workspace delete error:", error);
    } finally { setDeletingId(null); }
  };

  const handleSecurityToggle = () => {
    setPinModalMode(isVaultSecurityEnabled ? "DISABLE" : "SETUP");
    setIsPinModalOpen(true);
  };
  const handleChangePinClick = () => {
    setPinModalMode("CHANGE");
    setIsPinModalOpen(true);
  };
  const handlePinSetupSuccess = async () => {
    setIsPinModalOpen(false);
    setIsSecurityLoading(true);
    await fetchVaultPinStatus();
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };
  const allLanguages = [...PRIORITY_LANGUAGES, ...EXTENDED_LANGUAGES];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RENDER COMPONENT ===
   ========================================================================== */
  if (isProfileLoading) {
    return (
      <div className={styles.settingsCanvasDeck}>
        <div className={styles.loadingState}>
          <FiLoader className={styles.loadingSpinnerAnimation} size={24} />
          <p>Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settingsCanvasDeck}>
      {/* Header */}
      <header className={styles.dashboardHeaderCardBox}>
        <div className={styles.headingBlock}>
          <h1 className={styles.mainHeadline}>Settings</h1>
          <p className={styles.subtextDescription}>
            Manage your account preferences, tailor your AI, and secure your vault.
          </p>
        </div>
      </header>

      <div className={styles.cardsStackDeck}>
        {/* Workspace Card */}
        <section className={styles.settingsCardNode}>
          <div className={styles.cardHeaderArea}>
            <div className={styles.iconIndicatorFrame}>
              <FiLayers size={18} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Your Workspaces</h2>
              <p className={styles.cardContextExplanation}>
                Rename the current workspace, or clear out old workspaces you no longer need.
              </p>
            </div>
          </div>

          <div className={styles.cardBodyContent}>
            <form onSubmit={handleRenameSubmit} className={styles.renameFormBlock}>
              <div className={styles.inputFieldGroup}>
                <label className={styles.fieldLabelText}>Change Current Workspace Name</label>
                <div className={styles.inputActionCluster}>
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    placeholder="e.g., Personal Finances"
                    required
                    className={styles.primaryTextInputElement}
                  />
                  <button type="submit" className={styles.saveActionSubmitBtn} disabled={isWorkspaceSaving}>
                    {isWorkspaceSaving ? <FiLoader className={styles.loadingSpinnerAnimation} /> : <FiEdit2 size={14} />}
                    <span>{isWorkspaceSaving ? "Saving..." : "Save Name"}</span>
                  </button>
                </div>
              </div>
            </form>

            <div className={styles.dividerSplitLine} />

            <div className={styles.directoryEntriesListWrapper}>
              <h3 className={styles.subSectionLabel}>All Your Workspaces ({workspaces.length})</h3>
              <div className={styles.entriesGridList}>
                {workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  const isDeleting = deletingId === ws.id;
                  return (
                    <div
                      key={ws.id}
                      className={`${styles.wsRowCardItem} ${isActive ? styles.wsActiveCardHighlight : ""} ${isDeleting ? styles.wsRowCardDeleting : ""}`}
                    >
                      <div className={styles.wsRowIdentityFrame}>
                        <span className={styles.wsVisualMarkerDot} />
                        <span className={styles.wsIdentityNameLabel}>{ws.name}</span>
                        {isActive && <span className={styles.activeStatusPillBadge}>Active Now</span>}
                        {isDeleting && <span className={styles.deletingStatusPillBadge}>Erasing...</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(ws.id)}
                        disabled={isActive || deletingId !== null}
                        className={styles.rowDeleteTriggerActionBtn}
                        aria-label={`Delete ${ws.name}`}
                      >
                        {isDeleting ? <FiLoader size={14} className={styles.loadingSpinnerAnimation} /> : <FiTrash2 size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Profile Settings */}
        <section className={styles.settingsCardNode} style={{ padding: 0, overflow: "hidden" }}>
          <div className={styles.modernSettingsContainer}>
            <div className={styles.mobileTabSelectorWrapper}>
              <label htmlFor="mobile-settings-tab" className={styles.mobileTabSelectorLabel}>
                Settings Category
              </label>
              <div className={styles.mobileSelectFrame}>
                <select
                  id="mobile-settings-tab"
                  value={activeTab}
                  onChange={(e) =>
                    setActiveTab(e.target.value as "general" | "location" | "vibe" | "ai" | "security")
                  }
                  className={styles.mobileTabSelectElement}
                >
                  <option value="general">👤 Identity Details</option>
                  <option value="location">🌐 Localization & Language</option>
                  <option value="vibe">🎯 Financial Vibe & Goals</option>
                  <option value="ai">🤖 AI Persona Companion</option>
                  <option value="security">🔒 Password & Security</option>
                </select>
                <FiChevronDown className={styles.mobileSelectChevronIcon} size={18} />
              </div>
            </div>

            <div className={styles.settingsSidebar}>
              <button
                onClick={() => setActiveTab("general")}
                className={`${styles.tabButton} ${activeTab === "general" ? styles.tabButtonActive : ""}`}
              >
                <FiUser className={styles.tabIcon} />
                <span className={styles.tabText}>Identity</span>
              </button>
              <button
                onClick={() => setActiveTab("location")}
                className={`${styles.tabButton} ${activeTab === "location" ? styles.tabButtonActive : ""}`}
              >
                <FiGlobe className={styles.tabIcon} />
                <span className={styles.tabText}>Localization</span>
              </button>
              <button
                onClick={() => setActiveTab("vibe")}
                className={`${styles.tabButton} ${activeTab === "vibe" ? styles.tabButtonActive : ""}`}
              >
                <FiTarget className={styles.tabIcon} />
                <span className={styles.tabText}>Financial Vibe</span>
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`${styles.tabButton} ${activeTab === "ai" ? styles.tabButtonActive : ""}`}
              >
                <FiCpu className={styles.tabIcon} />
                <span className={styles.tabText}>AI Persona</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`${styles.tabButton} ${activeTab === "security" ? styles.tabButtonActive : ""}`}
              >
                <FiLock className={styles.tabIcon} />
                <span className={styles.tabText}>Password</span>
              </button>
            </div>

            <div className={styles.settingsContentArea}>
              {/* Identity */}
              {activeTab === "general" && (
                <div className={styles.animateFadeIn}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Identity Details</h3>
                    <p className={styles.panelDescription}>How the system addresses you.</p>
                  </div>
                  <div className={styles.profileFormRow}>
                    <div className={styles.inputFieldGroup}>
                      <label className={styles.fieldLabelText}>Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.primaryTextInputElement}
                        placeholder="Your name"
                      />
                    </div>
                    <div className={styles.inputFieldGroup}>
                      <label className={styles.fieldLabelText}>Email Address (Read-Only)</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        readOnly
                        className={styles.primaryTextInputElement}
                        style={{ opacity: 0.7, cursor: "not-allowed" }}
                      />
                    </div>
                  </div>
                  <div className={styles.actionFooter}>
                    <button onClick={handleSaveBasicInfo} disabled={isSaving} className={styles.saveActionSubmitBtn}>
                      {isSaving ? <FiLoader className={styles.loadingSpinnerAnimation} /> : <FiCheck size={14} />}
                      <span>{isSaving ? "Saving..." : "Save Identity"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Localization */}
              {activeTab === "location" && (
                <div className={styles.animateFadeIn}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Localization</h3>
                    <p className={styles.panelDescription}>Regional settings and language preferences.</p>
                  </div>
                  <div className={styles.profileFormRow}>
                    <div className={styles.inputFieldGroup}>
                      <label className={styles.fieldLabelText}>Country</label>
                      <select value={country} onChange={(e) => setCountry(e.target.value)} className={styles.selectInput}>
                        <option value="">Select a country...</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={styles.inputFieldGroup}>
                      <label className={styles.fieldLabelText}>Default Currency</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={styles.selectInput}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={styles.inputFieldGroup} style={{ marginTop: "1.5rem" }}>
                    <label className={styles.fieldLabelText}>Languages you speak</label>
                    <div className={styles.tagsGrid}>
                      {allLanguages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`${styles.tagBtn} ${languages.includes(lang) ? styles.tagBtnActive : ""}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionFooter}>
                    <button onClick={handleSaveLocation} disabled={isSaving} className={styles.saveActionSubmitBtn}>
                      {isSaving ? <FiLoader className={styles.loadingSpinnerAnimation} /> : <FiCheck size={14} />}
                      <span>{isSaving ? "Saving..." : "Save Localization"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Financial Vibe */}
              {activeTab === "vibe" && (
                <div className={styles.animateFadeIn}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Financial Vibe</h3>
                    <p className={styles.panelDescription}>Tell us about your work style and primary objectives.</p>
                  </div>
                  <div className={styles.inputFieldGroup} style={{ marginBottom: "1.5rem" }}>
                    <label className={styles.fieldLabelText}>Occupation Style</label>
                    <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className={styles.selectInput}>
                      <option value="">Select an occupation...</option>
                      {OCCUPATIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label} — {o.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputFieldGroup}>
                    <label className={styles.fieldLabelText}>Primary Financial Goal</label>
                    <div className={styles.selectionCardsGrid}>
                      {FINANCIAL_GOALS.map((g) => (
                        <div
                          key={g.id}
                          onClick={() => setFinancialGoal(g.id)}
                          className={`${styles.selectionCard} ${financialGoal === g.id ? styles.selectionCardActive : ""}`}
                        >
                          <div className={styles.cardIconBox}>{g.icon}</div>
                          <div className={styles.cardText}>
                            <h4>{g.title}</h4>
                            <p>{g.desc}</p>
                          </div>
                          {financialGoal === g.id && (
                            <FiCheckCircle className={styles.checkIcon} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionFooter}>
                    <button onClick={handleSaveVibe} disabled={isSaving} className={styles.saveActionSubmitBtn}>
                      {isSaving ? <FiLoader className={styles.loadingSpinnerAnimation} /> : <FiCheck size={14} />}
                      <span>{isSaving ? "Saving..." : "Save Financial Profile"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AI Persona */}
              {activeTab === "ai" && (
                <div className={styles.animateFadeIn}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>AI Companion</h3>
                    <p className={styles.panelDescription}>Select the personality tone for your financial AI assistant.</p>
                  </div>
                  <div className={styles.selectionCardsGridVertical}>
                    {AI_PERSONAS.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setAiPersona(p.id)}
                        className={`${styles.selectionCard} ${styles.aiCard} ${aiPersona === p.id ? styles.aiCardActive : ""}`}
                      >
                        <div className={styles.aiIconBox}>{p.icon}</div>
                        <div className={styles.cardText}>
                          <h4>{p.title}</h4>
                          <p>{p.desc}</p>
                        </div>
                        {aiPersona === p.id && (
                          <FiCheckCircle className={styles.checkIcon} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className={styles.actionFooter}>
                    <button onClick={handleSaveAIPersona} disabled={isSaving} className={styles.saveActionSubmitBtn}>
                      {isSaving ? <FiLoader className={styles.loadingSpinnerAnimation} /> : <FiCheck size={14} />}
                      <span>{isSaving ? "Saving..." : "Save AI Personality"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Password */}
              {activeTab === "security" && (
                <div className={styles.animateFadeIn}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Change Password</h3>
                    <p className={styles.panelDescription}>Update your master account credentials securely.</p>
                  </div>
                  <div className={styles.inputFieldGroup} style={{ marginBottom: "1rem" }}>
                    <label className={styles.fieldLabelText}>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={styles.primaryTextInputElement}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className={styles.profileFormRow}>
                    <div className={styles.inputFieldGroup}>
                      <label className={styles.fieldLabelText}>New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.primaryTextInputElement}
                        placeholder="Min 8 characters"
                      />
                    </div>
                    <div className={styles.inputFieldGroup}>
                      <label className={styles.fieldLabelText}>Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.primaryTextInputElement}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <div className={styles.actionFooter}>
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className={styles.saveActionSubmitBtn}
                      style={{ backgroundColor: "var(--color-danger, #dc2626)" }}
                    >
                      {isChangingPassword ? <FiLoader className={styles.loadingSpinnerAnimation} /> : <FiLock size={14} />}
                      <span>{isChangingPassword ? "Changing..." : "Update Password"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Vault Security Card */}
        <section className={styles.settingsCardNode}>
          <div className={styles.cardHeaderArea}>
            <div
              className={styles.iconIndicatorFrame}
              style={{
                color: "var(--color-success, #16a34a)",
                backgroundColor: "rgba(22, 163, 74, 0.08)",
                borderColor: "rgba(22, 163, 74, 0.2)",
              }}
            >
              <FiShield size={18} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Investment Vault Security</h2>
              <p className={styles.cardContextExplanation}>
                Protect your crypto and stock details by adding a secret 4‑digit password screen.
              </p>
            </div>
          </div>
          <div className={styles.cardBodyContent}>
            <div className={styles.placeholderControlRowFlexDeck}>
              <div className={styles.metaInformationLeftTextBlock}>
                <span className={styles.rowControlHeadline}>Password Screen Lock</span>
                <span className={styles.rowControlSecondaryExplanation}>
                  {isSecurityLoading
                    ? "Analyzing secure validation state tokens..."
                    : isVaultSecurityEnabled
                      ? "Your password lock is active. Your investments are safe and hidden behind a lock screen."
                      : "Your password lock is turned off. Anyone who opens this app can see your investments."}
                </span>
              </div>
              <div className={styles.vaultActionCluster}>
                {isVaultSecurityEnabled && !isSecurityLoading && (
                  <button
                    type="button"
                    onClick={handleChangePinClick}
                    className={styles.saveActionSubmitBtn}
                    style={{
                      backgroundColor: "var(--bg-surface, #ffffff)",
                      color: "var(--text-primary, #10043f)",
                      border: "1px solid var(--border-color, #e5e1f4)",
                    }}
                  >
                    Change PIN
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSecurityToggle}
                  disabled={isSecurityLoading}
                  className={styles.saveActionSubmitBtn}
                  style={{
                    backgroundColor: isVaultSecurityEnabled
                      ? "var(--color-danger, #dc2626)"
                      : "var(--color-success, #16a34a)",
                  }}
                >
                  {isSecurityLoading ? (
                    <FiLoader className={styles.loadingSpinnerAnimation} />
                  ) : isVaultSecurityEnabled ? (
                    "Turn Off Lock"
                  ) : (
                    "Turn On Lock"
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PIN Setup / Change Modal */}
      <PinSetupModal
        key={`pin-modal-${pinModalMode}-${isPinModalOpen}`}
        isOpen={isPinModalOpen}
        mode={pinModalMode}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSetupSuccess}
      />
    </div>
  );
}