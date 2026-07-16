// src/components/investments/VaultAssetTable/VaultAssetTable.tsx
"use client";

import React, { useState } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { HydratedAsset } from "@/app/(dashboard)/dashboard/investment-vault/page";
import styles from "./VaultAssetTable.module.css";

/* ==========================================================================
   === SYSTEM ICONS ===
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
const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.82-13 1.5 1.5 0 0 0-2.18 2.08A16 16 0 0 0 9 12s2 5 6 9v-3c0-.82-.3-1.6-.8-2.22l-2.2-2.28z"/><path d="m22 7-3 3a22 22 0 0 1-13 3.82 1.5 1.5 0 0 0 2.08-2.18A16 16 0 0 0 12 9s5 2 9 6h-3c-.82 0-1.6-.3-2.22-.8l-2.28-2.2z"/></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

/* ==========================================================================
   === TYPES ===
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
  currency?: string;
  onDeleteAsset: (id: string) => void;
  onEditClick?: (asset: HydratedAsset) => void;
  sourceCurrency: string;
}

/* ==========================================================================
   === HELPERS ===
   ========================================================================== */
function extractNoteFromUserNote(input: string): string {
  if (!input) return "";

  if (typeof input === "string" && input.trim().startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(input);
      if (parsed !== null && typeof parsed === "object" && "rawNote" in parsed) {
        const obj = parsed as Record<string, unknown>;
        const raw = obj.rawNote;
        return typeof raw === "string" ? raw : "";
      }
      if (typeof parsed === "string") return parsed;
    } catch {}
  }
  return input;
}

function generateEntryId(idString: string | undefined) {
  if (!idString) return "0000";
  const clean = idString.replace(/[^a-zA-Z0-9]/g, '');
  return `${clean.slice(-4).toUpperCase()}`;
}

/* ==========================================================================
   === MAIN COMPONENT ===
   ========================================================================== */
