"use client";

import React from "react";
import { DebtReminderForm } from "@/components/forms/DebtReminderForm/DebtReminderForm";
import { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import styles from "./DebtReminderModal.module.css";

interface DebtReminderModalProps {
  activeReminderTx: TransactionRecord | null;
  onClose: () => void;
}

export default function DebtReminderModal({ activeReminderTx, onClose }: DebtReminderModalProps) {
  if (!activeReminderTx) return null;

  return (
    <div className={styles.modalOverlayBackdrop} onClick={onClose}>
      <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
        <DebtReminderForm transaction={activeReminderTx} onCancel={onClose} />
      </div>
    </div>
  );
}