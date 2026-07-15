// src/components/dashboard/AiBuddyConsole/AiBuddyConsole.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { 
  FiZap, 
  FiLock, 
  FiLoader, 
  FiStar, 
  FiSmile, 
  FiCalendar, 
  FiTrendingUp 
} from "react-icons/fi";
import { 
  FaFire, 
  FaUserSecret, 
  FaCalculator 
} from "react-icons/fa6";
import { toast } from "sonner";
import styles from "./AiBuddyConsole.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface MetricsType {
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  flexibleExpenses: number;
  safeToSpend: number;
}

interface AiBuddyConsoleProps {
  metrics: MetricsType;
  activeWorkspaceId: string | null;
}

type TimelineScope = "today" | "week" | "month";
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function AiBuddyConsole({ metrics, activeWorkspaceId }: AiBuddyConsoleProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [fullTargetText, setFullTargetText] = useState("");
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);

  const [cooldowns, setCooldowns] = useState<Record<TimelineScope, boolean>>({
    today: false,
    week: false,
    month: false,
  });

  // AUTOMATIC TITLE CASE HELPER: Forces lowercase database initials to become big capitalized words automatically
  const formatTitleCase = (inputNameString: string): string => {
    if (!inputNameString) return "";
    return inputNameString
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Typewriter loop with string quote sanitization guards
  useEffect(() => {
    if (!fullTargetText) return;

    // 🚀 ULTRA-CLEAN CORRECTION REGEX PATCH: 
    // Strips out any loose leading/trailing spaces, raw newlines, or duplicate opening/closing quote markers 
    // delivered by the LLM container so it never collides with our hardcoded layout UI elements.
    const cleanedText = fullTargetText
      .trim()
      .replace(/^["'“‘’”]+/g, "") // Drops any duplicate starting quotations
      .replace(/["'“‘’”]+$/g, ""); // Drops any duplicate trailing quotations
      
    let characterIndex = 0;
    setDisplayedText("");

    const typewriterInterval = setInterval(() => {
      setDisplayedText((previousString) => previousString + cleanedText.charAt(characterIndex));
      characterIndex++;
      
      if (characterIndex >= cleanedText.length) {
        clearInterval(typewriterInterval);
      }
    }, 18);

    return () => clearInterval(typewriterInterval);
  }, [fullTargetText]);

  useEffect(() => {
    const fetchDailyGreeting = async () => {
      setIsLoadingGreeting(true);
      try {
        const response = await fetch("http://localhost:5000/api/ai/greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMetrics: metrics }),
          credentials: "include",
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setUserProfile(result.user);
        setFullTargetText(result.greeting);
        setCooldowns(result.cooldowns || { today: false, week: false, month: false });
      } catch (err: any) {
        console.error("Failed to generate contextual AI greeting:", err);
        setFullTargetText("Secure network link functional. Live workspace analytics engine is standing by. Choose a report scope below to process current ledger data rows.");
      } finally {
        setIsLoadingGreeting(false);
      }
    };

    fetchDailyGreeting();
  }, [activeWorkspaceId]);

  const handleTriggerAnalysis = async (scope: TimelineScope) => {
    if (cooldowns[scope] || isProcessingAnalysis) return;

    setIsProcessingAnalysis(true);
    setDisplayedText("");
    setFullTargetText("Synchronizing data nodes... extracting current transaction ledger logs... querying analytical variables...");

    try {
      const response = await fetch("http://localhost:5000/api/ai/execute-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          workspaceMetrics: metrics,
          workspaceId: activeWorkspaceId,
        }),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setFullTargetText(result.analysisReport);
      setCooldowns((prevCooldowns) => ({ ...prevCooldowns, [scope]: true }));
      toast.success(`Dynamic ${scope} statement processed and active.`);
    } catch (error: any) {
      toast.error("Network sync timeout occurred during analytical sweep.");
      setFullTargetText("Failed to safely stream financial analysis data rows. Check standard server console.");
    } finally {
      setIsProcessingAnalysis(false);
    }
  };

  const personaKey = userProfile?.aiPersona || "supportive_coach";

  const getPersonaThemeClass = () => {
    if (personaKey === "savage_roaster") return styles.themeRoaster;
    if (personaKey === "forensic_detective") return styles.themeDetective;
    if (personaKey === "silent_accountant") return styles.themeAccountant;
    return styles.themeCoach;
  };

  const renderPersonaIcon = () => {
    if (personaKey === "savage_roaster") return <FaFire className={styles.companionBrandIcon} />;
    if (personaKey === "forensic_detective") return <FaUserSecret className={styles.companionBrandIcon} />;
    if (personaKey === "silent_accountant") return <FaCalculator className={styles.companionBrandIcon} />;
    return <FiSmile className={styles.companionBrandIcon} />;
  };

  const getPersonaColor = () => {
    if (personaKey === "savage_roaster") return "var(--color-danger)";
    if (personaKey === "forensic_detective") return "var(--color-info)";
    if (personaKey === "silent_accountant") return "var(--text-secondary)";
    return "var(--color-primary)";
  };

  const scopeConfig = {
    today: { icon: <FiZap />, label: "Today", pulseClass: styles.pulseFirstDelay },
    week: { icon: <FiCalendar />, label: "Week", pulseClass: styles.pulseSecondDelay },
    month: { icon: <FiTrendingUp />, label: "Month", pulseClass: styles.pulseThirdDelay },
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER ===
     ========================================================================== */
  return (
    <div className={`${styles.terminalContainer} ${getPersonaThemeClass()}`}>
      <div className={styles.lensGlowOverlay} />
      <div className={styles.lensGlowOverlaySecondary} />

      <div className={styles.innerLayout}>
        <div className={styles.companionStatusRow}>
          <div className={styles.companionBadge}>
            <div
              className={styles.avatarBlob}
              style={{ borderColor: getPersonaColor(), boxShadow: `0 0 20px ${getPersonaColor()}33` }}
            >
              {renderPersonaIcon()}
            </div>
            <div className={styles.identityMeta}>
              <h4>
                <FiStar className={styles.sparkleIcon} />
                {userProfile?.name ? `${formatTitleCase(userProfile.name)}'s Companion` : "AI Companion Node"}
              </h4>
              <p>
                Persona: <span className={styles.highlightText}>{personaKey.replace("_", " ")}</span>
              </p>
            </div>
          </div>
          
          <div className={styles.livePulseIndicator}>
            <span className={styles.greenPulseDot} />
            <span className={styles.pulseLabel}>SYSTEM ALIVE</span>
            <span className={styles.pulseBars}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </span>
          </div>
        </div>

        <div className={styles.displayMonitorArea}>
          {isLoadingGreeting ? (
            <div className={styles.loaderState}>
              <FiLoader className={styles.spinnerIcon} />
              <p>Reticulating matrix lines... consulting companion brain...</p>
            </div>
          ) : (
            <p className={styles.streamedNarrationText}>
              <span className={styles.quoteMark}>“</span>
              {displayedText}
              <span className={styles.typingCaretCursor}>|</span>
              <span className={styles.quoteMark}>”</span>
            </p>
          )}
        </div>

        <footer className={styles.actionGridFooter}>
          {(["today", "week", "month"] as TimelineScope[]).map((scope) => {
            const isLocked = cooldowns[scope];
            const activeScope = scopeConfig[scope];

            return (
              <button
                key={scope}
                onClick={() => handleTriggerAnalysis(scope)}
                disabled={isLocked || isProcessingAnalysis || isLoadingGreeting}
                className={`${styles.timelineActionButton} ${isLocked ? styles.buttonLockedState : ""} ${
                  scope === "today" ? styles.scopeToday : scope === "week" ? styles.scopeWeek : scope === "month" ? styles.scopeMonth : ""
                }`}
              >
                <div className={styles.btnInnerFlex}>
                  {isLocked ? (
                    <>
                      <FiLock className={styles.btnIcon} />
                      <span className={styles.btnLabelCapital}>Locked</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.scopeIconWrapper}>{activeScope.icon}</span>
                      <span className={styles.btnLabelCapital}>{activeScope.label}</span>
                      <FiZap className={`${styles.btnIconActive} ${activeScope.pulseClass}`} />
                    </>
                  )}
                </div>
                {!isLocked && <div className={styles.btnGlow} />}
              </button>
            );
          })}
        </footer>
      </div>
    </div>
  );
}
/* === SECTION 4 END === */