export function VaultAssetTable({
  assets,
  onDeleteAsset,
  onEditClick,
  sourceCurrency,
}: VaultAssetTableProps) {
  const { formatAmount } = useCurrency();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className={styles.container}>
      <div className={styles.tableHeader}>
        <div>Item Name</div>
        <div>Total Amount</div>
        <div>Total Spent</div>
        <div>Average Price Per Item</div>
        <div className={styles.alignRight}>Actions</div>
      </div>

      <div className={styles.assetList}>
        {assets.map((asset) => {
          const isExpanded = expandedId === asset.id;

          const averageCostPerUnit = asset.quantityOwned > 0
            ? asset.totalInvested / asset.quantityOwned
            : 0;

          const displayNote = extractNoteFromUserNote(asset.userNote);

          return (
            <div
              key={asset.id}
              className={`${styles.assetCard} ${isExpanded ? styles.activeCard : ""}`}
            >
              <div
                className={styles.rowGrid}
                onClick={() => setExpandedId(isExpanded ? null : asset.id)}
              >
                {/* Asset identity */}
                <div className={styles.cell}>
                  <div className={styles.assetIdentity}>
                    <span className={styles.avatar}>{asset.icon}</span>
                    <div className={styles.identityTextStack}>
                      <h3 className={styles.assetName}>{asset.name}</h3>
                      <span className={styles.ticker}>{asset.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryNumber}>
                      {asset.quantityOwned} <span className={styles.inlineTickerSymbol}>{asset.symbol}</span>
                    </span>
                    <span className={styles.secondaryLabel}>owned</span>
                  </div>
                </div>

                {/* Total Invested (cost) */}
                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryValueNumber}>
                      {formatAmount(asset.totalInvested, sourceCurrency)}
                    </span>
                    <span className={styles.secondarySpentLabel}>total spent</span>
                  </div>
                </div>

                {/* Average Cost per Unit */}
                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryValueNumber}>
                      {formatAmount(averageCostPerUnit, sourceCurrency)}
                    </span>
                    <span className={styles.secondarySpentLabel}>per {asset.symbol}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cell} style={{ justifyContent: "flex-end" }}>
                  <div className={styles.actionsGroup}>
                    {onEditClick && (
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Edit this item"
                        onClick={(e) => { e.stopPropagation(); onEditClick(asset); }}
                      >
                        <PencilIcon />
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Delete this item"
                      onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }}
                    >
                      <TrashIcon />
                    </button>
                    <div className={`${styles.accordionIndicatorArrow} ${isExpanded ? styles.arrowRotated : ""}`}>
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPANDED DRAWER - SIMPLIFIED LANGUAGE */}
              {isExpanded && (
                <div className={styles.drawerContent}>
                  
                  {/* Strategy Note */}
                  <div className={styles.journalMemoBox}>
                    <div className={styles.journalLeftBorder} />
                    <div className={styles.journalBody}>
                      <span className={styles.journalTitleBadge}>
                        <BookOpenIcon /> My Notes
                      </span>
                      <p className={styles.journalQuote}>
                        &quot;{displayNote || "No notes saved for this item yet."}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Redesigned Timeline Section */}
                  <div className={styles.historySection}>
                    <div className={styles.historySectionTitleLine}>
                      <HistoryIcon />
                      <h4 className={styles.historySectionTitle}>Activity History</h4>
                    </div>

                    <div className={styles.modernTimelineContainer}>
                      <div className={styles.timelineTrack} />

                      {asset.history && asset.history.length > 0 ? (
                        asset.history.map((item, index) => {
                          const historyItem = item as unknown as SafeHistoryNode;
                          const isInitial = historyItem.title?.includes("Initial");
                          
                          const rawQuantityNumber = parseFloat(String(historyItem.amountAtTime || "0"));
                          const investedAmount = Number(historyItem.investedAtTime || 0);
                          const executionPrice = rawQuantityNumber > 0 ? investedAmount / rawQuantityNumber : 0;
                          
                          return (
                            <div key={historyItem.id || index} className={styles.timelineNode}>
                              {/* Node Dot / Icon */}
                              <div className={`${styles.timelineDot} ${isInitial ? styles.dotInitial : styles.dotUpdate}`}>
                                {isInitial ? <RocketIcon /> : <ActivityIcon />}
                              </div>

                              {/* Content Card */}
                              <div className={styles.timelineContentCard}>
                                <div className={styles.nodeHeaderRow}>
                                  <div className={styles.nodeTitleBlock}>
                                    <span className={styles.nodeTitle}>{historyItem.title || "Item Updated"}</span>
                                    <span className={styles.nodeHashTag}>ID: {generateEntryId(historyItem.id)}</span>
                                  </div>
                                  <span className={styles.nodeDateBadge}>{historyItem.date || "N/A"}</span>
                                </div>

                                <div className={styles.nodeNoteBox}>
                                  <span className={styles.memoLabel}>NOTE:</span>
                                  <span className={styles.memoText}>{historyItem.note || "You updated this item."}</span>
                                </div>

                                <div className={styles.receiptMetricsGrid}>
                                  <div className={styles.receiptCell}>
                                    <span className={styles.receiptLabel}>Amount Owned</span>
                                    <span className={styles.receiptValue}>{historyItem.amountAtTime || "0"}</span>
                                  </div>
                                  
                                  <div className={styles.receiptCell}>
                                    <span className={styles.receiptLabel}>Total Spent</span>
                                    <span className={styles.receiptValue}>
                                      {historyItem.investedAtTime !== undefined
                                        ? formatAmount(Number(historyItem.investedAtTime), sourceCurrency)
                                        : "—"}
                                    </span>
                                  </div>

                                  <div className={styles.receiptCell}>
                                    <span className={styles.receiptLabel}>Price Per Item</span>
                                    <span className={styles.receiptValue}>
                                      {executionPrice > 0
                                        ? formatAmount(executionPrice, sourceCurrency)
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.timelineNode}>
                           <div className={`${styles.timelineDot} ${styles.dotEmpty}`} />
                           <div className={styles.timelineContentCard}>
                              <p className={styles.emptyTimelineText}>No history found for this item.</p>
                           </div>
                        </div>
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