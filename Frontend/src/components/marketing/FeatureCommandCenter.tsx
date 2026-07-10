"use client";

import { useState } from "react";
import styles from "./FeatureCommandCenter.module.css";

/* ==========================================================================
   === SECTION 1: DATA STRUCTURES ===
   ========================================================================== */

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
];

/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: MAIN COMPONENT & STATE ===
   ========================================================================== */

export default function FeatureCommandCenter() {
  // State initialization for active feature tabs and interaction logic
  const [activeId, setActiveId] = useState("workspaces");
  const [workspaceMode, setWorkspaceMode] = useState<"private" | "business">("private");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  const activeFeature = FEATURES.find((f) => f.id === activeId);
  
  if (!activeFeature) {
    return null;
  }

  /* === SECTION 2.1: INTERACTIVE HELPERS === */

  const handleVoiceClick = () => {
    if (isRecording) return;
    setIsRecording(true);
    setVoiceText("");

    // Simulated API delay for voice processing demonstration
    setTimeout(() => {
      setVoiceText("Coffee $4.50 at Starbucks");
      setTimeout(() => {
        setIsRecording(false);
      }, 1500);
    }, 1500);
  };

  /* === SECTION 2.2: RENDER HELPERS === */

  const renderControls = () => {
    if (activeId === "workspaces") {
      return (
        <div className={styles.interactiveActionArea}>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleButton} ${workspaceMode === "private" ? styles.toggleActive : ""}`}
              onClick={() => setWorkspaceMode("private")}
            >
              🏡 Private Mode
            </button>
            <button
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
            className={`${styles.actionButton} ${isRecording ? styles.actionButtonActive : ""}`}
            onClick={handleVoiceClick}
            disabled={isRecording}
          >
            {isRecording ? (
              <>
                <span className={styles.pulseDot}></span>
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
            <span className={styles.textMutedLabel}>Bypassed</span>
          </div>
        </div>
      );
    }

    return null;
  };

  /* === SECTION 3: MAIN JSX RENDER LAYOUT === */

  return (
    // Added id="features" to enable navigation anchor linking
    <section id="features" className={styles.commandSection}>
      
      {/* COMPONENT SUMMARY HEADER */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionBadge}>System Orchestration</div>
        <h2 className={styles.sectionHeading}>Platform Capabilities Hub</h2>
        <p className={styles.sectionSubtext}>
          Interact with our dynamic feature architecture directly from the central telemetry workspace grid.
        </p>
      </div>

      {/* CORE DESKTOP VIEWPORT GRID MAP */}
      <div className={styles.centerContainer}>
        
        {/* COLUMN 1: SIDEBAR OPTION SELECTORS */}
        <div className={styles.tabsSidebar}>
          {FEATURES.map((feature) => (
            <button
              key={feature.id}
              className={`${styles.tabCardButton} ${activeId === feature.id ? styles.tabCardActive : ""}`}
              onClick={() => {
                setActiveId(feature.id);
                if (feature.id === "voice") {
                  setIsRecording(false);
                  setVoiceText("");
                }
              }}
            >
              <div className={styles.tabCardLabel}>{feature.label}</div>
            </button>
          ))}
        </div>

        {/* COLUMN 2: ACTIVE DESCRIPTION MODULE & CTA TRIGGER */}
        <div className={styles.featureExplanationFrame}>
          <h3 className={styles.displayTitle}>{activeFeature.title}</h3>
          <p className={styles.displayDescription}>{activeFeature.desc}</p>
          {renderControls()}
        </div>

        {/* COLUMN 3: DEVICE PREVIEW FRAMEWORK */}
        <div className={styles.mockupColumn}>
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
/* === SECTION 3 END === */