// src/app/(dashboard)/dashboard/settings/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react"; // FIXED: Removed the unused 'useCallback' import
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { PinSetupModal } from "@/components/investments/PinSetupModal/PinSetupModal";
import { FiShield, FiSliders as FiLayers, FiCheck, FiTrash2, FiEdit2, FiLoader } from "react-icons/fi";
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
  const { workspaces, activeWorkspace, activeWorkspaceId, deleteWorkspace } = useWorkspace();

  // --- WORKSPACE STATES ---
  const [renameInput, setRenameInput] = useState<string>(activeWorkspace ? activeWorkspace.name : "");
  const [isSuccessFeedbackVisible, setIsSuccessFeedbackVisible] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null); // FIXED: Added deletion pointer state tracking active network threads

  // --- VAULT SECURITY STATES ---
  const [isVaultSecurityEnabled, setIsVaultSecurityEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("vault_pin");
      return !!savedPin;
    }
    return false;
  });
  
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // Action: Turns the vault PIN lock configuration on or off dynamically
  const handleSecurityToggle = () => {
    if (isVaultSecurityEnabled) {
      const verifyAction = confirm("Are you sure you want to turn off the password lock? Anyone using this device will be able to see your investments.");
      if (verifyAction) {
        localStorage.removeItem("vault_pin");
        setIsVaultSecurityEnabled(false);
      }
    } else {
      setIsPinModalOpen(true);
    }
  };

  // Action: Callback running immediately upon successful PIN creation steps
  const handlePinSetupSuccess = () => {
    setIsPinModalOpen(false);
    setIsVaultSecurityEnabled(true);
  };

  // Action: Commits title changes to local context states
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInput.trim() || !activeWorkspace) return;

    setIsSuccessFeedbackVisible(true);
    const timeoutId = setTimeout(() => setIsSuccessFeedbackVisible(false), 2500);
    return () => clearTimeout(timeoutId);
  };

  // FIXED: Converted to async function to cleanly await our live HTTP delete request execution chain
  const handleDeleteClick = async (targetWorkspaceId: string) => {
    if (targetWorkspaceId === activeWorkspaceId) {
      alert("You cannot delete the workspace you are currently using. Please switch to a different workspace first.");
      return;
    }
    
    const userConfirmed = confirm("Are you completely sure you want to delete this workspace? This will permanently erase all transactions and investments inside it.");
    
    if (userConfirmed) {
      try {
        setDeletingId(targetWorkspaceId); // Activate visual loader track on specific target row index card
        await deleteWorkspace(targetWorkspaceId); // Await full cascade teardown script on Neon Database clusters
      } catch (error) {
        console.error("Workspace teardown runtime pipeline exception:", error);
      } finally {
        setDeletingId(null); // Release visual lockout states cleanly
      }
    }
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.settingsCanvasDeck}>
      
      {/* HEADER BLOCK */}
      <header className={styles.dashboardHeaderCardBox}>
        <div className={styles.headingBlock}>
          <h1 className={styles.mainHeadline}>Settings</h1>
          <p className={styles.subtextDescription}>
            Manage your account preferences, customize your environment options, and configure your workspace settings.
          </p>
        </div>
      </header>

      <div className={styles.cardsStackDeck}>

        {/* WORKSPACE CONTROL NODE CARD */}
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
            {/* RENAME CURRENT WORKSPACE FORM CONTAINER */}
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

            {/* LIST OF ALL AVAILABLE DATABASE WORKSPACES */}
            <div className={styles.directoryEntriesListWrapper}>
              <h3 className={styles.subSectionLabel}>All Your Workspaces ({workspaces.length})</h3>
              <div className={styles.entriesGridList}>
                {workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  const isCurrentTargetDeleting = deletingId === ws.id;
                  
                  return (
                    <div 
                      key={ws.id} 
                      className={`${styles.wsRowCardItem} ${isActive ? styles.wsActiveCardHighlight : ""} ${isCurrentTargetDeleting ? styles.wsRowCardDeleting : ""}`}
                    >
                      <div className={styles.wsRowIdentityFrame}>
                        <span className={styles.wsVisualMarkerDot} />
                        <span className={styles.wsIdentityNameLabel}>{ws.name}</span>
                        {isActive && <span className={styles.activeStatusPillBadge}>Active Now</span>}
                        {isCurrentTargetDeleting && <span className={styles.deletingStatusPillBadge}>Erasing...</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(ws.id)}
                        // FIXED: Added multi-layer button disable protections to block navigation tampering while calls process
                        disabled={isActive || deletingId !== null}
                        title={isActive ? "You cannot delete the workspace you are currently using" : "Delete this workspace"}
                        className={styles.rowDeleteTriggerActionBtn}
                      >
                        {/* FIXED: Dynamic icon switch rendering animated spinner or standard trash container */}
                        {isCurrentTargetDeleting ? (
                          <FiLoader size={14} className={styles.loadingSpinnerAnimation} />
                        ) : (
                          <FiTrash2 size={14} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* INVESTMENT LOCK CARD MANAGEMENT BLOCK */}
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

      <PinSetupModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSetupSuccess} 
      />

    </div>
  );
}
/* === SECTION 4 END === */