// Frontend/src/app/(dashboard)/dashboard/ai-insights/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FiSend,
  FiUser,
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCompass,
  FiActivity,
  FiHelpCircle,
} from "react-icons/fi";
import { FaFire, FaUserSecret, FaCalculator, FaBolt } from "react-icons/fa6";
import { toast } from "sonner";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { useUser } from "@/app/(dashboard)/context/UserContext";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { aiService, AiPersonaType } from "@/utils/api";
import styles from "./page.module.css";

interface ChatMessage {
  id: string;
  sender: "user" | "buddy";
  text: string;
  timestamp: string;
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AiInsightsPage() {
  const { user: globalUser } = useUser();
  const { activeWorkspaceId } = useWorkspace();
  const { currency } = useCurrency();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoadingGreeting, setIsLoadingGreeting] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRequestRef = useRef<number>(0);

  const personaKey: AiPersonaType =
    (globalUser?.aiPersona as AiPersonaType) || "supportive_coach";
  const userName = globalUser?.name || "Friend";

  // Use refs to read latest values in fallback without re-triggering greeting effects
  const userNameRef = useRef(userName);
  const currencyRef = useRef(currency);

  useEffect(() => {
    userNameRef.current = userName;
    currencyRef.current = currency;
  }, [userName, currency]);

