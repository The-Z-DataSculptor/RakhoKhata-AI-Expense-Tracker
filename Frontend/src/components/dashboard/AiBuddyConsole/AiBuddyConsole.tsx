// src/components/dashboard/AiBuddyConsole/AiBuddyConsole.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiZap,
  FiLock,
  FiLoader,
  FiStar,
  FiSmile,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";
import { FaFire, FaUserSecret, FaCalculator } from "react-icons/fa6";
import { toast } from "sonner";
import { aiService } from "@/utils/api"; // no longer need UserProfile import
import styles from "./AiBuddyConsole.module.css";

interface AiBuddyConsoleProps {
  activeWorkspaceId: string | null;
}

type TimelineScope = "today" | "week" | "month";

interface GreetingUser {
  name: string;
  aiPersona: string;
}

interface LocalCachePayload {
  dateStamp: string;
  greetingText: string;
  greetingUser: GreetingUser;
  cooldownStates: Record<TimelineScope, boolean>;
}

export default function AiBuddyConsole({ activeWorkspaceId }: AiBuddyConsoleProps) {
  const [greetingUser, setGreetingUser] = useState<GreetingUser | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [fullTargetText, setFullTargetText] = useState("");
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);
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

  const getTodayDateString = useCallback(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const getDailyCallCount = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    try {
      const todayStr = getTodayDateString();
      const storedDate = localStorage.getItem("rakhokhata_call_date");
      if (storedDate !== todayStr) {
        localStorage.setItem("rakhokhata_call_date", todayStr);
        localStorage.setItem("rakhokhata_daily_calls", "0");
        return 0;
      }
      return parseInt(localStorage.getItem("rakhokhata_daily_calls") || "0", 10);
    } catch {
      return 0;
    }
  }, [getTodayDateString]);

  const incrementDailyCallCount = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    try {
      const updatedCount = getDailyCallCount() + 1;
      localStorage.setItem("rakhokhata_daily_calls", updatedCount.toString());
      setCallsUsedToday(updatedCount);
      return updatedCount;
    } catch {
      return 0;
    }
  }, [getDailyCallCount]);

  // Typewriter effect
  useEffect(() => {
    if (!fullTargetText) return;
    const cleanedText = fullTargetText
      .trim()
      .replace(/^["'“‘’”]+/g, "")
      .replace(/["'“‘’”]+$/g, "");
    let characterIndex = 0;
    const typewriterInterval = setInterval(() => {
      if (characterIndex === 0) setDisplayedText("");
      if (characterIndex < cleanedText.length) {
        setDisplayedText(cleanedText.slice(0, characterIndex + 1));
        characterIndex++;
      } else {
        clearInterval(typewriterInterval);
      }
    }, 18);
    return () => clearInterval(typewriterInterval);
  }, [fullTargetText]);

  // Fetch greeting via centralized aiService
  useEffect(() => {
    let isMounted = true;
    const fetchDailyGreeting = async () => {
      if (!activeWorkspaceId) {
        if (isMounted) setIsLoadingGreeting(false);
        return;
      }
      if (isMounted) setIsLoadingGreeting(true);

      const todayStr = getTodayDateString();
      const cacheKey = `rakhokhata_greeting_${activeWorkspaceId}`;
      let cachedPayload: string | null = null;
      try {
        cachedPayload = localStorage.getItem(cacheKey);
      } catch {
        cachedPayload = null;
      }
      if (isMounted) setCallsUsedToday(getDailyCallCount());

      if (cachedPayload) {
        try {
          const parsed: LocalCachePayload = JSON.parse(cachedPayload);
          if (parsed.dateStamp === todayStr && isMounted) {
            setGreetingUser(parsed.greetingUser || null);
            setFullTargetText(parsed.greetingText || "");
            setCooldowns(
              parsed.cooldownStates || {
                today: false,
                week: false,
                month: false,
              }
            );
            setIsLoadingGreeting(false);
            return;
          }
        } catch {
          try {
            localStorage.removeItem(cacheKey);
          } catch {}
        }
      }

      try {
        const result = await aiService.greeting(activeWorkspaceId);
        if (isMounted) {
          setGreetingUser(result.user || null);
          setFullTargetText(result.greeting || "");
          setCooldowns(
            result.cooldowns || { today: false, week: false, month: false }
          );

          const cacheData: LocalCachePayload = {
            dateStamp: todayStr,
            greetingText: result.greeting || "",
            greetingUser: result.user,
            cooldownStates:
              result.cooldowns || {
                today: false,
                week: false,
                month: false,
              },
          };
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          } catch {}
        }
      } catch (error: unknown) {
        console.error("Failed to generate contextual AI greeting:", error);
        if (isMounted)
          setFullTargetText(
            "Secure network link functional. Click a report scope below to process your ledger grids."
          );
      } finally {
        if (isMounted) setIsLoadingGreeting(false);
      }
    };

    fetchDailyGreeting();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, getDailyCallCount, getTodayDateString]);

  const handleTriggerAnalysis = async (scope: TimelineScope) => {
    if (cooldowns[scope] || isProcessingAnalysis) return;
    const currentCalls = getDailyCallCount();
    if (currentCalls >= 4) {
      toast.error(
        "You have reached your limit of 4 AI reports today. Please try again tomorrow!"
      );
      return;
    }
    setIsProcessingAnalysis(true);
    setFullTargetText(
      "Querying the database... pulling your category rules... checking budgets..."
    );
    try {
      const result = await aiService.executeAnalysis(scope, activeWorkspaceId!);
      setFullTargetText(
        result.analysisReport || "Analysis report generated."
      );
      const updatedCooldowns = { ...cooldowns, [scope]: true };
      setCooldowns(updatedCooldowns);
      const cacheKey = `rakhokhata_greeting_${activeWorkspaceId}`;
      try {
        const cachedPayload = localStorage.getItem(cacheKey);
        if (cachedPayload) {
          const parsed: LocalCachePayload = JSON.parse(cachedPayload);
          parsed.cooldownStates = updatedCooldowns;
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      } catch {}
      const newCount = incrementDailyCallCount();
      toast.success(
        `Analysis loaded successfully. (Daily Usage: ${newCount}/4)`
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Network error during compilation.";
      toast.error(message);
      setFullTargetText(
        "Could not load analysis. Please check your backend connection."
      );
    } finally {
      setIsProcessingAnalysis(false);
    }
  };

  const personaKey = greetingUser?.aiPersona || "supportive_coach";

  const getPersonaThemeClass = () => {
    if (personaKey === "savage_roaster") return styles.themeRoaster;
    if (personaKey === "forensic_detective") return styles.themeDetective;
    if (personaKey === "silent_accountant") return styles.themeAccountant;
    return styles.themeCoach;
  };

  const renderPersonaIcon = () => {
    if (personaKey === "savage_roaster")
      return <FaFire className={styles.companionBrandIcon} />;
    if (personaKey === "forensic_detective")
      return <FaUserSecret className={styles.companionBrandIcon} />;
    if (personaKey === "silent_accountant")
      return <FaCalculator className={styles.companionBrandIcon} />;
    return <FiSmile className={styles.companionBrandIcon} />;
  };

  const getPersonaColor = () => {
    if (personaKey === "savage_roaster") return "var(--color-danger)";
    if (personaKey === "forensic_detective") return "var(--color-info)";
    if (personaKey === "silent_accountant") return "var(--text-secondary)";
    return "var(--color-primary)";
  };

  const scopeConfig = {
    today: {
      icon: <FiZap />,
      label: "Today",
      pulseClass: styles.pulseFirstDelay,
    },
    week: {
      icon: <FiCalendar />,
      label: "Week",
      pulseClass: styles.pulseSecondDelay,
    },
    month: {
      icon: <FiTrendingUp />,
      label: "Month",
      pulseClass: styles.pulseThirdDelay,
    },
  };

  return (
    <div
      className={`${styles.terminalContainer} ${getPersonaThemeClass()}`}
      role="region"
      aria-label="AI Companion Console"
    >
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
                {greetingUser?.name
                  ? `${formatTitleCase(greetingUser.name)}'s Companion`
                  : "AI Companion Node"}
              </h4>
              <p>
                Persona:{" "}
                <span className={styles.highlightText}>
                  {personaKey.replace("_", " ")}
                </span>
              </p>
            </div>
          </div>
          <div className={styles.livePulseIndicator}>
            <span className={styles.greenPulseDot} />
            <span className={styles.pulseLabel}>
              {callsUsedToday >= 4
                ? "DAILY LIMIT REACHED"
                : `LIMIT: ${callsUsedToday}/4`}
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
            const isLocked = cooldowns[scope] || callsUsedToday >= 4;
            const activeScope = scopeConfig[scope];
            return (
              <button
                key={scope}
                type="button"
                onClick={() => handleTriggerAnalysis(scope)}
                disabled={
                  isLocked || isProcessingAnalysis || isLoadingGreeting
                }
                className={`${styles.timelineActionButton} ${
                  isLocked ? styles.buttonLockedState : ""
                } ${
                  scope === "today"
                    ? styles.scopeToday
                    : scope === "week"
                    ? styles.scopeWeek
                    : styles.scopeMonth
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
                      <span className={styles.scopeIconWrapper}>
                        {activeScope.icon}
                      </span>
                      <span className={styles.btnLabelCapital}>
                        {activeScope.label}
                      </span>
                      <FiZap
                        className={`${styles.btnIconActive} ${activeScope.pulseClass}`}
                      />
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