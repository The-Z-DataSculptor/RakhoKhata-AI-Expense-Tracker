"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState, useEffect, useRef } from "react";
import styles from "./FeatureCommandCenter.module.css";

const FEATURES = [
  {
    id: "ai-buddy",
    label: "🤖 AI Money Buddy",
    title: "Ask Questions in Plain English",
    desc: "No confusing accounting formulas. Ask 'Where did my salary go this week?' and get simple, friendly advice with zero judgment.",
  },
  {
    id: "ocr-scanner",
    label: "📸 AI Receipt Scanner",
    title: "Snap a Photo, Skip the Typing",
    desc: "Upload or take a photo of any paper receipt or invoice. Our Gemini vision model reads the store name, date, and exact total in seconds.",
  },
  {
    id: "vault",
    label: "🔒 Private Investment Vault",
    title: "Hidden Behind a 4-Digit Security PIN",
    desc: "Track gold, crypto, savings, or shares with complete peace of mind—even if family or friends borrow your phone or laptop.",
  },
  {
    id: "workspaces",
    label: "💼 Home & Side-Hustle Workspaces",
    title: "Keep Personal & Business Cleanly Split",
    desc: "Stop mixing grocery bills with client income. Switch between your home budget and freelance earnings with a single tap.",
  },
  {
    id: "currency",
    label: "🌍 Multi-Currency Ledger",
    title: "Works Seamlessly in PKR, USD & Beyond",
    desc: "Earn in USD or EUR while spending in PKR or AED. Automatic exchange rates keep your total net balance 100% accurate.",
  },
] as const;

type FeatureId = typeof FEATURES[number]["id"];
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN COMPONENT & STATE MECHANICS ===
   ========================================================================== */
