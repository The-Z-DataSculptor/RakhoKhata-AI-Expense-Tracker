// src/components/forms/CreateWorkspaceModal/CreateWorkspaceModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useCallback } from "react"; 
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; // Connecting directly to the backend context brain
import { toast } from "sonner"; // Notification popups to deliver immediate visual feedback
import styles from "./CreateWorkspaceModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CreateWorkspaceModalProps {
  onClose: () => void; // A function passed from the Sidebar to tell this form how to close itself
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  // Connect to our global context state engine to tap the async database connection route
  const { createWorkspace } = useWorkspace();
  
  // --- LOCAL FORM STATES ---
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>( "");
  const [currency, setCurrency] = useState<string>("USD"); // Universal baseline standard default
  const [isPending, setIsPending] = useState<boolean>(false); // Loading tracker to disable buttons during fetch rounds

  // Action: What happens when the user clicks "Create Workspace"
  const handleCreateWorkspaceSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing the whole browser window
    
    // Safety check: Don't let users send whitespace strings to Neon Cloud
    if (!newWorkspaceName.trim()) return;
    
    try {
      setIsPending(true); // Freeze form inputs to lock out multi-click double-creation bugs

      // Dispatch the backend network pipeline handshake via context parameters
      await createWorkspace(newWorkspaceName.trim(), currency);
      
      // Clear out local state properties safely
      setNewWorkspaceName("");
      
      // Close out the popup viewport layout overlay frame
      onClose();
    } catch (error) {
      console.error("Workspace deployment routine tracking failure:", error);
      toast.error("Could not build a new workspace environment safely.");
    } finally {
      setIsPending(false); // Re-open control toggles if a pipeline exception occurs
    }
  }, [newWorkspaceName, currency, createWorkspace, onClose]);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        
        <h3 className={styles.modalTitle}>Create New Workspace</h3>
        <p className={styles.modalDescription}>
          Set up a separate environment for a new business, project, or goal. Data is completely isolated between workspaces.
        </p>
        
        <form onSubmit={handleCreateWorkspaceSubmit}>
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
              {/* FIXED: Formatted options stack array matching your exact future API keys blueprint */}
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