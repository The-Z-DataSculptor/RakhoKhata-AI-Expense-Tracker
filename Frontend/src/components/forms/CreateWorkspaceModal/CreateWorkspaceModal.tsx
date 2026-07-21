// src/components/forms/CreateWorkspaceModal/CreateWorkspaceModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState, useCallback } from "react"; 
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; // Connecting directly to the backend context brain
import { toast } from "sonner"; // Notification popups to deliver immediate visual feedback
import styles from "./CreateWorkspaceModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
interface CreateWorkspaceModalProps {
  // A callback routine passed from the parent component to trigger closure of the view overlay
  onClose: () => void; 
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export default function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  // Connect to our global context state engine to access the async database pipeline connection
  const { createWorkspace } = useWorkspace();
  
  // --- LOCAL FORM COMPONENT STATES ---
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD"); // Universal baseline standard default currency
  const [isPending, setIsPending] = useState<boolean>(false); // Tracking state to lock controls during active server communications

  /**
   * Dispatches the workspace generation parameters to the database context brain.
   * Wrapped in useCallback to preserve memory reference space across rerenders.
   */
  const handleCreateWorkspaceSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the browser from executing a hard window layout refresh
    
    const sanitizedName = newWorkspaceName.trim();

    // Safety check: Avoid broadcasting empty spaces or void text fields to the database layer
    if (!sanitizedName) {
      toast.error("Workspace name cannot be empty.");
      return;
    }
    
    try {
      setIsPending(true); // Freeze form inputs immediately to isolate against multi-click double-creation pipeline bugs

      // Dispatch the backend network handshake via custom workspace context arguments
      await createWorkspace(sanitizedName, currency);
      
      // Clear out local state properties safely upon clean synchronization
      setNewWorkspaceName("");
      
      // Display a clear confirmation banner notification to the user
      toast.success("Workspace environment built cleanly!");
      
      // Close out the popup viewport layout overlay frame
      onClose();
    } catch (error: unknown) {
      // Log full detailed telemetry privately to developer traces while showing clean generic errors to users
      console.error("Workspace deployment routine tracking failure:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected storage engine failure occurred.";
      toast.error(`Failed to construct environment: ${errorMessage}`);
    } finally {
      setIsPending(false); // Release control toggles safely when execution rounds finish
    }
  }, [newWorkspaceName, currency, createWorkspace, onClose]);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTS / RENDER COMPONENT ===
   ========================================================================== */
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        
        <h3 className={styles.modalTitle}>Create New Workspace</h3>
        <p className={styles.modalDescription}>
          Set up a separate environment for a new business, project, or goal. Data is completely isolated between workspaces.
        </p>
        
        <form onSubmit={handleCreateWorkspaceSubmit} noValidate>
          {/* FIELD 1: WORKSPACE DESIGNATION INPUT ROW */}
          <div className={styles.inputGroup}>
            <label htmlFor="workspaceName">Workspace Name</label>
            <input 
              id="workspaceName"
              type="text" 
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g., Real Estate Side Hustle"
              disabled={isPending} 
              maxLength={50} // Hard payload limit constraint to safeguard against database cell parsing strains
              autoFocus
              required
            />
          </div>

          {/* FIELD 2: SYSTEM DYNAMIC CURRENCY SELECTION DROP-DOWN BLOCK */}
          <div className={styles.inputGroup}>
            <label htmlFor="workspaceCurrency">Base Currency Mapping</label>
            <select
              id="workspaceCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isPending}
              className={styles.currencySelectField}
              required
            >
              <option value="USD">USD - United States Dollar ($)</option>
              <option value="PKR">PKR - Pakistani Rupee (Rs.)</option>
              <option value="EUR">EUR - Euro Zone (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="KWD">KWD - Kuwaiti Dinar</option>
              <option value="OMR">OMR - Omani Rial</option>
              <option value="QAR">QAR - Qatari Riyal</option>
              <option value="BHD">BHD - Bahraini Dinar</option>
            </select>
          </div>
          
          {/* MODAL BOTTOM BUTTON CONTROL ACTIONS AREA */}
          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose} 
              disabled={isPending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.confirmBtn}
              disabled={isPending || !newWorkspaceName.trim()}
            >
              {isPending ? "Deploying..." : "Create Workspace"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
/* === SECTION 4 END === */