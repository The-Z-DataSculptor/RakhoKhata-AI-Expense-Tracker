// src/components/transactions/TransactionHeader/TransactionHeader.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState, useEffect, useRef } from "react";
import { FiPlus, FiUpload, FiCamera, FiFileText, FiChevronDown, FiZap } from "react-icons/fi";
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
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export default function TransactionHeader({ 
  onAddTransactionClick, 
  onImportClick, 
  onFileScannerSelect,
  onCameraScannerSelect,
  totalCount 
}: TransactionHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Safe fallback calculation for record counters
  const safeCount = Math.max(0, Number(totalCount) || 0);
  const entryLabelText = safeCount === 1 ? "1 entry tracked" : `${safeCount.toLocaleString()} entries tracked`;

  // Dismisses dropdown menu when user clicks anywhere outside the container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleFileSelect = () => {
    onFileScannerSelect();
    setIsDropdownOpen(false);
  };

  const handleCameraSelect = () => {
    onCameraScannerSelect();
    setIsDropdownOpen(false);
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: EXPORTS / RENDER COMPONENT ===
     ========================================================================== */
  return (
    <header className={styles.glassFloatingDeck}>
      
      {/* BRANDING HUB & STATUS METRICS */}
      <div className={styles.brandingBlock}>
        <div className={styles.titleWithBadgeRow}>
          <h1 className={styles.ledgerMainTitle}>Transactions</h1>
          <div className={styles.statusBadgePill}>
            <span className={styles.emeraldGlowDot} aria-hidden="true" />
            <span className={styles.statusBadgeText}>Synced</span>
          </div>
        </div>
        <span className={styles.counterMetaSummary}>
          {entryLabelText}
        </span>
      </div>

      {/* ACTION INTERACTION BUTTON STACK */}
      <div className={styles.interactiveBlock}>
        <div className={styles.actionButtonGroup}>
          
          {/* PRIMARY CTA: CREATE TRANSACTION ENTRY */}
          <button
            type="button"
            className={styles.premiumActionPill}
            onClick={onAddTransactionClick}
            aria-label="Create a new transaction record"
          >
            <FiPlus size={16} className={styles.buttonPlusVector} />
            <span>Add Transaction</span>
          </button>

          {/* SECONDARY ACTIONS GRID */}
          <div className={styles.secondaryActionsGrid}>
            
            {/* AI RECEIPT SCANNER DROPDOWN MODULE */}
            <div className={styles.dropdownContainer} ref={dropdownRef}>
              <button
                type="button"
                className={styles.secondaryActionPill}
                onClick={toggleDropdown}
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                aria-label="Open AI receipt scanning options"
              >
                <FiZap size={16} className={styles.sparkleAiVector} />
                <span>AI Scanner</span>
                <FiChevronDown 
                  size={14} 
                  className={`${styles.arrowIcon} ${isDropdownOpen ? styles.arrowRotate : ""}`} 
                />
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdownMenu} role="menu" aria-label="AI Scanner Options">
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={handleFileSelect}
                  >
                    <FiFileText size={15} />
                    <span>Upload Document</span>
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={handleCameraSelect}
                  >
                    <FiCamera size={15} />
                    <span>Use Camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* SPREADSHEET IMPORTER BUTTON */}
            <button
              type="button"
              className={styles.secondaryActionPill}
              onClick={onImportClick}
              aria-label="Import transactions from CSV or Excel statements"
            >
              <FiUpload size={16} />
              <span>Import Sheet</span>
            </button>
          </div>

        </div>
      </div>

    </header>
  );
}
/* === SECTION 4 END === */