  const formatTitleCase = (name: string): string => {
    if (!name) return "";
    return name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const getPersonaDetails = () => {
    switch (personaKey) {
      case "savage_roaster":
        return {
          title: "Savage Financial Critic",
          avatarIcon: <FaFire className={styles.personaAvatarIcon} />,
          badge: "ROAST ENGINE ACTIVE",
          statusText: "IMPULSE AUDIT LIVE",
          statusIcon: <FiActivity />,
          guideText: "Ask about impulse buys, weekend splurges, or where cash is leaking.",
          suggestions: [
            { label: "Top Burners", query: "Roast my biggest spending category this month." },
            { label: "Splurge Reality Check", query: "Can I realistically afford a big weekend purchase right now?" },
            { label: "Impulse Leaks", query: "Where did I waste money impulsively this past week?" },
          ],
          themeClass: styles.themeRoaster,
        };
      case "forensic_detective":
        return {
          title: "Forensic Ledger Auditor",
          avatarIcon: <FaUserSecret className={styles.personaAvatarIcon} />,
          badge: "DEEP AUDIT PROTOCOL",
          statusText: "LEAK DETECTION LIVE",
          statusIcon: <FiShield />,
          guideText: "Ask to uncover subtle recurring subscriptions, hidden fees, or category spikes.",
          suggestions: [
            { label: "Subscription Traps", query: "Find subtle recurring subscriptions and stealth expenses." },
            { label: "Category Anomaly", query: "Are there any abnormal category spikes compared to last month?" },
            { label: "Cash Velocity", query: "Audit my daily average spending velocity this cycle." },
          ],
          themeClass: styles.themeDetective,
        };
      case "silent_accountant":
        return {
          title: "Precision Strategist",
          avatarIcon: <FaCalculator className={styles.personaAvatarIcon} />,
          badge: "PRECISION PROTOCOL",
          statusText: "LIVE LEDGER SYNC",
          statusIcon: <FiShield />,
          guideText: "Ask for exact runway numbers, affordability simulations, or margin breakdowns.",
          suggestions: [
            { label: "Affordability Check", query: "Simulate a planned purchase against my current reserve balance." },
            { label: "Runway Calculation", query: "Calculate my exact burn rate and financial runway at this pace." },
            { label: "Category Breakdown", query: "Provide a sorted percentage breakdown of all spending." },
          ],
          themeClass: styles.themeAccountant,
        };
      default:
        return {
          title: "Growth Co-Pilot",
          avatarIcon: <FiCompass className={styles.personaAvatarIcon} />,
          badge: "MENTOR ENGINE ACTIVE",
          statusText: "GOAL TRACKING LIVE",
          statusIcon: <FiCompass />,
          guideText: "Ask for actionable expense cuts, goal completion forecasts, or pacing tips.",
          suggestions: [
            { label: "Target Forecast", query: "How close am I to hitting my financial goal at this rate?" },
            { label: "3 Actionable Cuts", query: "Give me 3 practical ways to optimize my cash flow this week." },
            { label: "Monthly Summary", query: "Summarize my overall financial health for this month." },
          ],
          themeClass: styles.themeCoach,
        };
    }
  };

  const persona = getPersonaDetails();

  // Load greeting ONLY when activeWorkspaceId changes, preserving conversation history
  useEffect(() => {
    let isMounted = true;

    const fetchInitialGreeting = async () => {
      if (!activeWorkspaceId) {
        if (isMounted) setIsLoadingGreeting(false);
        return;
      }

      setIsLoadingGreeting(true);

      try {
        const result = await aiService.greeting(activeWorkspaceId);
        if (isMounted && result?.greeting) {
          setMessages([
            {
              id: generateId("greeting"),
              sender: "buddy",
              text: result.greeting,
              timestamp: getFormattedTime(),
            },
          ]);
        }
      } catch {
        if (isMounted) {
          const fallbackText = `Hey ${formatTitleCase(userNameRef.current)}! Your command center is primed in ${currencyRef.current}. What financial move are we analyzing today?`;
          setMessages([
            {
              id: generateId("fallback-greeting"),
              sender: "buddy",
              text: fallbackText,
              timestamp: getFormattedTime(),
            },
          ]);
        }
      } finally {
        if (isMounted) setIsLoadingGreeting(false);
      }
    };

    void fetchInitialGreeting();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || inputValue).trim();
      if (!query || isSending || !activeWorkspaceId) return;

      const userMessage: ChatMessage = {
        id: generateId("chat-user"),
        sender: "user",
        text: query,
        timestamp: getFormattedTime(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsSending(true);

      const currentRequestId = ++activeRequestRef.current;

      try {
        const res = await aiService.ask(query, personaKey, activeWorkspaceId);

        if (currentRequestId === activeRequestRef.current && res?.response) {
          const buddyMessage: ChatMessage = {
            id: generateId("chat-buddy"),
            sender: "buddy",
            text: res.response,
            timestamp: getFormattedTime(),
          };
          setMessages((prev) => [...prev, buddyMessage]);
        }
      } catch (err: unknown) {
        if (currentRequestId === activeRequestRef.current) {
          const msg =
            err instanceof Error ? err.message : "Failed to compile financial insight.";
          toast.error(msg);
          setMessages((prev) => [
            ...prev,
            {
              id: generateId("chat-error"),
              sender: "buddy",
              text: "Signal glitch while querying the ledger engine. Please resend your prompt.",
              timestamp: getFormattedTime(),
            },
          ]);
        }
      } finally {
        if (currentRequestId === activeRequestRef.current) {
          setIsSending(false);
        }
      }
    },
    [inputValue, isSending, activeWorkspaceId, personaKey]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className={`${styles.pageContainer} ${persona.themeClass}`}>
      <div className={styles.ambientAuraTop} />
      <div className={styles.ambientAuraBottom} />

      <header className={styles.heroDeckContainer}>
        <div className={styles.heroGlowBanner} />

        <div className={styles.heroDeckContent}>
          <div className={styles.avatarShowcaseArea}>
            <div className={styles.avatarAuraHalo} />
            <div className={styles.avatarMainBlob}>
              {persona.avatarIcon}
            </div>
          </div>

          <div className={styles.identityMetaDeck}>
            <div className={styles.heroTagRow}>
              <span className={styles.showmanBadge}>{persona.badge}</span>
              <div className={styles.liveMatrixIndicator}>
                <span className={styles.pulsePing} />
                <span className={styles.liveMatrixText}>{persona.statusText}</span>
              </div>
            </div>

            <h1 className={styles.heroMainTitle}>
              {formatTitleCase(userName)}’s <span className={styles.gradientTitleText}>{persona.title}</span>
            </h1>

            <div className={styles.guideBlock}>
              <FiHelpCircle className={styles.guideIcon} />
              <p className={styles.guideText}>{persona.guideText}</p>
            </div>
          </div>

          <div className={styles.hudStatCapsules}>
            {globalUser?.financialGoal && (
              <div className={styles.statCapsule}>
                <div className={styles.capsuleIconBox}>
                  <FiTarget />
                </div>
                <div className={styles.capsuleText}>
                  <span className={styles.capsuleLabel}>Target Quest</span>
                  <strong>{globalUser.financialGoal.replace("_", " ")}</strong>
                </div>
              </div>
            )}
            <div className={styles.statCapsule}>
              <div className={styles.capsuleIconBox}>
                <FiTrendingUp />
              </div>
              <div className={styles.capsuleText}>
                <span className={styles.capsuleLabel}>Ledger Unit</span>
                <strong>{currency} System</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.chatChamberContainer} aria-label="AI Buddy Conversation">
        <div className={styles.messagesViewport}>
          {isLoadingGreeting ? (
            <div className={styles.loaderStateArea}>
              <div className={styles.loadingSpinnerRing}>
                <FaBolt className={styles.sparkBolt} />
              </div>
              <p>Calibrating companion persona and compiling transactions...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.dialogueRow} ${
                  msg.sender === "user" ? styles.dialogueUser : styles.dialogueBuddy
                }`}
              >
                {msg.sender === "buddy" && (
                  <div className={styles.companionBubbleAvatar}>
                    {persona.avatarIcon}
                  </div>
                )}

                <div
                  className={`${styles.dialogueGlassCard} ${
                    msg.sender === "user"
                      ? styles.glassCardUser
                      : styles.glassCardBuddy
                  }`}
                >
                  <p className={styles.dialogueText}>{msg.text}</p>
                  <span className={styles.dialogueTimestamp}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className={styles.userBubbleAvatar}>
                    <FiUser />
                  </div>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className={`${styles.dialogueRow} ${styles.dialogueBuddy}`}>
              <div className={styles.companionBubbleAvatar}>
                {persona.avatarIcon}
              </div>
              <div className={`${styles.dialogueGlassCard} ${styles.glassCardBuddy}`}>
                <div className={styles.cyberTypingBeats}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className={styles.promptLaunchpad}>
          <div className={styles.launchpadHeader}>
            <FiZap className={styles.launchpadZapIcon} />
            <span>Power Queries:</span>
          </div>
          <div className={styles.launchpadChipsDeck}>
            {persona.suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.powerChipBtn}
                onClick={() => handleSendMessage(item.query)}
                disabled={isSending || isLoadingGreeting}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className={styles.composerConsoleBar}>
          <div className={styles.composerInnerShell}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Deploy a question to your ${persona.title}...`}
              disabled={isSending || isLoadingGreeting}
              maxLength={500}
              className={styles.composerNativeInput}
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim() || isLoadingGreeting}
              className={styles.launchActionButton}
              aria-label="Send query"
            >
              <span>{isSending ? "Synthesizing..." : "Ask Buddy"}</span>
              <FiSend className={styles.sendIcon} />
            </button>
          </div>
        </form>
      </main>

      <footer className={styles.footerWrap}>
        <DashboardFooter />
      </footer>
    </div>
  );
}