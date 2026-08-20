// src/components/marketing/features/investment-vault/FeaturePreview.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  FiLock,
  FiUnlock,
  FiChevronDown,
  FiBookOpen,
  FiActivity,
  FiShield,
  FiKey,
} from "react-icons/fi";
import styles from "./FeaturePreview.module.css";

export interface FeaturePreviewProps {
  id?: string;
  headline?: string;
  subheadline?: string;
}

interface DemoAssetHistory {
  id: string;
  title: string;
  date: string;
  amountAtTime: string | number;
  investedAtTime: number;
  note: string;
}

interface DemoVaultAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  quantityOwned: number;
  totalInvestedUSD: number;
  userNote: string;
  history: DemoAssetHistory[];
}

const DEMO_VAULT_ASSETS: DemoVaultAsset[] = [
  {
    id: "ast-1",
    name: "Bitcoin Vault Position",
    symbol: "BTC",
    icon: "🪙",
    quantityOwned: 0.45,
    totalInvestedUSD: 24500,
    userNote: "Long-term cold storage allocation. DCA on major weekly pullbacks.",
    history: [
      {
        id: "tx-1",
        title: "Initial Buy Order",
        date: "Aug 02, 2026",
        amountAtTime: 0.25,
        investedAtTime: 13500,
        note: "Opened primary vault position after monthly consolidation.",
      },
      {
        id: "tx-2",
        title: "Portfolio Top-Up",
        date: "Aug 14, 2026",
        amountAtTime: 0.2,
        investedAtTime: 11000,
        note: "Accumulated additional 0.20 BTC following support level test.",
      },
    ],
  },
  {
    id: "ast-2",
    name: "Vanguard S&P 500 Index",
    symbol: "VOO",
    icon: "📈",
    quantityOwned: 35,
    totalInvestedUSD: 16800,
    userNote: "Retirement equity foundation. Automatically reinvest all quarterly distributions.",
    history: [
      {
        id: "tx-3",
        title: "Monthly Index Allocation",
        date: "Aug 01, 2026",
        amountAtTime: 35,
        investedAtTime: 16800,
        note: "Executed monthly scheduled index fund purchase.",
      },
    ],
  },
  {
    id: "ast-3",
    name: "Physical Gold Reserve",
    symbol: "GOLD",
    icon: "🧈",
    quantityOwned: 2.5,
    totalInvestedUSD: 6100,
    userNote: "Physical bullion stored in custodial safety deposit box. Inflation hedge.",
    history: [
      {
        id: "tx-4",
        title: "Custodial Gold Purchase",
        date: "Jul 28, 2026",
        amountAtTime: 2.5,
        investedAtTime: 6100,
        note: "Purchased 2.5 oz minted gold bar at spot + 3% premium.",
      },
    ],
  },
];

const CORRECT_DEMO_PIN = "1234";

