// src/components/marketing/FeatureCommandCenter.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA STRUCTURES ===
   ========================================================================== */
import React, { useState, useEffect, useRef } from "react";
import styles from "./FeatureCommandCenter.module.css";

const FEATURES = [
  {
    id: "workspaces",
    label: "💼 Dual Workspaces",
    title: "Separate Business from Personal",
    desc: "Switch between personal and business expenses with one click. Perfect for freelancers.",
  },
  {
    id: "voice",
    label: "🎙️ Voice Logging",
    title: "Hands-Free Entry",
    desc: "Just speak your expense. The app extracts amount and category automatically.",
  },
  {
    id: "reminders",
    label: "✉️ Smart Reminders",
    title: "Never Miss a Payment",
    desc: "Automated reminders for bills and shared expenses.",
  },
  {
    id: "currency",
    label: "🌍 Multi-Currency",
    title: "Travel Without Worry",
    desc: "Log expenses in any currency. Auto-converts to your home currency.",
  },
  {
    id: "sharing",
    label: "🔗 Share Links",
    title: "Share Securely",
    desc: "Generate temporary links for roommates or partners to view shared expenses.",
  },
] as const;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN COMPONENT & STATE MECHANICS ===
   ========================================================================== */
export default function FeatureCommandCenter() {
  const [activeId, setActiveId] = useState<string>("workspaces");
  const [workspaceMode, setWorkspaceMode] = useState<"private" | "business">("private");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>("");

  // WHY THIS FIX WAS MADE: Tracks async timer handles using refs to ensure all scheduled timers 
  // are cleanly cleared on component unmount or tab switches, preventing state leaks.
  const timerHandleRef = useRef<NodeJS.Timeout | null>(null);
  const secondaryTimerHandleRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerHandleRef.current) clearTimeout(timerHandleRef.current);
    if (secondaryTimerHandleRef.current) clearTimeout(secondaryTimerHandleRef.current);
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const activeFeature = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  const handleVoiceClick = () => {
    if (isRecording) return;
    clearTimers();
    setIsRecording(true);
    setVoiceText("");

    timerHandleRef.current = setTimeout(() => {
      setVoiceText("Coffee $4.50 at Starbucks");
      secondaryTimerHandleRef.current = setTimeout(() => {
        setIsRecording(false);
      }, 1500);
    }, 1500);
  };

  const handleTabSwitch = (featureId: string) => {
    clearTimers();
    setActiveId(featureId);
    if (featureId === "voice") {
      setIsRecording(false);
      setVoiceText("");
    }
  };
  /* === SECTION 2 END === */

  /* ==========================================================================
     === SECTION 3: RENDER HELPERS ===
     ========================================================================== */
  const renderControls = () => {
    if (activeId === "workspaces") {
      return (
        <div className={styles.interactiveActionArea}>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleButton} ${workspaceMode === "private" ? styles.toggleActive : ""}`}
              onClick={() => setWorkspaceMode("private")}
            >
              🏡 Private Mode
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${workspaceMode === "business" ? styles.toggleActive : ""}`}
              onClick={() => setWorkspaceMode("business")}
            >
              👔 Business Mode
            </button>
          </div>
        </div>
      );
    }

    if (activeId === "voice") {
      return (
        <div className={styles.interactiveActionArea}>
          <button
            type="button"
            className={`${styles.actionButton} ${isRecording ? styles.actionButtonActive : ""}`}
            onClick={handleVoiceClick}
            disabled={isRecording}
          >
            {isRecording ? (
              <>
                <span className={styles.pulseDot} aria-hidden="true"></span>
                Listening Pulse...
              </>
            ) : (
              "🎙️ Trigger Voice Capture"
            )}
          </button>
        </div>
      );
    }

    return (
      <div className={styles.interactiveActionArea}>
        <div className={styles.automatedStatusBanner}>
          ⚡ Engine Pipeline Active
        </div>
      </div>
    );
  };

  const renderPhoneContent = () => {
    if (activeId === "workspaces") {
      return (
        <div className={styles.animateFade}>
          <div className={styles.balanceCard}>
            <div className={styles.cardLabel}>Monthly Aggregation</div>
            <div className={styles.cardValue}>
              {workspaceMode === "private" ? "$1,420.00" : "$8,645.00"}
            </div>
          </div>
          <div className={styles.logListStack}>
            <div className={styles.miniLogLine}>
              <span>⚡ Electricity Bill</span>
              <strong>$145.00</strong>
            </div>
            <div className={styles.miniLogLine}>
              <span>⛽ Transport Fuel</span>
              <strong>$55.00</strong>
            </div>
            <div className={styles.miniLogLine}>
              <span>🛒 Inventory Sourcing</span>
              <strong>$112.00</strong>
            </div>
          </div>
        </div>
      );
    }

    if (activeId === "voice") {
      return (
        <div className={styles.animateFade}>
          <div className={styles.voiceAssistantCard}>
            {!voiceText && !isRecording && (
              <p className={styles.voicePlaceholderText}>
                Click the prompt controller to fire real-time transcription modeling
              </p>
            )}
            {isRecording && (
              <div className={styles.audioWaveContainer}>
                <div className={styles.waveBar}></div>
                <div className={styles.waveBar}></div>
                <div className={styles.waveBar}></div>
                <p className={styles.voicePlaceholderText}>Processing audio waves...</p>
              </div>
            )}
            {voiceText && !isRecording && (
              <div className={styles.speechOutputContainer}>
                <div className={styles.liveSpeechBubble}>&quot;{voiceText}&quot;</div>
                <div className={styles.successBanner}>✓ Parsed into database ledger</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeId === "reminders") {
      return (
        <div className={`${styles.animateFade} ${styles.reminderList}`}>
          <div className={styles.reminderStepRow}>
            <div className={styles.reminderDotMarker}>01</div>
            <div className={styles.reminderStepBody}>
              <strong>Day 1: Friendly Soft Notice</strong>
              <p>Automated invoice ping dispatched to client mailbox.</p>
            </div>
          </div>
          <div className={styles.reminderStepRow}>
            <div className={styles.reminderDotMarker}>05</div>
            <div className={styles.reminderStepBody}>
              <strong>Day 5: Formal Ledger Warning</strong>
              <p>Past grace threshold notice compiled securely.</p>
            </div>
          </div>
          <div className={styles.reminderStepRow}>
            <div className={styles.reminderDotMarker}>10</div>
            <div className={styles.reminderStepBody}>
              <strong className={styles.dangerLabel}>Day 10: Strict Escalation</strong>
              <p>Final transactional warnings issued via email relays.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeId === "currency") {
      return (
        <div className={`${styles.animateFade} ${styles.currencyCalculatorBox}`}>
          <div className={styles.currencyValueRow}>
            <span className={styles.currencyMeta}>🇪🇺 Base EUR Expense</span>
            <strong className={styles.currencyValue}>€85.00</strong>
          </div>
          <div className={styles.conversionArrowVector}>
            <span className={styles.vectorLine}></span>
            <span className={styles.vectorText}>Matrix Conversion Layer</span>
            <span className={styles.vectorLine}></span>
          </div>
          <div className={styles.currencyValueRow}>
            <span className={styles.currencyMeta}>🇺🇸 Target Domestic Base</span>
            <strong className={styles.currencyValueTarget}>$91.80 USD</strong>
          </div>
        </div>
      );
    }

    if (activeId === "sharing") {
      return (
        <div className={`${styles.animateFade} ${styles.sharingInterface}`}>
          <div className={styles.secureLinkCopyInput}>
            <span>khata.com/share/snapshot_7x9f2k</span>
          </div>
          <div className={styles.configToggleLine}>
            <span>Read-Only Privileges</span>
            <strong className={styles.textSuccessGreen}>Enabled</strong>
          </div>
          <div className={styles.configToggleLine}>
            <span>Enforce Authentication</span>
            <span className={styles.textMutedLabel}>Active</span>
          </div>
        </div>
      );
    }

    return null;
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: MAIN JSX RENDER LAYOUT ===
     ========================================================================== */
  return (
    <section id="features" className={styles.commandSection} aria-label="Capabilities Command Center">
      
      <div className={styles.sectionHeader}>
        <div className={styles.sectionBadge}>System Orchestration</div>
        <h2 className={styles.sectionHeading}>Platform Capabilities Hub</h2>
        <p className={styles.sectionSubtext}>
          Interact with our dynamic feature architecture directly from the central telemetry workspace grid.
        </p>
      </div>

      <div className={styles.centerContainer}>
        
        {/* COLUMN 1: SIDEBAR TABS */}
        <div className={styles.tabsSidebar} role="tablist" aria-label="Feature navigation tabs">
          {FEATURES.map((feature) => (
            <button
              key={feature.id}
              type="button"
              role="tab"
              aria-selected={activeId === feature.id}
              className={`${styles.tabCardButton} ${activeId === feature.id ? styles.tabCardActive : ""}`}
              onClick={() => handleTabSwitch(feature.id)}
            >
              <div className={styles.tabCardLabel}>{feature.label}</div>
            </button>
          ))}
        </div>

        {/* COLUMN 2: EXPLANATION MODULE */}
        <div className={styles.featureExplanationFrame} role="tabpanel">
          <h3 className={styles.displayTitle}>{activeFeature.title}</h3>
          <p className={styles.displayDescription}>{activeFeature.desc}</p>
          {renderControls()}
        </div>

        {/* COLUMN 3: DEVICE PREVIEW FRAMEWORK */}
        <div className={styles.mockupColumn} aria-hidden="true">
          <div className={styles.phoneContainer}>
            <div className={styles.phoneScreen}>
              <div className={styles.screenHeaderRow}>
                <span className={styles.appLogo}>📒 Khata Ledger</span>
                <div className={styles.hardwareIndicators}>
                  <span className={styles.signalBar}></span>
                  <span className={styles.batteryCell}></span>
                </div>
              </div>
              <div className={styles.phoneScrollArea}>
                {renderPhoneContent()}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
/* === SECTION 4 END === */