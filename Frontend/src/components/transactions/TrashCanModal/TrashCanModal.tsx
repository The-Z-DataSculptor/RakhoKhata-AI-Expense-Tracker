// Frontend/src/components/transactions/TrashCanModal/TrashCanModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import {
  FiTrash2,
  FiRotateCcw,
  FiAlertTriangle,
  FiX,
  FiLoader,
  FiInbox,
} from "react-icons/fi";
import { Transaction, transactionService } from "@/utils/api";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { toast } from "sonner";
import styles from "./TrashCanModal.module.css";

interface TrashCanModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  onLedgerChange: () => Promise<void>;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: COMPONENT LOGIC ===
   ========================================================================== */
export default function TrashCanModal({
  isOpen,
  onClose,
  workspaceId,
  onLedgerChange,
}: TrashCanModalProps) {
  const [trashedItems, setTrashedItems] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Safety confirmation dialog state
  const [confirmTarget, setConfirmTarget] = useState<{
    type: "SINGLE" | "ALL";
    id?: string;
    description?: string;
  } | null>(null);

  const { formatAmount } = useCurrency();

  // Load trashed records asynchronously without synchronous top-level setState
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    let isCancelled = false;

    const fetchTrashedRecords = async () => {
      setIsLoading(true);
      try {
        const res = await transactionService.getTrash(workspaceId);
        if (!isCancelled) {
          setTrashedItems(Array.isArray(res?.trashed) ? res.trashed : []);
        }
      } catch (error: unknown) {
        if (!isCancelled) {
          const msg = error instanceof Error ? error.message : "Failed to load recycle bin.";
          toast.error(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchTrashedRecords();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, workspaceId]);

  const handleRestore = async (id: string) => {
    setActiveActionId(id);
    try {
      await transactionService.restore(id);
      setTrashedItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Transaction restored to active ledger.");
      await onLedgerChange();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to restore.";
      toast.error(msg);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleExecutePermanentDelete = async () => {
    if (!confirmTarget) return;

    if (confirmTarget.type === "SINGLE" && confirmTarget.id) {
      const targetId = confirmTarget.id;
      setActiveActionId(targetId);
      try {
        await transactionService.permanentDelete(targetId);
        setTrashedItems((prev) => prev.filter((item) => item.id !== targetId));
        toast.success("Transaction permanently erased.");
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to delete.";
        toast.error(msg);
      } finally {
        setActiveActionId(null);
        setConfirmTarget(null);
      }
    } else if (confirmTarget.type === "ALL" && workspaceId) {
      setIsLoading(true);
      try {
        const res = await transactionService.emptyTrash(workspaceId);
        setTrashedItems([]);
        toast.success(res.message || "Recycle bin emptied.");
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to empty trash.";
        toast.error(msg);
      } finally {
        setIsLoading(false);
        setConfirmTarget(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlayBackdrop} onClick={onClose}>
      <div
        className={styles.modalContentCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconCircle}>
              <FiTrash2 className={styles.trashIcon} />
            </div>
            <div>
              <h3 className={styles.modalMainTitle}>Recycle Bin</h3>
              <p className={styles.modalSubTitle}>
                Items are permanently purged after 15 days.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeIconButton}
            onClick={onClose}
            aria-label="Close Recycle Bin"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.centerLoadingState}>
              <FiLoader className={styles.spinnerIcon} />
              <p>Scanning recycle bin...</p>
            </div>
          ) : trashedItems.length === 0 ? (
            <div className={styles.emptyTrashState}>
              <div className={styles.emptyIconCircle}>
                <FiInbox size={32} />
              </div>
              <h4>Recycle Bin is Empty</h4>
              <p>Any deleted transactions will wait here for 15 days before permanent removal.</p>
            </div>
          ) : (
            <div className={styles.trashItemsList}>
              {trashedItems.map((item) => {
                const isWorking = activeActionId === item.id;
                const formattedDate = item.date ? String(item.date).substring(0, 10) : "";
                const isIncome = (item.type || "").toUpperCase() === "INCOME";

                return (
                  <div key={item.id} className={styles.trashCardRow}>
                    <div className={styles.itemMetaLeft}>
                      <span className={styles.itemTitle} title={item.description}>
                        {item.description || "Untitled Transaction"}
                      </span>
                      <div className={styles.itemSubDetailLine}>
                        <span className={styles.categoryBadge}>
                          {item.category?.name || "General"}
                        </span>
                        <span className={styles.dotDivider}>•</span>
                        <span className={styles.dateLabel}>{formattedDate}</span>
                      </div>
                    </div>

                    <div className={styles.itemActionsRight}>
                      <span
                        className={`${styles.amountText} ${
                          isIncome ? styles.incomeAccent : styles.expenseAccent
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatAmount(
                          Number(item.originalAmount || item.amount || 0),
                          item.originalCurrency || "PKR"
                        )}
                      </span>

                      <div className={styles.actionButtonsDock}>
                        <button
                          type="button"
                          className={styles.restoreBtn}
                          disabled={isWorking}
                          onClick={() => handleRestore(item.id)}
                          title="Restore to ledger"
                        >
                          <FiRotateCcw size={13} />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          className={styles.permDeleteBtn}
                          disabled={isWorking}
                          onClick={() =>
                            setConfirmTarget({
                              type: "SINGLE",
                              id: item.id,
                              description: item.description,
                            })
                          }
                          title="Erase forever"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={styles.modalFooter}>
          <span className={styles.itemCountText}>
            {trashedItems.length} {trashedItems.length === 1 ? "record" : "records"} in bin
          </span>
          <div className={styles.footerButtonsGroup}>
            {trashedItems.length > 0 && (
              <button
                type="button"
                className={styles.emptyAllBtn}
                disabled={isLoading}
                onClick={() => setConfirmTarget({ type: "ALL" })}
              >
                Empty Bin Forever
              </button>
            )}
            <button
              type="button"
              className={styles.closeFooterBtn}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>

        {/* SAFETY CONFIRMATION OVERLAY */}
        {confirmTarget && (
          <div className={styles.confirmBackdrop}>
            <div className={styles.confirmCard}>
              <div className={styles.warningIconBadge}>
                <FiAlertTriangle size={24} />
              </div>
              <h4 className={styles.confirmTitle}>
                {confirmTarget.type === "ALL"
                  ? "Empty Entire Recycle Bin?"
                  : "Permanently Delete Record?"}
              </h4>
              <p className={styles.confirmText}>
                {confirmTarget.type === "ALL"
                  ? `This will permanently erase all ${trashedItems.length} transactions from the database. This action cannot be undone.`
                  : `Are you sure you want to permanently erase "${confirmTarget.description || "this transaction"}"? It cannot be recovered.`}
              </p>
              <div className={styles.confirmActionsRow}>
                <button
                  type="button"
                  className={styles.cancelConfirmBtn}
                  onClick={() => setConfirmTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.dangerConfirmBtn}
                  onClick={handleExecutePermanentDelete}
                >
                  Yes, Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}