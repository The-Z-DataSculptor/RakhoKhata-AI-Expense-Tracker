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
import { UserProfile } from "@/utils/api";
import styles from "./AiBuddyConsole.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface AiBuddyConsoleProps {
  activeWorkspaceId: string | null;
}

type TimelineScope = "today" | "week" | "month";
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function AiBuddyConsole({ activeWorkspaceId }: AiBuddyConsoleProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [fullTargetText, setFullTargetText] = useState("");
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);

  const [cooldowns, setCooldowns] = useState<Record<TimelineScope, boolean>>({
    today: false,
    week: false,
    month: false,
  });

  const formatTitleCase = (inputNameString: string): string => {
    if (!inputNameString) return "";
    return inputNameString
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Typewriter effect resetting safely without state cascading warnings
  useEffect(() => {
    if (!fullTargetText) return;

    const cleanedText = fullTargetText
      .trim()
      .replace(/^["'“‘’”]+/g, "")
      .replace(/["'“‘’”]+$/g, "");

    let characterIndex = 0;
    
    const typewriterInterval = setInterval(() => {
      if (characterIndex === 0) {
        setDisplayedText("");
      }

      if (characterIndex < cleanedText.length) {
        setDisplayedText((prev) => (characterIndex === 0 ? cleanedText.charAt(0) : prev + cleanedText.charAt(characterIndex)));
        characterIndex++;
      } else {
        clearInterval(typewriterInterval);
      }
    }, 18);

    return () => clearInterval(typewriterInterval);
  }, [fullTargetText]);

  // Fetch greeting on mount or workspace swap only — completely driven by backend calculations
  useEffect(() => {
    const fetchDailyGreeting = async () => {
      if (!activeWorkspaceId) return;
      setIsLoadingGreeting(true);
      try {
        const response = await fetch("http://localhost:5000/api/ai/greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 🚀 FIXED: Only ship the active workspace ID. Let backend fetch transactions/categories/budgets
          body: JSON.stringify({ workspaceId: activeWorkspaceId }),
          credentials: "include",
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setUserProfile(result.user);
        setFullTargetText(result.greeting);
        setCooldowns(result.cooldowns || { today: false, week: false, month: false });
      } catch (error: unknown) {
        console.error("Failed to generate contextual AI greeting:", error);
        setFullTargetText(
          "Secure network link functional. I'm looking over your logs. Click a report scope below to process your ledger grids."
        );
      } finally {
        setIsLoadingGreeting(false);
      }
    };

    fetchDailyGreeting();
  }, [activeWorkspaceId]);

  const handleTriggerAnalysis = async (scope: TimelineScope) => {
    if (cooldowns[scope] || isProcessingAnalysis) return;

    setIsProcessingAnalysis(true);
    setFullTargetText(
      "Querying the database... pulling your category rules... checking budgets..."
    );

    try {
      const response = await fetch("http://localhost:5000/api/ai/execute-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🚀 FIXED: Simple clean context delivery
        body: JSON.stringify({
          scope,
          workspaceId: activeWorkspaceId
        }),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setFullTargetText(result.analysisReport);
      setCooldowns((prev) => ({ ...prev, [scope]: true }));
      toast.success(`Dynamic ${scope} analysis compiled.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Network sync timeout during AI compilation.";
      toast.error(message);
      setFullTargetText(
        "Could not load analysis. Please check if your backend server is online."
      );
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
              style={{
                borderColor: getPersonaColor(),
                boxShadow: `0 0 20px ${getPersonaColor()}33`,
              }}
            >
              {renderPersonaIcon()}
            </div>
            <div className={styles.identityMeta}>
              <h4>
                <FiStar className={styles.sparkleIcon} />
                {userProfile?.name
                  ? `${formatTitleCase(userProfile.name)}'s Companion`
                  : "AI Companion Node"}
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
              <p>Looking over your ledger sheets...</p>
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
                  scope === "today"
                    ? styles.scopeToday
                    : scope === "week"
                    ? styles.scopeWeek
                    : scope === "month"
                    ? styles.scopeMonth
                    : ""
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