export default function FeatureCommandCenter() {
  const [activeId, setActiveId] = useState<FeatureId>("ai-buddy");
  const [workspaceMode, setWorkspaceMode] = useState<"personal" | "business">("personal");
  
  // AI Companion interaction states
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiAnswer, setAiAnswer] = useState<string>(
    "You spent Rs 4,200 on food delivery this week. That's Rs 1,100 less than last week! Safe to spend today: Rs 3,400."
  );

  // Receipt Scanner interaction states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    merchant: string;
    amount: string;
    date: string;
  } | null>({
    merchant: "Metro Supermarket",
    amount: "Rs 6,450",
    date: "18 Aug 2026",
  });

  // Vault PIN state
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const activeFeature = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  const handleTabSwitch = (id: FeatureId) => {
    clearTimer();
    setActiveId(id);
  };

  const handleTriggerAiQuery = () => {
    if (isAiThinking) return;
    setIsAiThinking(true);
    setAiAnswer("Analyzing your recent transactions...");

    timerRef.current = setTimeout(() => {
      setAiAnswer(
        "Found 1 subscription leak: You have an unused cloud storage charge of $9.99 renewing in 3 days!"
      );
      setIsAiThinking(false);
    }, 1200);
  };

  const handleTriggerOcrScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScannedResult(null);

    timerRef.current = setTimeout(() => {
      setScannedResult({
        merchant: "McDonald's Drive-Thru",
        amount: "Rs 1,850",
        date: "Today, 2:15 PM",
      });
      setIsScanning(false);
    }, 1400);
  };
  /* === SECTION 2 END === */

  /* ==========================================================================
     === SECTION 3: RENDER ACTION CONTROLLERS ===
     ========================================================================== */
  const renderControls = () => {
    if (activeId === "ai-buddy") {
      return (
        <div className={styles.interactiveActionArea}>
          <button
            type="button"
            className={`${styles.actionButton} ${isAiThinking ? styles.actionButtonActive : ""}`}
            onClick={handleTriggerAiQuery}
            disabled={isAiThinking}
          >
            {isAiThinking ? (
              <>
                <span className={styles.pulseDot} aria-hidden="true"></span>
                AI Buddy is Calculating...
              </>
            ) : (
              "💬 Ask AI: 'Where am I overspending?'"
            )}
          </button>
        </div>
      );
    }

    if (activeId === "ocr-scanner") {
      return (
        <div className={styles.interactiveActionArea}>
          <button
            type="button"
            className={`${styles.actionButton} ${isScanning ? styles.actionButtonActive : ""}`}
            onClick={handleTriggerOcrScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <span className={styles.pulseDot} aria-hidden="true"></span>
                AI Vision Scanning Receipt...
              </>
            ) : (
              "📸 Try Receipt Auto-Scan"
            )}
          </button>
        </div>
      );
    }

    if (activeId === "vault") {
      return (
        <div className={styles.interactiveActionArea}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => setIsVaultUnlocked(!isVaultUnlocked)}
          >
            {isVaultUnlocked ? "🔒 Relock Investment Vault" : "🔑 Enter PIN to View Assets"}
          </button>
        </div>
      );
    }

    if (activeId === "workspaces") {
      return (
        <div className={styles.interactiveActionArea}>
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleButton} ${workspaceMode === "personal" ? styles.toggleActive : ""}`}
              onClick={() => setWorkspaceMode("personal")}
            >
              🏡 Personal Home
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${workspaceMode === "business" ? styles.toggleActive : ""}`}
              onClick={() => setWorkspaceMode("business")}
            >
              💼 Side-Hustle / Work
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.interactiveActionArea}>
        <div className={styles.automatedStatusBanner}>
          ⚡ Real-time automated exchange rate active
        </div>
      </div>
    );
  };

  /* ==========================================================================
     === SECTION 4: RENDER PHONE SCREEN SIMULATION ===
     ========================================================================== */
  const renderPhoneContent = () => {
    // 1. AI Buddy Screen
    if (activeId === "ai-buddy") {
      return (
        <div className={styles.animateFade}>
          <div className={styles.aiChatScreen}>
            <div className={styles.chatBubbleUser}>
              &ldquo;Where did most of my cash go this week?&rdquo;
            </div>
            <div className={styles.chatBubbleAi}>
              <span className={styles.aiBotTag}>🤖 RakhoKhaata AI</span>
              <p>{aiAnswer}</p>
            </div>
          </div>
        </div>
      );
    }

    // 2. Receipt Scanner Screen
    if (activeId === "ocr-scanner") {
      return (
        <div className={styles.animateFade}>
          <div className={styles.scannerScreen}>
            <div className={styles.scannerCameraBox}>
              <span className={styles.scanTargetIcon}>📷</span>
              <span className={styles.scanTargetText}>
                {isScanning ? "Extracting line items..." : "Receipt Detected"}
              </span>
            </div>
            {scannedResult && (
              <div className={styles.scannedCardPreview}>
                <div className={styles.scannedRow}>
                  <span>Store:</span>
                  <strong>{scannedResult.merchant}</strong>
                </div>
                <div className={styles.scannedRow}>
                  <span>Amount:</span>
                  <strong className={styles.scannedAmount}>{scannedResult.amount}</strong>
                </div>
                <div className={styles.scannedRow}>
                  <span>Date:</span>
                  <span>{scannedResult.date}</span>
                </div>
                <div className={styles.parsedTag}>✓ Auto-Categorized as Expense</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Vault Screen
    if (activeId === "vault") {
      return (
        <div className={styles.animateFade}>
          {!isVaultUnlocked ? (
            <div className={styles.vaultLockedView}>
              <div className={styles.vaultBigLock}>🔒</div>
              <p className={styles.vaultStatusTitle}>Private Vault Locked</p>
              <p className={styles.vaultStatusSubtitle}>Enter your 4-digit PIN to reveal balances</p>
              <div className={styles.mockPinDots}>
                <span className={styles.mockPinDotFilled}></span>
                <span className={styles.mockPinDotFilled}></span>
                <span className={styles.mockPinDotFilled}></span>
                <span className={styles.mockPinDotEmpty}></span>
              </div>
            </div>
          ) : (
            <div className={styles.vaultUnlockedView}>
              <div className={styles.vaultHeaderBadge}>
                <span>🔓 Vault Unlocked</span>
              </div>
              <div className={styles.vaultAssetRow}>
                <div>
                  <strong>Gold Reserve (Tola)</strong>
                  <p>2.5 Units • Safe Deposit</p>
                </div>
                <span className={styles.assetValue}>Rs 615,000</span>
              </div>
              <div className={styles.vaultAssetRow}>
                <div>
                  <strong>Emergency Cash Savings</strong>
                  <p>High-Yield Account</p>
                </div>
                <span className={styles.assetValue}>$1,850.00</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 4. Workspaces Screen
    if (activeId === "workspaces") {
      return (
        <div className={styles.animateFade}>
          <div className={styles.balanceCard}>
            <div className={styles.cardLabel}>
              {workspaceMode === "personal" ? "Personal Home Balance" : "Side-Hustle Balance"}
            </div>
            <div className={styles.cardValue}>
              {workspaceMode === "personal" ? "Rs 84,250" : "$2,450.00"}
            </div>
          </div>
          <div className={styles.logListStack}>
            {workspaceMode === "personal" ? (
              <>
                <div className={styles.miniLogLine}>
                  <span>🛒 Monthly Groceries</span>
                  <strong>-Rs 18,500</strong>
                </div>
                <div className={styles.miniLogLine}>
                  <span>⚡ Home Utility Bill</span>
                  <strong>-Rs 12,300</strong>
                </div>
              </>
            ) : (
              <>
                <div className={styles.miniLogLine}>
                  <span>🚀 Client Project Retainer</span>
                  <strong className={styles.textSuccess}>+$1,200.00</strong>
                </div>
                <div className={styles.miniLogLine}>
                  <span>💻 Software Tool License</span>
                  <strong>-$49.00</strong>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // 5. Multi-Currency Screen
    if (activeId === "currency") {
      return (
        <div className={`${styles.animateFade} ${styles.currencyCalculatorBox}`}>
          <div className={styles.currencyValueRow}>
            <span className={styles.currencyMeta}>💵 USD Inflow (Freelance)</span>
            <strong className={styles.currencyValue}>$500.00</strong>
          </div>
          <div className={styles.conversionArrowVector}>
            <span className={styles.vectorLine}></span>
            <span className={styles.vectorText}>Live Exchange Conversion</span>
            <span className={styles.vectorLine}></span>
          </div>
          <div className={styles.currencyValueRow}>
            <span className={styles.currencyMeta}>🇵🇰 Home Ledger Equivalent</span>
            <strong className={styles.currencyValueTarget}>Rs 139,500 PKR</strong>
          </div>
        </div>
      );
    }

    return null;
  };
  /* === SECTION 4 END === */

  return (
    <section id="features" className={styles.commandSection} aria-label="Core Feature Capabilities">
      
      <div className={styles.sectionHeader}>
        <div className={styles.sectionBadge}>Simple & Powerful</div>
        <h2 className={styles.sectionHeading}>Everything You Need to Master Your Money</h2>
        <p className={styles.sectionSubtext}>
          No complex spreadsheets or confusing accounting jargon. Click any feature below to test how RakhoKhaata works.
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

        {/* COLUMN 3: PHONE PREVIEW SIMULATOR */}
        <div className={styles.mockupColumn} aria-hidden="true">
          <div className={styles.phoneContainer}>
            <div className={styles.phoneScreen}>
              <div className={styles.screenHeaderRow}>
                <span className={styles.appLogo}>📒 RakhoKhaata</span>
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