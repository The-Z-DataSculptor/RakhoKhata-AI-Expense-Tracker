// src/components/investments/VaultHeader/VaultHeader.tsx
"use client";

import React from "react";
import styles from "./VaultHeader.module.css";

interface VaultHeaderProps {
  /** Callback function triggered when a user clicks the add investment button */
  onAddInvestmentClick: () => void;
}

export function VaultHeader({ onAddInvestmentClick }: VaultHeaderProps) {
  return (
    <header className={styles.headerLayoutRow}>
      
      {/* LEFT SIDE: TITLES WITH MODERN STRATIFIED WEIGHTS */}
      <div className={styles.titleMetaBlock}>
        <h1 className={styles.mainTitleHeading}>Investment Vault</h1>
        <p className={styles.subtextMetaDescription}>
          Keep track of your stocks, crypto, and other investments all in one place
        </p>
      </div>

      {/* RIGHT SIDE: CALL-TO-ACTION BUTTON */}
      <div className={styles.actionControlWrapper}>
        <button 
          type="button" 
          className={styles.addAssetRecordBtn} 
          onClick={onAddInvestmentClick}
        >
          {/* Crisp, clean system vector tracking instead of a raw text character */}
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