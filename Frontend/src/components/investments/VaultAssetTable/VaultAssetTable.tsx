"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & SYSTEM ICONS ===
   ========================================================================== */
import React, { useState, memo } from "react";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { HydratedAsset } from "@/app/(dashboard)/dashboard/investment-vault/page";
import styles from "./VaultAssetTable.module.css";

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);
const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.82-13 1.5 1.5 0 0 0-2.18 2.08A16 16 0 0 0 9 12s2 5 6 9v-3c0-.82-.3-1.6-.8-2.22l-2.2-2.28z"/><path d="m22 7-3 3a22 22 0 0 1-13 3.82 1.5 1.5 0 0 0 2.08-2.18A16 16 0 0 0 12 9s5 2 9 6h-3c-.82 0-1.6-.3-2.22-.8l-2.28-2.2z"/></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
/* === SECTION 1 END === */

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
  onAddAssetClick?: () => void;
}

function generateEntryId(idString?: string): string {
  if (!idString) return "0000";
  const clean = idString.replace(/[^a-zA-Z0-9]/g, "");
  return clean.length >= 4 ? clean.slice(-4).toUpperCase() : clean.toUpperCase().padStart(4, "0");
}

/* ==========================================================================
   === SECTION 2: MEMOIZED INDIVIDUAL ASSET ROW ===
   ========================================================================== */
interface AssetRowProps {
  asset: HydratedAsset;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit?: (asset: HydratedAsset) => void;
  onDelete: (id: string) => void;
  sourceCurrency: string;
}

const MemoizedAssetRow = memo(function AssetRow({
  asset,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  sourceCurrency,
}: AssetRowProps) {
  const { formatAmount, convertAmount } = useCurrency();

  const safeQuantity = Number(asset.quantityOwned) || 0;
  const safeInvested = Number(asset.totalInvested) || 0;
  const averageCostPerUnit = safeQuantity > 0 ? safeInvested / safeQuantity : 0;
  const safeHistory = Array.isArray(asset.history) ? asset.history : [];

  return (
    <div className={`${styles.assetCard} ${isExpanded ? styles.activeCard : ""}`}>
      <div className={styles.rowGrid} onClick={() => onToggle(asset.id)}>
        {/* Asset identity */}
        <div className={styles.cell}>
          <div className={styles.assetIdentity}>
            <span className={styles.avatar}>{asset.icon || "🪙"}</span>
            <div className={styles.identityTextStack}>
              <h3 className={styles.assetName}>{asset.name || "Untitled Asset"}</h3>
              <span className={styles.ticker}>{asset.symbol || "ASSET"}</span>
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className={styles.cell}>
          <div className={styles.dataStack}>
            <span className={styles.primaryNumber}>
              {safeQuantity} <span className={styles.inlineTickerSymbol}>{asset.symbol || ""}</span>
            </span>
            <span className={styles.secondaryLabel}>owned</span>
          </div>
        </div>

        {/* Total Invested */}
        <div className={styles.cell}>
          <div className={styles.dataStack}>
            <span className={styles.primaryValueNumber}>
              {formatAmount(safeInvested, sourceCurrency)}
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
            <span className={styles.secondarySpentLabel}>per {asset.symbol || "unit"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.cell} style={{ justifyContent: "flex-end" }}>
          <div className={styles.actionsGroup}>
            {onEdit && (
              <button
                type="button"
                className={styles.iconBtn}
                title="Edit this item"
                aria-label={`Edit ${asset.name || "asset"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(asset);
                }}
              >
                <PencilIcon />
              </button>
            )}
            <button
              type="button"
              className={styles.iconBtn}
              title="Delete this item"
              aria-label={`Delete ${asset.name || "asset"}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.id);
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

      {/* EXPANDED DRAWER */}
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
                &quot;{asset.userNote || "No notes saved for this item yet."}&quot;
              </p>
            </div>
          </div>

          {/* Timeline Section */}
          <div className={styles.historySection}>
            <div className={styles.historySectionTitleLine}>
              <HistoryIcon />
              <h4 className={styles.historySectionTitle}>Activity History</h4>
            </div>

            <div className={styles.modernTimelineContainer}>
              <div className={styles.timelineTrack} />

              {safeHistory.length > 0 ? (
                safeHistory.map((item, hIndex) => {
                  const historyItem = item as unknown as SafeHistoryNode;
                  const isInitial = historyItem.title?.includes("Initial");

                  const rawQuantityNumber = parseFloat(String(historyItem.amountAtTime || "0"));
                  const safeRawQuantity = isNaN(rawQuantityNumber) ? 0 : rawQuantityNumber;
                  const rawInvested = Number(historyItem.investedAtTime || 0);

                  let investedAmount = rawInvested;
                  if (asset.originalCurrency && asset.originalCurrency !== sourceCurrency) {
                    investedAmount = convertAmount(rawInvested, asset.originalCurrency, sourceCurrency);
                  }

                  const executionPrice = safeRawQuantity > 0 ? investedAmount / safeRawQuantity : 0;
                  const uniqueHistoryKey = historyItem.id || `history-${hIndex}`;

                  return (
                    <div key={uniqueHistoryKey} className={styles.timelineNode}>
                      <div className={`${styles.timelineDot} ${isInitial ? styles.dotInitial : styles.dotUpdate}`}>
                        {isInitial ? <RocketIcon /> : <ActivityIcon />}
                      </div>

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
                            <span className={styles.receiptValue}>{historyItem.amountAtTime ?? "0"}</span>
                          </div>

                          <div className={styles.receiptCell}>
                            <span className={styles.receiptLabel}>Total Spent</span>
                            <span className={styles.receiptValue}>
                              {historyItem.investedAtTime !== undefined
                                ? formatAmount(investedAmount, sourceCurrency)
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
});

/* ==========================================================================
   === SECTION 3: MAIN TABLE COMPONENT ===
   ========================================================================== */
export function VaultAssetTable({
  assets,
  onDeleteAsset,
  onEditClick,
  sourceCurrency,
  onAddAssetClick,
}: VaultAssetTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const safeAssets = Array.isArray(assets) ? assets : [];

  if (safeAssets.length === 0) {
    return (
      <section className={styles.container}>
        <div className={styles.emptyStateWrapper}>
          <div className={styles.emptyStateGlassCard}>
            <div className={styles.emptyStateIconWrapper}>
              <RocketIcon />
            </div>
            <h3 className={styles.emptyStateHeadline}>Your Vault Awaits</h3>
            <p className={styles.emptyStateSubtext}>
              Track your stocks, crypto, and other investments in one secure place. Start building your portfolio today.
            </p>
            {onAddAssetClick && (
              <button
                type="button"
                className={styles.emptyStateCtaBtn}
                onClick={onAddAssetClick}
              >
                <PlusIcon />
                <span>Add Your First Investment</span>
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

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
        {safeAssets.map((asset) => (
          <MemoizedAssetRow
            key={asset.id}
            asset={asset}
            isExpanded={expandedId === asset.id}
            onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
            onEdit={onEditClick}
            onDelete={onDeleteAsset}
            sourceCurrency={sourceCurrency}
          />
        ))}
      </div>
    </section>
  );
}