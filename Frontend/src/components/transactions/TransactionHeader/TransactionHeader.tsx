// src/components/transactions/TransactionHeader/TransactionHeader.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect, useRef } from "react";
import { FiPlus, FiUpload, FiCamera, FiFileText, FiChevronDown, FiZap } from "react-icons/fi"; // 🚀 FIXED: Swapped out non-existent FiSparkles for FiZap
import styles from "./TransactionHeader.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface TransactionHeaderProps {
  onAddTransactionClick: () => void;
  onImportClick: () => void; 
  onFileScannerSelect: () => void;   
  onCameraScannerSelect: () => void; 
  totalCount: number;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function TransactionHeader({ 
  onAddTransactionClick, 
  onImportClick, 
  onFileScannerSelect,
  onCameraScannerSelect,
  totalCount 
}: TransactionHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeCount = totalCount !== undefined && totalCount !== null ? totalCount : 0;
  const entryLabelText = safeCount === 1 ? "1 entry tracked" : `${safeCount.toLocaleString()} entries tracked`;

  // Shuts the dropdown layer instantly if clicking completely outside the menu block
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    /* ==========================================================================
       === SECTION 4: RENDER (JSX) ===
       ========================================================================== */
    <header className={styles.glassFloatingDeck}>
      
      {/* LEFT ASPECT: IDENTITY AND PULSING STATUS HUB */}
      <div className={styles.brandingBlock}>
        <h1 className={styles.ledgerMainTitle}>Transactions</h1>
        
        <div className={styles.statusBadgePill}>
          <span className={styles.emeraldGlowDot} aria-hidden="true" />
          <span className={styles.statusBadgeText}>Ledger Engine Synced</span>
        </div>
      </div>

      {/* RIGHT ASPECT: METADATA AND CTA BUTTON ROW */}
      <div className={styles.interactiveBlock}>
        <span className={styles.counterMetaSummary}>
          {entryLabelText}
        </span>
        
        <div className={styles.actionButtonGroup}>
          {/* Absolute-Anchored AI Scanner Dropdown Component Module */}
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              type="button"
              className={styles.secondaryActionPill}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="menu"
              aria-label="Open AI receipt scanning utility options"
            >
              <FiZap size={16} className={styles.sparkleAiVector} /> {/* 🚀 FIXED: Using valid FiZap token icon */}
              <span>AI Scanner</span>
              <FiChevronDown 
                size={14} 
                className={`${styles.arrowIcon} ${isDropdownOpen ? styles.arrowRotate : ""}`} 
              />
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu} role="menu">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => {
                    onFileScannerSelect();
                    setIsDropdownOpen(false);
                  }}
                >
                  <FiFileText size={14} />
                  <span>Upload Document</span>
                </button>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => {
                    onCameraScannerSelect();
                    setIsDropdownOpen(false);
                  }}
                >
                  <FiCamera size={14} />
                  <span>Use Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Import Statement Action Trigger for CSV/Spreadsheets */}
          <button
            type="button"
            className={styles.secondaryActionPill}
            onClick={onImportClick}
            aria-label="Import transactions from CSV or Excel statements"
          >
            <FiUpload size={16} />
            <span>Import Sheet</span>
          </button>

          <button
            type="button"
            className={styles.premiumActionPill}
            onClick={onAddTransactionClick}
            aria-label="Create a new transaction asset record"
          >
            <FiPlus size={16} className={styles.buttonPlusVector} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

    </header>
  );
}