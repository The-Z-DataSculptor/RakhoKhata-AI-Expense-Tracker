// src/components/investments/VaultAssetTable/VaultAssetTable.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { HydratedAsset } from "@/app/(dashboard)/dashboard/investment-vault/page";
import styles from "./VaultAssetTable.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SYSTEM ICONS ===
   ========================================================================== */
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: TYPES & INTERFACES ===
   ========================================================================== */
interface SafeHistoryNode {
  id?: string;
  title?: string;
  date?: string;
  amountAtTime?: string | number;
  valueAtTime?: string | number;
  investedAtTime?: string | number;
  note?: string;
}

interface VaultAssetTableProps {
  assets: HydratedAsset[];
  currency?: string; // kept for compatibility but not used (the parent passes it)
  onDeleteAsset: (id: string) => void;
  onEditClick?: (asset: HydratedAsset) => void;
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: HELPER – EXTRACT RAW NOTE ===
   ========================================================================== */
function extractNoteFromUserNote(input: string): string {
  if (!input) return "";

  if (typeof input === "string" && input.trim().startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(input);

      if (
        parsed !== null &&
        typeof parsed === "object" &&
        "rawNote" in parsed
      ) {
        const obj = parsed as Record<string, unknown>;
        const raw = obj.rawNote;
        return typeof raw === "string" ? raw : "";
      }

      if (typeof parsed === "string") {
        return parsed;
      }
    } catch {
      // Not valid JSON, return original
    }
  }

  return input;
}
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: MAIN COMPONENT ===
   ========================================================================== */
