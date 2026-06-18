// src/components/investments/VaultHeader/VaultHeader.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import styles from "./VaultHeader.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface VaultHeaderProps {
  /** Callback function triggered when a user clicks the add investment button */
  onAddInvestmentClick: () => void;
  /** Callback function triggered when a user clicks to setup the 4-digit PIN */
  onSetupPinClick?: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function VaultHeader({ onAddInvestmentClick, onSetupPinClick }: VaultHeaderProps) {
  return (
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
    <header className={styles.headerLayoutRow}>
      
      {/* LEFT SIDE: TITLES WITH MODERN STRATIFIED WEIGHTS */}
      <div className={styles.titleMetaBlock}>
        <h1 className={styles.mainTitleHeading}>Investment Vault</h1>
        <p className={styles.subtextMetaDescription}>
          Keep track of your stocks, crypto, and other investments all in one place
        </p>
      </div>

      {/* RIGHT SIDE: CALL-TO-ACTION BUTTONS */}
      <div className={styles.actionControlWrapper}>
        
        {/* SECONDARY ACTION: VAULT PIN LOCK SETUP */}
        <button 
          type="button" 
          className={styles.lockSetupBtn} 
          onClick={onSetupPinClick}
          title="Secure your vault with a 4-digit PIN"
        >
          {/* Crisp SVG Padlock Icon */}
          <svg 
            className={styles.buttonIconGraphic} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className={styles.buttonTextLabel}>Enable Lock</span>
        </button>

        {/* PRIMARY ACTION: ADD INVESTMENT */}
        <button 
          type="button" 
          className={styles.addAssetRecordBtn} 
          onClick={onAddInvestmentClick}
        >
          {/* Crisp Plus Icon */}
          <svg 
            className={styles.buttonIconGraphic} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className={styles.buttonTextLabel}>Add Investment</span>
        </button>
      </div>

    </header>
  );
}
/* === SECTION 4 END === */