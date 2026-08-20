/* src/components/marketing/features/ai-financial-companion/FeaturePreview.tsx */

"use client";

import React, { useState } from "react";
import {
  FiSend,
  FiUser,
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiHelpCircle,
  FiCompass,
} from "react-icons/fi";
import { FaFire, FaUserSecret, FaCalculator } from "react-icons/fa6";
import styles from "./FeaturePreview.module.css";

export interface FeaturePreviewProps {
  id?: string;
  headline?: string;
  subheadline?: string;
}

interface PersonaOption {
  id: string;
  title: string;
  roleName: string;
  icon: React.ReactNode;
  badge: string;
  themeClass: string;
  guideText: string;
  initialGreeting: string;
  sampleReplies: Record<string, string>;
  suggestions: { label: string; query: string }[];
}

const PERSONAS: PersonaOption[] = [
  {
    id: "savage_roaster",
    title: "Savage Financial Critic",
    roleName: "Financial Critic",
    icon: <FaFire />,
    badge: "ROAST ENGINE ACTIVE",
    themeClass: styles.themeRoaster,
    guideText: "Ask about impulse buys, weekend splurges, or where cash is leaking.",
    initialGreeting:
      "Looking at your coffee and takeout spending this week, your wallet is begging for mercy. What financial disaster are we auditing today?",
    suggestions: [
      { label: "Top Burners", query: "Roast my biggest spending category this month." },
      { label: "Splurge Reality Check", query: "Can I realistically afford a weekend getaway right now?" },
      { label: "Impulse Leaks", query: "Where did I waste money impulsively this past week?" },
    ],
    sampleReplies: {
      "Roast my biggest spending category this month.":
        "You dropped $420 on Dining & Takeout alone—that's 38% of your monthly cash flow. You're practically funding your local cafe's retirement fund.",
      "Can I realistically afford a weekend getaway right now?":
        "With only $210 in safe-to-spend buffer left and rent due in 9 days? Absolutely not unless your weekend plan is camping in the backyard.",
      "Where did I waste money impulsively this past week?":
        "3 separate food deliveries between midnight and 2 AM totaling $86. Your midnight cravings have their own dedicated budget tier.",
    },
  },
  {
    id: "supportive_coach",
    title: "Growth Co-Pilot",
    roleName: "Growth Co-Pilot",
    icon: <FiCompass />,
    badge: "MENTOR ENGINE ACTIVE",
    themeClass: styles.themeCoach,
    guideText: "Ask for actionable expense cuts, goal completion forecasts, or pacing tips.",
    initialGreeting:
      "Hey! You've stayed comfortably under budget on Utilities this month. Ready to build on this momentum and hit your savings goal?",
    suggestions: [
      { label: "Target Forecast", query: "How close am I to hitting my savings goal this month?" },
      { label: "3 Actionable Cuts", query: "Give me 3 practical ways to optimize cash flow this week." },
      { label: "Monthly Summary", query: "Summarize my overall financial health this cycle." },
    ],
    sampleReplies: {
      "How close am I to hitting my savings goal this month?":
        "You're already at 74% of your emergency fund target! At your current daily pace of $22 spent, you'll reach 100% in just 11 days.",
      "Give me 3 practical ways to optimize cash flow this week.":
        "1. Batch-cook lunch for 3 days ($45 saved).\n2. Pause unused streaming trials ($18 saved).\n3. Keep your flexible grocery runs capped under $80.",
      "Summarize my overall financial health this cycle.":
        "Net savings are strong at +$680 (28% savings rate). Fixed bills are 100% paid and your safe-to-spend allowance is pacing on target.",
    },
  },
  {
    id: "forensic_detective",
    title: "Forensic Ledger Auditor",
    roleName: "Ledger Auditor",
    icon: <FaUserSecret />,
    badge: "DEEP AUDIT PROTOCOL",
    themeClass: styles.themeDetective,
    guideText: "Ask to uncover recurring subscriptions, hidden fees, or category spikes.",
    initialGreeting:
      "Telemetry sync complete. I've detected 2 recurring software charges and an abnormal 34% velocity spike in Entertainment. Where should we dig in?",
    suggestions: [
      { label: "Subscription Traps", query: "Find subtle recurring subscriptions and stealth expenses." },
      { label: "Category Anomaly", query: "Are there any abnormal category spikes compared to last month?" },
      { label: "Cash Velocity", query: "Audit my daily average spending velocity this cycle." },
    ],
    sampleReplies: {
      "Find subtle recurring subscriptions and stealth expenses.":
        "Flagged: Cloud Storage ($9.99/mo on the 4th), Streaming HD ($14.99/mo on the 12th), and Gym App ($19.00/mo). Total recurring leak: $43.98/mo.",
      "Are there any abnormal category spikes compared to last month?":
        "Anomaly detected: Entertainment increased from $85 to $210 (+147% deviation) driven primarily by two ticket purchases on Aug 14.",
      "Audit my daily average spending velocity this cycle.":
        "Your current burn rate is $34.50/day versus an optimal threshold of $26.00/day to maintain your end-of-month liquidity reserve.",
    },
  },
  {
    id: "silent_accountant",
    title: "Precision Strategist",
    roleName: "Precision Strategist",
    icon: <FaCalculator />,
    badge: "PRECISION PROTOCOL",
    themeClass: styles.themeAccountant,
    guideText: "Ask for exact runway numbers, affordability simulations, or margin breakdowns.",
    initialGreeting:
      "Ledger verified. Current cash balance: $4,850.00. Monthly fixed liabilities: $1,420.00. Safe-to-spend reserve: $930.00. State your query.",
    suggestions: [
      { label: "Affordability Check", query: "Simulate a $350 purchase against current reserve balances." },
      { label: "Runway Calculation", query: "Calculate my exact financial runway at zero new income." },
      { label: "Category Breakdown", query: "Provide a sorted percentage breakdown of all spending." },
    ],
    sampleReplies: {
      "Simulate a $350 purchase against current reserve balances.":
        "Purchase deduction: $350.00. Remaining safe allowance: $580.00. Budget margin decreases to 14.2%. Status: Feasible with low cash-flow risk.",
      "Calculate my exact financial runway at zero new income.":
        "Total liquid capital: $4,850.00. Average monthly burn: $1,940.00. Estimated financial runway: 2.5 months (75 days) before capital depletion.",
      "Provide a sorted percentage breakdown of all spending.":
        "1. Housing: 42.1% ($850)\n2. Groceries: 21.8% ($440)\n3. Transport: 14.3% ($290)\n4. Discretionary: 21.8% ($440)\nTotal spent: $2,020.00.",
    },
  },
];

