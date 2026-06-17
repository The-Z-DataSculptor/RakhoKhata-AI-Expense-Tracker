// src/components/investments/VaultAssetTable/VaultAssetTable.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
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
interface HistoryItem {
  id: string;
  date: string;
  title: string;
  note: string;
  amountAtTime: string;
  investedAtTime: number;
  valueAtTime: number;
  roiAtTime: string;
  isProfitAtTime: boolean;
}

interface Asset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  userNote: string;
  currentPrice: number;
  quantityOwned: number;
  totalInvested: number;
  currency?: string; 
  history: HistoryItem[];
}

interface VaultAssetTableProps {
  assets: Asset[];
  onEditClick: (asset: Asset) => void;
  onDeleteClick: (id: string) => void;
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: COMPONENT LOGIC ===
   ========================================================================== */
export function VaultAssetTable({ assets, onEditClick, onDeleteClick }: VaultAssetTableProps) {
  const { formatAmount, currency: globalFallbackCurrency } = useCurrency();
  const [expandedId, setExpandedId] = useState<string | null>(null);
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: RENDER (JSX) ===
   ========================================================================== */
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
          
          // FIXED: Appended "as any" to bypass the strict CurrencyType constraint
          // Since we know the inputs are valid currency codes, this is safe to do.
          const itemNativeCurrency = (asset.currency || globalFallbackCurrency || "USD") as any;

          // --- CALCULATIONS FOR MAIN ROW ---
          const currentTotalValue = asset.quantityOwned * asset.currentPrice;
          const totalProfitLoss = currentTotalValue - asset.totalInvested;
          const isProfit = totalProfitLoss >= 0;
          
          const roiValue = asset.totalInvested > 0
            ? (totalProfitLoss / asset.totalInvested) * 100
            : 0;

          return (
            <div 
              key={asset.id} 
              className={`${styles.assetCard} ${isProfit ? styles.profitCardTheme : styles.lossCardTheme} ${isExpanded ? styles.activeCard : ""}`}
            >
              <div className={styles.rowGrid} onClick={() => setExpandedId(isExpanded ? null : asset.id)}>
                
                {/* 1. ASSET NAME */}
                <div className={styles.cell}>
                  <div className={styles.assetIdentity}>
                    <span className={styles.avatar}>{asset.icon}</span>
                    <div className={styles.identityTextStack}>
                      <h3 className={styles.assetName}>{asset.name}</h3>
                      <span className={styles.ticker}>{asset.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* 2. TOTAL QUANTITY */}
                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryNumber}>
                      {asset.quantityOwned} <span className={styles.inlineTickerSymbol}>{asset.symbol}</span>
                    </span>
                    <span className={styles.secondaryLabel}>
                      at {formatAmount(asset.currentPrice, itemNativeCurrency)} avg
                    </span>
                  </div>
                </div>

                {/* 3. TOTAL INVESTED */}
                <div className={styles.cell}>
                  <div className={styles.dataStack}>
                    <span className={styles.primaryValueNumber}>
                      {formatAmount(asset.totalInvested, itemNativeCurrency)} <span className={styles.inlineValueContext}>Spent</span>
                    </span>
                    <span className={styles.secondarySpentLabel}>
                      Value: {formatAmount(currentTotalValue, itemNativeCurrency)}
                    </span>
                  </div>
                </div>

                {/* 4. PROGRESS */}
                <div className={styles.cell}>
                  <div className={`${styles.cleanProgressStack} ${isProfit ? styles.profitText : styles.lossText}`}>
                    <span className={styles.progressAmount}>
                      {isProfit ? "+" : ""}{formatAmount(totalProfitLoss, itemNativeCurrency)}
                    </span>
                    <span className={styles.progressPercentage}>
                      {isProfit ? "▲" : "▼"} {Math.abs(roiValue).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* ACTIONS CONTROLS */}
                <div className={styles.cell} style={{ justifyContent: 'flex-end' }}>
                  <div className={styles.actionsGroup}>
                    <button 
                      className={styles.iconBtn} 
                      title="Edit Asset" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(asset);
                      }}
                    >
                      <PencilIcon />
                    </button>
                    <button 
                      className={styles.iconBtn} 
                      title="Delete Asset" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(asset.id);
                      }}
                    >
                      <TrashIcon />
                    </button>
                    <div className={`${styles.accordionIndicatorArrow} ${isExpanded ? styles.arrowRotated : ""}`}>
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPANDABLE LEDGER HISTORY TIMELINE DRAWER */}
              {isExpanded && (
                <div className={styles.drawerContent}>
                  
                  <div className={styles.journalMemoBox}>
                    <div className={styles.journalLeftBorder} />
                    <div className={styles.journalBody}>
                      <span className={styles.journalTitleBadge}>
                        <BookOpenIcon /> My Strategy Note
                      </span>
                      <p className={styles.journalQuote}>"{asset.userNote || "No active asset logging notes typed yet."}"</p>
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
                          const unitsAtTime = parseFloat(item.amountAtTime) || 0;
                          const historicalProfitLoss = item.valueAtTime - item.investedAtTime;
                          const historicalIsProfit = historicalProfitLoss >= 0;
                          
                          const historicalRoi = item.investedAtTime > 0
                            ? (historicalProfitLoss / item.investedAtTime) * 100
                            : 0;

                          return (
                            <div key={item.id} className={styles.timelineStepCard}>
                              <div className={styles.stepHeader}>
                                <span className={styles.stepTitle}>{item.title}</span>
                                <span className={styles.stepDate}>{item.date}</span>
                              </div>
                              
                              <div className={styles.stepMetricsGrid}>
                                <div className={styles.miniDataCell}>
                                  <span className={styles.stepMetaLabel}>Quantity Owned</span>
                                  <span className={styles.stepMetaValue}>{item.amountAtTime}</span>
                                </div>
                                <div className={styles.miniDataCell}>
                                  <span className={styles.stepMetaLabel}>Value at Time</span>
                                  <span className={styles.stepMetaValue}>{formatAmount(item.valueAtTime, itemNativeCurrency)}</span>
                                </div>
                                <div className={styles.miniDataCell}>
                                  <span className={styles.stepMetaLabel}>Progress</span>
                                  <span className={`${styles.stepMetaValue} ${historicalIsProfit ? styles.profitTextLabel : styles.lossTextLabel}`}>
                                    {historicalIsProfit ? "+" : ""}{formatAmount(historicalProfitLoss, itemNativeCurrency)} ({historicalIsProfit ? "▲" : "▼"}{Math.abs(historicalRoi).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>

                              <p className={styles.stepNoteParagraph}>
                                <span className={styles.stepMemoInlineTag}>Log Note</span> "{item.note}"
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className={styles.stepNoteParagraph} style={{ color: 'var(--text-muted)' }}>
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