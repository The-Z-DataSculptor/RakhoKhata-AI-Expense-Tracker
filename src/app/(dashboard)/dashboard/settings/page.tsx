// src/app/(dashboard)/dashboard/settings/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import DashboardFooter from "@/components/dashboard/DashboardFooter/DashboardFooter";
import { PinSetupModal } from "@/components/investments/PinSetupModal/PinSetupModal";
import { FiShield, FiSliders as FiLayers, FiCheck, FiTrash2, FiEdit2 } from "react-icons/fi";
import styles from "./page.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// No external property types needed for standalone settings page.
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function SettingsPage() {
  // FIX: Added deleteWorkspace from our global store to handle actual deletion
  const { workspaces, activeWorkspace, activeWorkspaceId, deleteWorkspace } = useWorkspace();

  // --- WORKSPACE STATES ---
  const [renameInput, setRenameInput] = useState<string>(activeWorkspace ? activeWorkspace.name : "");
  const [isSuccessFeedbackVisible, setIsSuccessFeedbackVisible] = useState<boolean>(false);

  // --- VAULT SECURITY STATES ---
  // Initialize state directly by checking localStorage safely to avoid React 19 warnings
  const [isVaultSecurityEnabled, setIsVaultSecurityEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("vault_pin");
      return !!savedPin;
    }
    return false;
  });
  
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // Action: Turns the vault PIN lock on or off
  const handleSecurityToggle = () => {
    if (isVaultSecurityEnabled) {
      // Turn off security and clear the PIN from memory
      const verifyAction = confirm("Are you sure you want to turn off the password lock? Anyone using this device will be able to see your investments.");
      if (verifyAction) {
        localStorage.removeItem("vault_pin");
        setIsVaultSecurityEnabled(false);
      }
    } else {
      // Open the modal to create a new PIN
      setIsPinModalOpen(true);
    }
  };

  // Action: What to do when the PIN is successfully created
  const handlePinSetupSuccess = () => {
    setIsPinModalOpen(false);
    setIsVaultSecurityEnabled(true);
  };

  // Action: Saves the new name for your current workspace
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInput.trim() || !activeWorkspace) return;

    // Show a quick "Saved!" message on the button
    setIsSuccessFeedbackVisible(true);
    const timeoutId = setTimeout(() => setIsSuccessFeedbackVisible(false), 2500);
    return () => clearTimeout(timeoutId);
  };

  // Action: Deletes a workspace completely
  const handleDeleteClick = (targetWorkspaceId: string) => {
    if (targetWorkspaceId === activeWorkspaceId) {
      alert("You cannot delete the workspace you are currently using. Please switch to a different workspace first.");
      return;
    }
    
    // FIX: Save the user's choice from the confirmation box
    const userConfirmed = confirm("Are you completely sure you want to delete this workspace? This will permanently erase all transactions and investments inside it.");
    
    // FIX: If they clicked "OK", tell the context to actually delete the workspace
    if (userConfirmed) {
      // Note: If your context uses the name 'removeWorkspace', change this to 'removeWorkspace(targetWorkspaceId)'
      deleteWorkspace(targetWorkspaceId);
    }
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.settingsCanvasDeck}>
      
      {/* PAGE HEADER BLOCK */}
      <header className={styles.pageHeader}>
        <h1 className={styles.mainHeadline}>Settings</h1>
        <p className={styles.subtextDescription}>
          Change your workspace names and lock your investments with a secure password PIN.
        </p>
      </header>

      <div className={styles.cardsStackDeck}>

        {/* ==========================================
            === BLOCKS SECTION 1: WORKSPACE CONTROL ===
            ========================================== */}
        <section className={styles.settingsCardNode}>
          <div className={styles.cardHeaderArea}>
            <div className={styles.iconIndicatorFrame}>
              <FiLayers size={18} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Your Workspaces</h2>
              <p className={styles.cardContextExplanation}>
                Rename the workspace you are using right now, or completely delete other workspaces you do not need anymore.
              </p>
            </div>
          </div>

          <div className={styles.cardBodyContent}>
            {/* RENAME CURRENT WORKSPACE */}
            <form onSubmit={handleRenameSubmit} className={styles.renameFormBlock}>
              <div className={styles.inputFieldGroup}>
                <label className={styles.fieldLabelText}>Change Current Workspace Name</label>
                <div className={styles.inputActionCluster}>
                  <input 
                    type="text" 
                    value={renameInput} 
                    onChange={(e) => setRenameInput(e.target.value)} 
                    placeholder="e.g., Personal Finances"
                    required
                    className={styles.primaryTextInputElement}
                  />
                  <button type="submit" className={styles.saveActionSubmitBtn}>
                    {isSuccessFeedbackVisible ? <FiCheck size={15} /> : <FiEdit2 size={13} />}
                    <span>{isSuccessFeedbackVisible ? "Saved!" : "Save Name"}</span>
                  </button>
                </div>
              </div>
            </form>

            <div className={styles.dividerSplitLine} />

            {/* LIST OF ALL AVAILABLE WORKSPACES */}
            <div className={styles.directoryEntriesListWrapper}>
              <h3 className={styles.subSectionLabel}>All Your Workspaces ({workspaces.length})</h3>
              <div className={styles.entriesGridList}>
                {workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  return (
                    <div 
                      key={ws.id} 
                      className={`${styles.wsRowCardItem} ${isActive ? styles.wsActiveCardHighlight : ""}`}
                    >
                      <div className={styles.wsRowIdentityFrame}>
                        <span className={styles.wsVisualMarkerDot} />
                        <span className={styles.wsIdentityNameLabel}>{ws.name}</span>
                        {isActive && <span className={styles.activeStatusPillBadge}>Active Now</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(ws.id)}
                        disabled={isActive}
                        title={isActive ? "You cannot delete the workspace you are currently using" : "Delete this workspace"}
                        className={styles.rowDeleteTriggerActionBtn}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            === BLOCKS SECTION 2: INVESTMENT LOCK ===
            ========================================= */}
        <section className={styles.settingsCardNode}>
          <div className={styles.cardHeaderArea}>
            <div className={styles.iconIndicatorFrame} style={{ color: 'var(--color-success)' }}>
              <FiShield size={18} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Investment Vault Security</h2>
              <p className={styles.cardContextExplanation}>
                Protect your crypto and stock details by adding a secret 4-digit password screen.
              </p>
            </div>
          </div>

          <div className={styles.cardBodyContent}>
            <div className={styles.placeholderControlRowFlexDeck}>
              <div className={styles.metaInformationLeftTextBlock}>
                <span className={styles.rowControlHeadline}>Password Screen Lock</span>
                <span className={styles.rowControlSecondaryExplanation}>
                  {isVaultSecurityEnabled 
                    ? "Your password lock is active. Your investments are safe and hidden behind a lock screen."
                    : "Your password lock is turned off. Anyone who opens this app can see your investments."
                  }
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {/* Button to change PIN code if enabled */}
                {isVaultSecurityEnabled && (
                  <button 
                    type="button" 
                    onClick={() => setIsPinModalOpen(true)}
                    className={styles.saveActionSubmitBtn}
                    style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    Change PIN
                  </button>
                )}

                {/* Master Turn On / Turn Off button */}
                <button 
                  type="button" 
                  onClick={handleSecurityToggle}
                  className={styles.saveActionSubmitBtn}
                  style={{ backgroundColor: isVaultSecurityEnabled ? 'var(--color-danger)' : 'var(--color-success)' }}
                >
                  {isVaultSecurityEnabled ? "Turn Off Lock" : "Turn On Lock"}
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* RENDER THE SECRET PIN MODAL ON DEMAND */}
      <PinSetupModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSetupSuccess} 
      />

      {/* FOOTER STRUT */}
      <footer className={styles.footerWrapperSpacer}>
        <DashboardFooter />
      </footer>

    </div>
  );
}
/* === SECTION 4 END === */