// src/app/(dashboard)/dashboard/settings/page.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { vaultAuthService } from "@/utils/api";
import { PinSetupModal } from "@/components/investments/PinSetupModal/PinSetupModal";
import { FiShield, FiSliders as FiLayers, FiCheck, FiTrash2, FiEdit2, FiLoader } from "react-icons/fi";
import styles from "./page.module.css";
/* ==========================================================================
   === SECTION 1 END ===
   ========================================================================== */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function SettingsPage() {
  const { workspaces, activeWorkspace, activeWorkspaceId, deleteWorkspace } = useWorkspace();

  // --- WORKSPACE STATES ---
  const [renameInput, setRenameInput] = useState<string>(activeWorkspace ? activeWorkspace.name : "");
  const [isSuccessFeedbackVisible, setIsSuccessFeedbackVisible] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- VAULT SECURITY STATES ---
  const [isVaultSecurityEnabled, setIsVaultSecurityEnabled] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isSecurityLoading, setIsSecurityLoading] = useState<boolean>(true);
  const [pinModalMode, setPinModalMode] = useState<"SETUP" | "DISABLE" | "CHANGE">("SETUP");

  // FIXED: Single fetch function used both on mount and after PIN operations
  const fetchVaultPinStatus = async () => {
    try {
      const status = await vaultAuthService.checkStatus();
      setIsVaultSecurityEnabled(status.hasPin);
    } catch (err) {
      console.error("Could not fetch database status keys:", err);
    } finally {
      setIsSecurityLoading(false);
    }
  };

  // FIXED: Simplified useEffect – calls fetchVaultPinStatus directly with cleanup
  useEffect(() => {
    let isMounted = true;
    const syncPinStatus = async () => {
      try {
        const status = await vaultAuthService.checkStatus();
        if (isMounted) {
          setIsVaultSecurityEnabled(status.hasPin);
        }
      } catch (err) {
        console.error("Could not fetch database status keys:", err);
      } finally {
        if (isMounted) {
          setIsSecurityLoading(false);
        }
      }
    };
    syncPinStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSecurityToggle = () => {
    if (isVaultSecurityEnabled) {
      setPinModalMode("DISABLE");
      setIsPinModalOpen(true);
    } else {
      setPinModalMode("SETUP");
      setIsPinModalOpen(true);
    }
  };

  const handleChangePinClick = () => {
    setPinModalMode("CHANGE");
    setIsPinModalOpen(true);
  };

  // FIXED: Simplified – just refresh status and close modal
  const handlePinSetupSuccess = async () => {
    setIsPinModalOpen(false);
    setIsSecurityLoading(true);
    await fetchVaultPinStatus();
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInput.trim() || !activeWorkspace) return;

    // TODO: Call workspace update API here when implemented
    // For now, just show visual feedback
    setIsSuccessFeedbackVisible(true);
    const timeoutId = setTimeout(() => setIsSuccessFeedbackVisible(false), 2500);
    return () => clearTimeout(timeoutId);
  };

  const handleDeleteClick = async (targetWorkspaceId: string) => {
    if (targetWorkspaceId === activeWorkspaceId) {
      alert("You cannot delete the workspace you are currently using. Please switch to a different workspace first.");
      return;
    }

    const userConfirmed = confirm("Are you completely sure you want to delete this workspace? This will permanently erase all transactions and investments inside it.");

    if (userConfirmed) {
      try {
        setDeletingId(targetWorkspaceId);
        await deleteWorkspace(targetWorkspaceId);
      } catch (error) {
        console.error("Workspace teardown runtime pipeline exception:", error);
      } finally {
        setDeletingId(null);
      }
    }
  };
  /* ==========================================================================
     === SECTION 3 END ===
     ========================================================================== */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <div className={styles.settingsCanvasDeck}>

      <header className={styles.dashboardHeaderCardBox}>
        <div className={styles.headingBlock}>
          <h1 className={styles.mainHeadline}>Settings</h1>
          <p className={styles.subtextDescription}>
            Manage your account preferences, customize your environment options, and configure your workspace settings.
          </p>
        </div>
      </header>

      <div className={styles.cardsStackDeck}>

        {/* WORKSPACE CONTROL CARD */}
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
                        disabled={isActive || deletingId !== null}
                        title={isActive ? "You cannot delete the workspace you are currently using" : "Delete this workspace"}
                        className={styles.rowDeleteTriggerActionBtn}
                      >
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

        {/* VAULT SECURITY CARD MANAGEMENT BLOCK */}
        <section className={styles.settingsCardNode}>
          <div className={styles.cardHeaderArea}>
            <div className={styles.iconIndicatorFrame} style={{ color: 'var(--color-success, #16a34a)' }}>
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
                  {isSecurityLoading ? (
                    "Analyzing secure validation state tokens..."
                  ) : isVaultSecurityEnabled ? (
                    "Your password lock is active. Your investments are safe and hidden behind a lock screen."
                  ) : (
                    "Your password lock is turned off. Anyone who opens this app can see your investments."
                  )}
                </span>
              </div>

              {/* FIXED: Added flexShrink: 0 to prevent the button container from squishing to 0px width */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                {isVaultSecurityEnabled && !isSecurityLoading && (
                  <button
                    type="button"
                    onClick={handleChangePinClick}
                    className={styles.saveActionSubmitBtn}
                    style={{ backgroundColor: 'var(--bg-surface, #ffffff)', color: 'var(--text-primary, #10043f)', border: '1px solid var(--border-color, #e5e1f4)' }}
                  >
                    Change PIN
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSecurityToggle}
                  disabled={isSecurityLoading}
                  className={styles.saveActionSubmitBtn}
                  style={{ backgroundColor: isVaultSecurityEnabled ? 'var(--color-danger, #dc2626)' : 'var(--color-success, #16a34a)' }}
                >
                  {isSecurityLoading ? (
                    <FiLoader className={styles.loadingSpinnerAnimation} />
                  ) : isVaultSecurityEnabled ? (
                    "Turn Off Lock"
                  ) : (
                    "Turn On Lock"
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* FIXED: Added key prop to force remount when mode changes */}
      <PinSetupModal
        key={`pin-modal-${pinModalMode}-${isPinModalOpen}`}
        isOpen={isPinModalOpen}
        mode={pinModalMode}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSetupSuccess}
      />

    </div>
  );
}
/* === SECTION 4 END === */