export function VaultAssetTable({
  assets,
  onDeleteAsset,
  onEditClick,
}: VaultAssetTableProps) {
  const { formatAmount } = useCurrency();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className={styles.container}>
      
      <div className={styles.tableHeader}>
        <div>Asset Name</div>
        <div>Total Quantity</div>
        <div>Total Invested</div>
        <div>Progress</div>
        <div className={styles.alignRight}>Actions</div>
      </div>

      <div className={styles.assetList}>
        {assets.map((asset) => {
          const isExpanded = expandedId === asset.id;

          // ----- CALCULATE PROFIT/LOSS METRICS -----
          const currentTotalValue = asset.quantityOwned * asset.currentPrice;
          const totalProfitLoss = currentTotalValue - asset.totalInvested;
          const isProfit = totalProfitLoss >= 0;

          const roiValue = asset.totalInvested > 0
            ? (totalProfitLoss / asset.totalInvested) * 100
            : 0;

          const displayNote = extractNoteFromUserNote(asset.userNote);

          return (
            <div
              key={asset.id}
              className={`
                ${styles.assetCard} 
                ${isProfit ? styles.profitCardTheme : styles.lossCardTheme} 
                ${isExpanded ? styles.activeCard : ""}
              `}
            >
              <div
                className={styles.rowGrid}
                onClick={() => setExpandedId(isExpanded ? null : asset.id)}
              >
                
                <div className={styles.cell}>
                  <div className={styles.assetIdentity}>
                    <span className={styles.avatar}>{asset.icon}</span>
                    <div className={styles.identityTextStack}>
                      <h3 className={styles.assetName}>{asset.name}</h3>
                      <span className={styles.ticker}>{asset.symbol}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryNumber}>
                      {asset.quantityOwned}{" "}
                      <span className={styles.inlineTickerSymbol}>{asset.symbol}</span>
                    </span>
                    <span className={styles.secondaryLabel}>
                      at {formatAmount(asset.currentPrice)} avg
                    </span>
                  </div>
                </div>

                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryValueNumber}>
                      {formatAmount(asset.totalInvested)}{" "}
                      <span className={styles.inlineValueContext}>Spent</span>
                    </span>
                    <span className={styles.secondarySpentLabel}>
                      Value: {formatAmount(currentTotalValue)}
                    </span>
                  </div>
                </div>

                <div className={styles.cell}>
                  <div
                    className={`
                      ${styles.cleanProgressStack} 
                      ${isProfit ? styles.profitText : styles.lossText}
                    `}
                  >
                    <span className={styles.progressAmount}>
                      {isProfit ? "+" : ""}
                      {formatAmount(totalProfitLoss)}
                    </span>
                    <span className={styles.progressPercentage}>
                      {isProfit ? "▲" : "▼"} {Math.abs(roiValue).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className={styles.cell} style={{ justifyContent: "flex-end" }}>
                  <div className={styles.actionsGroup}>
                    
                    {onEditClick && (
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Edit this asset"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(asset);
                        }}
                      >
                        <PencilIcon />
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Delete this asset"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAsset(asset.id);
                      }}
                    >
                      <TrashIcon />
                    </button>

                    <div
                      className={`
                        ${styles.accordionIndicatorArrow} 
                        ${isExpanded ? styles.arrowRotated : ""}
                      `}
                    >
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.drawerContent}>
                  
                  <div className={styles.journalMemoBox}>
                    <div className={styles.journalLeftBorder} />
                    <div className={styles.journalBody}>
                      <span className={styles.journalTitleBadge}>
                        <BookOpenIcon /> My Strategy Note
                      </span>
                      <p className={styles.journalQuote}>
                        &quot;{displayNote || "No active asset logging notes typed yet."}&quot;
                      </p>
                    </div>
                  </div>

                  <div className={styles.historySection}>
                    <div className={styles.historySectionTitleLine}>
                      <HistoryIcon />
                      <h4 className={styles.historySectionTitle}>History Timeline Ledger</h4>
                    </div>

                    <div className={styles.timelineList}>
                      {asset.history && asset.history.length > 0 ? (
                        asset.history.map((item) => {
                          const historyItem = item as unknown as SafeHistoryNode;

                          const historicalInvested = Number(historyItem.investedAtTime) || 0;
                          const historicalValue = Number(historyItem.valueAtTime) || 0;
                          const historicalProfitLoss = historicalValue - historicalInvested;
                          const historicalIsProfit = historicalProfitLoss >= 0;

                          const historicalRoi = historicalInvested > 0
                            ? (historicalProfitLoss / historicalInvested) * 100
                            : 0;

                          return (
                            <div
                              key={historyItem.id || Math.random().toString()}
                              className={styles.timelineStepCard}
                            >
                              <div className={styles.stepHeader}>
                                <span className={styles.stepTitle}>
                                  {historyItem.title || "Position Log Update"}
                                </span>
                                <span className={styles.stepDate}>
                                  {historyItem.date || "N/A"}
                                </span>
                              </div>

                              <div className={styles.stepMetricsGrid}>
                                <div className={styles.miniDataCell}>
                                  <span className={styles.stepMetaLabel}>Quantity Traded</span>
                                  <span className={styles.stepMetaValue}>
                                    {historyItem.amountAtTime || "0"}
                                  </span>
                                </div>
                                <div className={styles.miniDataCell}>
                                  <span className={styles.stepMetaLabel}>Value at Time</span>
                                  {/* 👇 FIXED: Added "USD" as source currency for historical values */}
                                  <span className={styles.stepMetaValue}>
                                    {formatAmount(historicalValue, "USD")}
                                  </span>
                                </div>
                                <div className={styles.miniDataCell}>
                                  <span className={styles.stepMetaLabel}>Progress</span>
                                  <span
                                    className={`
                                      ${styles.stepMetaValue} 
                                      ${historicalIsProfit ? styles.profitTextLabel : styles.lossTextLabel}
                                    `}
                                  >
                                    {historicalIsProfit ? "+" : ""}
                                    {/* 👇 FIXED: Added "USD" as source currency for historical values */}
                                    {formatAmount(historicalProfitLoss, "USD")} 
                                    ({historicalIsProfit ? "▲" : "▼"}
                                    {Math.abs(historicalRoi).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>

                              <p className={styles.stepNoteParagraph}>
                                <span className={styles.stepMemoInlineTag}>Log Note</span>
                                &quot;{historyItem.note || "No memo parameters saved."}&quot;
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className={styles.stepNoteParagraph} style={{ color: "var(--text-muted)" }}>
                          No historical logs recorded for this asset profile.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
/* === SECTION 5 END === */