export default function FeaturePreview({
  id = "preview",
  headline = "Interactive Investment Vault Demo",
  subheadline = "Click on any asset row below to open its private strategy memo and review its complete chronological activity timeline.",
}: FeaturePreviewProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", ""]);
  const [pinError, setPinError] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>("ast-1");
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "PKR">("USD");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const usdToPkrRate = 278.5;

  const formatDemoCurrency = (usdVal: number): string => {
    if (displayCurrency === "PKR") {
      const pkrVal = Math.round(usdVal * usdToPkrRate);
      return `PKR ${pkrVal.toLocaleString()}`;
    }
    return `$${usdVal.toLocaleString()}`;
  };

  const handlePinInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const updated = [...pinDigits];
    updated[index] = val.slice(-1);
    setPinDigits(updated);

    if (val !== "" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (val !== "" && index === 3) {
      const fullPin = updated.join("");
      if (fullPin === CORRECT_DEMO_PIN) {
        setIsUnlocked(true);
        setPinDigits(["", "", "", ""]);
        setPinError(false);
      } else {
        setPinError(true);
        setPinDigits(["", "", "", ""]);
        setTimeout(() => {
          setPinError(false);
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  };

  const totalVaultValueUSD = DEMO_VAULT_ASSETS.reduce(
    (sum, a) => sum + a.totalInvestedUSD,
    0
  );

  return (
    <section id={id} className={styles.previewSection} aria-label="Interactive Investment Vault Simulator">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <div className={styles.interactiveIndicator}>
            <FiShield className={styles.shieldIcon} size={15} />
            <span>Encrypted Portfolio Simulator</span>
          </div>
          <h2 className={styles.previewTitle}>{headline}</h2>
          <p className={styles.previewSubtitle}>{subheadline}</p>
        </div>

        {/* TOP INTERACTIVE CONTROLS BAR */}
        <div className={styles.controlsBar}>
          <div className={styles.currencyToggleGroup}>
            <span className={styles.barLabel}>Display Currency:</span>
            <button
              type="button"
              className={`${styles.currencyBtn} ${displayCurrency === "USD" ? styles.currencyBtnActive : ""}`}
              onClick={() => setDisplayCurrency("USD")}
            >
              USD ($)
            </button>
            <button
              type="button"
              className={`${styles.currencyBtn} ${displayCurrency === "PKR" ? styles.currencyBtnActive : ""}`}
              onClick={() => setDisplayCurrency("PKR")}
            >
              PKR (Rs)
            </button>
          </div>

          <div className={styles.lockToggleGroup}>
            <button
              type="button"
              className={styles.lockStateBtn}
              onClick={() => {
                if (isUnlocked) {
                  setIsUnlocked(false);
                  setPinDigits(["", "", "", ""]);
                } else {
                  setIsUnlocked(true);
                }
              }}
            >
              {isUnlocked ? (
                <>
                  <FiLock size={14} />
                  <span>Lock Vault (Simulate PIN)</span>
                </>
              ) : (
                <>
                  <FiUnlock size={14} />
                  <span>Instant Unlock</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MOCKUP WINDOW FRAME */}
        <div className={styles.mockupFrame}>
          {/* WINDOW TITLE BAR */}
          <div className={styles.windowTopBar}>
            <div className={styles.windowControls}>
              <span className={`${styles.circleDot} ${styles.dotRed}`} />
              <span className={`${styles.circleDot} ${styles.dotYellow}`} />
              <span className={`${styles.circleDot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.windowUrlField}>
              app.rakhokhata.com/dashboard/investment-vault • Status:{" "}
              <strong>{isUnlocked ? "UNLOCKED" : "PIN LOCKED"}</strong>
            </div>
          </div>

          {/* DASHBOARD BODY */}
          <div className={styles.dashboardBody}>
            {!isUnlocked ? (
              /* SIMULATED PIN LOCK SCREEN */
              <div className={styles.lockScreenWrapper}>
                <div className={styles.lockCard}>
                  <div className={styles.lockIconCircle}>
                    <FiKey size={26} />
                  </div>
                  <h3 className={styles.lockCardTitle}>Vault Locked</h3>
                  <p className={styles.lockCardSubtitle}>
                    Enter demo PIN <strong>1234</strong> to reveal your private holdings.
                  </p>

                  <div
                    className={`${styles.pinInputRow} ${pinError ? styles.shakeAnimation : ""}`}
                  >
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="password"
                        maxLength={1}
                        className={`${styles.pinInputBox} ${pinError ? styles.pinInputError : ""}`}
                        value={digit}
                        onChange={(e) => handlePinInput(idx, e.target.value)}
                        placeholder="•"
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {pinError ? (
                    <span className={styles.pinErrorText}>Incorrect PIN. Try 1234.</span>
                  ) : (
                    <span className={styles.pinHintText}>Type 1 2 3 4 on your keyboard</span>
                  )}
                </div>
              </div>
            ) : (
              /* UNLOCKED VAULT CONTENT */
              <div className={styles.unlockedContent}>
                {/* 3 SUMMARY CARDS */}
                <div className={styles.summaryCardsGrid}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <span className={styles.summaryLabel}>Total Invested Capital</span>
                      <span className={`${styles.statusPill} ${styles.pillActive}`}>
                        <span className={styles.pulseDot} /> Active
                      </span>
                    </div>
                    <p className={styles.summaryMainMetric}>
                      {formatDemoCurrency(totalVaultValueUSD)}
                    </p>
                    <span className={styles.summaryFooterText}>
                      Positions Tracked: <strong>3 Assets</strong>
                    </span>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <span className={styles.summaryLabel}>Active Base Currency</span>
                      <span className={`${styles.statusPill} ${styles.pillInfo}`}>
                        Auto-Synced
                      </span>
                    </div>
                    <p className={`${styles.summaryMainMetric} ${styles.metricSuccess}`}>
                      {displayCurrency}
                    </p>
                    <span className={styles.summaryFooterText}>
                      Exchange Mode: <strong>Spot Rate</strong>
                    </span>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <span className={styles.summaryLabel}>Cryptographic Security</span>
                      <span className={`${styles.statusPill} ${styles.pillEncrypted}`}>
                        🔒 Protected
                      </span>
                    </div>
                    <p className={styles.summaryMainMetric}>4-Digit PIN</p>
                    <span className={styles.summaryFooterText}>
                      Bcrypt Hash: <strong>Active</strong>
                    </span>
                  </div>
                </div>

                {/* ASSET ACCORDION TABLE */}
                <div className={styles.assetTableContainer}>
                  <div className={styles.tableHeaderRow}>
                    <div>Asset & Symbol</div>
                    <div>Quantity</div>
                    <div>Total Invested</div>
                    <div>Avg Cost / Unit</div>
                    <div className={styles.textRight}>Inspect</div>
                  </div>

                  <div className={styles.assetList}>
                    {DEMO_VAULT_ASSETS.map((asset) => {
                      const isExpanded = expandedId === asset.id;
                      const avgCost = asset.totalInvestedUSD / asset.quantityOwned;

                      return (
                        <div
                          key={asset.id}
                          className={`${styles.assetCard} ${isExpanded ? styles.assetCardExpanded : ""}`}
                        >
                          {/* CLICKABLE ROW */}
                          <div
                            className={styles.assetRowMain}
                            onClick={() => setExpandedId(isExpanded ? null : asset.id)}
                          >
                            <div className={styles.cellIdentity}>
                              <span className={styles.assetAvatar}>{asset.icon}</span>
                              <div className={styles.identityText}>
                                <h4 className={styles.assetName}>{asset.name}</h4>
                                <span className={styles.assetTicker}>{asset.symbol}</span>
                              </div>
                            </div>

                            <div className={styles.cellData}>
                              <span className={styles.dataPrimary}>
                                {asset.quantityOwned} {asset.symbol}
                              </span>
                              <span className={styles.dataSecondary}>holdings</span>
                            </div>

                            <div className={styles.cellData}>
                              <span className={styles.dataPrimary}>
                                {formatDemoCurrency(asset.totalInvestedUSD)}
                              </span>
                              <span className={styles.dataSecondary}>cost basis</span>
                            </div>

                            <div className={styles.cellData}>
                              <span className={styles.dataPrimary}>
                                {formatDemoCurrency(avgCost)}
                              </span>
                              <span className={styles.dataSecondary}>
                                per {asset.symbol}
                              </span>
                            </div>

                            <div className={`${styles.cellData} ${styles.textRight}`}>
                              <span
                                className={`${styles.chevronWrapper} ${isExpanded ? styles.chevronOpen : ""}`}
                              >
                                <FiChevronDown size={18} />
                              </span>
                            </div>
                          </div>

                          {/* EXPANDED DRAWER */}
                          {isExpanded && (
                            <div className={styles.drawerContent}>
                              {/* STRATEGY MEMO BOX */}
                              <div className={styles.memoBox}>
                                <div className={styles.memoLeftAccent} />
                                <div className={styles.memoBody}>
                                  <div className={styles.memoHeader}>
                                    <FiBookOpen size={14} />
                                    <span>Investment Strategy Thesis</span>
                                  </div>
                                  <p className={styles.memoQuote}>
                                    &ldquo;{asset.userNote}&rdquo;
                                  </p>
                                </div>
                              </div>

                              {/* ACTIVITY TIMELINE */}
                              <div className={styles.timelineSection}>
                                <div className={styles.timelineTitleRow}>
                                  <FiActivity size={14} />
                                  <h5>Chronological Trade Timeline</h5>
                                </div>

                                <div className={styles.timelineList}>
                                  <div className={styles.timelineTrackLine} />

                                  {asset.history.map((hItem) => {
                                    const unitExecutionPrice =
                                      hItem.investedAtTime / Number(hItem.amountAtTime);

                                    return (
                                      <div key={hItem.id} className={styles.timelineEntry}>
                                        <div className={styles.timelineDot} />
                                        <div className={styles.timelineCard}>
                                          <div className={styles.timelineCardHeader}>
                                            <div className={styles.timelineTitleStack}>
                                              <span className={styles.nodeTitle}>
                                                {hItem.title}
                                              </span>
                                              <span className={styles.nodeIdBadge}>
                                                {hItem.id.toUpperCase()}
                                              </span>
                                            </div>
                                            <span className={styles.nodeDate}>
                                              {hItem.date}
                                            </span>
                                          </div>

                                          <p className={styles.nodeNoteText}>
                                            {hItem.note}
                                          </p>

                                          <div className={styles.nodeReceiptGrid}>
                                            <div className={styles.receiptCell}>
                                              <span className={styles.receiptLabel}>
                                                Units Bought
                                              </span>
                                              <span className={styles.receiptValue}>
                                                {hItem.amountAtTime} {asset.symbol}
                                              </span>
                                            </div>

                                            <div className={styles.receiptCell}>
                                              <span className={styles.receiptLabel}>
                                                Capital Invested
                                              </span>
                                              <span className={styles.receiptValue}>
                                                {formatDemoCurrency(hItem.investedAtTime)}
                                              </span>
                                            </div>

                                            <div className={styles.receiptCell}>
                                              <span className={styles.receiptLabel}>
                                                Execution Price
                                              </span>
                                              <span className={styles.receiptValue}>
                                                {formatDemoCurrency(unitExecutionPrice)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}