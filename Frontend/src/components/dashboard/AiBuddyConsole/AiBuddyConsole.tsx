// src/components/dashboard/AiBuddyConsole/AiBuddyConsole.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useCallback } from "react";
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

interface LocalCachePayload {
  dateStamp: string;
  greetingText: string;
  userProfile: UserProfile;
  cooldownStates: Record<TimelineScope, boolean>;
}
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
  
  // Track remaining daily calls for visual notifications
  const [callsUsedToday, setCallsUsedToday] = useState<number>(0);

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

  // Safe Date Marker string helper (e.g., "2026-07-17")
  const getTodayDateString = useCallback((): string => {
    return new Date().toISOString().split("T")[0];
  }, []);

  /* ==========================================
     === LOCAL STORAGE TRACKING SHIELDS ===
     ========================================== */

  // Helper: Reads and cleans call limits to reset on date changes
  const getDailyCallCount = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    const todayStr = getTodayDateString();
    const storedDate = localStorage.getItem("rakhokhata_call_date");
    
    if (storedDate !== todayStr) {
      localStorage.setItem("rakhokhata_call_date", todayStr);
      localStorage.setItem("rakhokhata_daily_calls", "0");
      return 0;
    }
    
    return parseInt(localStorage.getItem("rakhokhata_daily_calls") || "0", 10);
  }, [getTodayDateString]);

  // Helper: Increments call usage safely
  const incrementDailyCallCount = useCallback((): number => {
    const updatedCount = getDailyCallCount() + 1;
    localStorage.setItem("rakhokhata_daily_calls", updatedCount.toString());
    setCallsUsedToday(updatedCount);
    return updatedCount;
  }, [getDailyCallCount]);

  // 🚀 FIXED: No cascading synchronous renders. 
  // We reset the display dynamically inside the async callback so React processes it beautifully.
  useEffect(() => {
    if (!fullTargetText) return;

    const cleanedText = fullTargetText
      .trim()
      .replace(/^["'“‘’”]+/g, "")
      .replace(/["'“‘’”]+$/g, "");

    let characterIndex = 0;
    
    const typewriterInterval = setInterval(() => {
      if (characterIndex === 0) {
        setDisplayedText(""); // Clear previous text asynchronously inside the interval tick
      }

      if (characterIndex < cleanedText.length) {
        setDisplayedText(cleanedText.slice(0, characterIndex + 1));
        characterIndex++;
      } else {
        clearInterval(typewriterInterval);
      }
    }, 18);

    return () => clearInterval(typewriterInterval);
  }, [fullTargetText]);

  // Fetch or Load Cached Greeting
  useEffect(() => {
    const fetchDailyGreeting = async () => {
      if (!activeWorkspaceId) return;
      setIsLoadingGreeting(true);

      const todayStr = getTodayDateString();
      const cacheKey = `rakhokhata_greeting_${activeWorkspaceId}`;
      const cachedPayload = localStorage.getItem(cacheKey);

      // Initialize Call Limits for state readouts
      setCallsUsedToday(getDailyCallCount());

      if (cachedPayload) {
        try {
          const parsed: LocalCachePayload = JSON.parse(cachedPayload);
          // If greeting matches today's date, serve from cache immediately
          if (parsed.dateStamp === todayStr) {
            setUserProfile(parsed.userProfile);
            setFullTargetText(parsed.greetingText);
            setCooldowns(parsed.cooldownStates);
            setIsLoadingGreeting(false);
            return;
          }
        } catch {
          console.warn("Clearing corrupt local cache object.");
          localStorage.removeItem(cacheKey);
        }
      }

      // Cache miss: execute secure database-driven greeting fetch
      try {
        const response = await fetch("http://localhost:5000/api/ai/greeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: activeWorkspaceId }),
          credentials: "include",
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setUserProfile(result.user);
        setFullTargetText(result.greeting);
        setCooldowns(result.cooldowns || { today: false, week: false, month: false });

        // Save result payload to prevent refresh loops
        const cacheData: LocalCachePayload = {
          dateStamp: todayStr,
          greetingText: result.greeting,
          userProfile: result.user,
          cooldownStates: result.cooldowns || { today: false, week: false, month: false }
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));

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
  }, [activeWorkspaceId, getDailyCallCount, getTodayDateString]);

  const handleTriggerAnalysis = async (scope: TimelineScope) => {
    if (cooldowns[scope] || isProcessingAnalysis) return;

    // Check Daily Shield
    const currentCalls = getDailyCallCount();
    if (currentCalls >= 4) {
      toast.error("You have reached your limit of 4 AI reports today. Please try again tomorrow!");
      return;
    }

    setIsProcessingAnalysis(true);
    setFullTargetText(
      "Querying the database... pulling your category rules... checking budgets..."
    );

    try {
      const response = await fetch("http://localhost:5000/api/ai/execute-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          workspaceId: activeWorkspaceId
        }),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setFullTargetText(result.analysisReport);
      
      // Update Cooldown State
      const updatedCooldowns = { ...cooldowns, [scope]: true };
      setCooldowns(updatedCooldowns);

      // Cache updated cooldown configurations immediately
      const cacheKey = `rakhokhata_greeting_${activeWorkspaceId}`;
      const cachedPayload = localStorage.getItem(cacheKey);
      if (cachedPayload) {
        try {
          const parsed: LocalCachePayload = JSON.parse(cachedPayload);
          parsed.cooldownStates = updatedCooldowns;
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        } catch {
          // Fail silently on cache write issue
        }
      }

      // Secure Daily Limit count increment
      const newCount = incrementDailyCallCount();
      toast.success(`Analysis loaded successfully. (Daily Usage: ${newCount}/4)`);

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
            <span className={styles.pulseLabel}>
              {callsUsedToday >= 4 ? "DAILY LIMIT REACHED" : `LIMIT: ${callsUsedToday}/4`}
            </span>
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
            const isLocked = cooldowns[scope] || (callsUsedToday >= 4);
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
                      <span className={styles.btnLabelCapital}>
                        {callsUsedToday >= 4 ? "Max Limit" : "Locked"}
                      </span>
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