export default function FeaturePreview({
  id = "preview",
  headline = "Interactive AI Companion Simulator",
  subheadline = "Switch between the 4 persona cards below and test prompt chips to see how tone, insights, and suggestions adapt in real time.",
}: FeaturePreviewProps) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaOption>(PERSONAS[0]);
  const [chatMessages, setChatMessages] = useState<
    { sender: "user" | "buddy"; text: string; time: string }[]
  >([
    {
      sender: "buddy",
      text: PERSONAS[0].initialGreeting,
      time: "10:42 AM",
    },
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");

  const handleSelectPersona = (p: PersonaOption) => {
    if (p.id === selectedPersona.id) return;
    setSelectedPersona(p);
    setChatMessages([
      {
        sender: "buddy",
        text: p.initialGreeting,
        time: "10:42 AM",
      },
    ]);
  };

  const handleSendPrompt = (query: string) => {
    if (!query.trim() || isTyping) return;

    const userMsg = { sender: "user" as const, text: query, time: "10:43 AM" };
    setChatMessages((prev) => [...prev, userMsg]);
    setCustomInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply =
        selectedPersona.sampleReplies[query] ||
        `Based on your current workspace metrics, your ${selectedPersona.roleName} recommends allocating funds carefully to stay within target limits.`;

      setChatMessages((prev) => [
        ...prev,
        { sender: "buddy" as const, text: reply, time: "10:43 AM" },
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <section id={id} className={styles.previewSection} aria-label="Interactive AI Companion Simulator">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <div className={styles.interactiveIndicator}>
            <FiZap className={styles.zapIcon} size={15} />
            <span>Context-Aware Intelligence Demo</span>
          </div>
          <h2 className={styles.previewTitle}>{headline}</h2>
          <p className={styles.previewSubtitle}>{subheadline}</p>
        </div>

        {/* 4 PERSONA SWITCHER CARDS */}
        <div className={styles.personaCardsGrid}>
          {PERSONAS.map((p) => {
            const isActive = selectedPersona.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.personaSelectCard} ${isActive ? styles.personaSelectCardActive : ""}`}
                onClick={() => handleSelectPersona(p)}
              >
                <div className={styles.personaCardIcon}>{p.icon}</div>
                <div className={styles.personaCardText}>
                  <h3 className={styles.personaCardTitle}>{p.title}</h3>
                  <span className={styles.personaCardBadge}>{p.badge}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* CHAT CONSOLE MOCKUP */}
        <div className={`${styles.mockupFrame} ${selectedPersona.themeClass}`}>
          {/* WINDOW TOP BAR */}
          <div className={styles.windowTopBar}>
            <div className={styles.windowControls}>
              <span className={`${styles.circleDot} ${styles.dotRed}`} />
              <span className={`${styles.circleDot} ${styles.dotYellow}`} />
              <span className={`${styles.circleDot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.windowUrlField}>
              app.rakhokhata.com/dashboard/ai-insights • Active: <strong>{selectedPersona.title}</strong>
            </div>
          </div>

          {/* HERO DECK */}
          <div className={styles.heroDeckContainer}>
            <div className={styles.heroDeckContent}>
              <div className={styles.avatarShowcaseArea}>
                <div className={styles.avatarMainBlob}>{selectedPersona.icon}</div>
              </div>

              <div className={styles.identityMetaDeck}>
                <div className={styles.heroTagRow}>
                  <span className={styles.showmanBadge}>{selectedPersona.badge}</span>
                  <div className={styles.liveMatrixIndicator}>
                    <span className={styles.pulsePing} />
                    <span>LEDGER TELEMETRY SYNCED</span>
                  </div>
                </div>
                <h4 className={styles.heroMainTitle}>
                  Your <span className={styles.gradientTitleText}>{selectedPersona.title}</span>
                </h4>
                <div className={styles.guideBlock}>
                  <FiHelpCircle className={styles.guideIcon} />
                  <p className={styles.guideText}>{selectedPersona.guideText}</p>
                </div>
              </div>

              <div className={styles.hudStatCapsules}>
                <div className={styles.statCapsule}>
                  <FiTarget className={styles.capsuleIcon} />
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Target Goal</span>
                    <strong>The Wealth Builder</strong>
                  </div>
                </div>
                <div className={styles.statCapsule}>
                  <FiTrendingUp className={styles.capsuleIcon} />
                  <div className={styles.capsuleText}>
                    <span className={styles.capsuleLabel}>Safe to Spend</span>
                    <strong>$930.00 Buffer</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CHAT CHAMBER */}
          <div className={styles.chatChamberContainer}>
            <div className={styles.messagesViewport}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.dialogueRow} ${
                    msg.sender === "user" ? styles.dialogueUser : styles.dialogueBuddy
                  }`}
                >
                  {msg.sender === "buddy" && (
                    <div className={styles.companionBubbleAvatar}>
                      {selectedPersona.icon}
                    </div>
                  )}

                  <div
                    className={`${styles.dialogueGlassCard} ${
                      msg.sender === "user" ? styles.glassCardUser : styles.glassCardBuddy
                    }`}
                  >
                    <p className={styles.dialogueText}>{msg.text}</p>
                    <span className={styles.dialogueTimestamp}>{msg.time}</span>
                  </div>

                  {msg.sender === "user" && (
                    <div className={styles.userBubbleAvatar}>
                      <FiUser />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className={`${styles.dialogueRow} ${styles.dialogueBuddy}`}>
                  <div className={styles.companionBubbleAvatar}>
                    {selectedPersona.icon}
                  </div>
                  <div className={`${styles.dialogueGlassCard} ${styles.glassCardBuddy}`}>
                    <div className={styles.cyberTypingBeats}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PROMPT LAUNCHPAD CHIPS */}
            <div className={styles.promptLaunchpad}>
              <div className={styles.launchpadHeader}>
                <FiZap className={styles.launchpadZapIcon} />
                <span>Test Power Queries:</span>
              </div>
              <div className={styles.launchpadChipsDeck}>
                {selectedPersona.suggestions.map((item, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    className={styles.powerChipBtn}
                    onClick={() => handleSendPrompt(item.query)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* COMPOSER FORM */}
            <form
              className={styles.composerConsoleBar}
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(customInput);
              }}
            >
              <div className={styles.composerInnerShell}>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={`Ask your ${selectedPersona.roleName} a custom question...`}
                  className={styles.composerNativeInput}
                />
                <button
                  type="submit"
                  disabled={!customInput.trim() || isTyping}
                  className={styles.launchActionButton}
                >
                  <span>Ask Buddy</span>
                  <FiSend size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}