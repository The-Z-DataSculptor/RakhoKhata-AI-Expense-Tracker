// src/components/forms/CreateWorkspaceModal/CreateWorkspaceModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useCallback } from "react"; // OPTIMIZED: Added useCallback to insulate event side-effects for the React Compiler
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext"; // Connecting directly to the Brain
import { toast } from "sonner"; // NEW: Imported the global notification engine hook
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
  // Connect to the global brain to get the creation function
  const { createWorkspace } = useWorkspace();
  
  // Local state just for this input field
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>("");

  // Action: What happens when the user clicks "Create Workspace"
  // OPTIMIZED: Wrapped in useCallback to declare this safely as an event handler block to the compiler
  const handleCreateWorkspaceSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing
    
    // Safety check: Don't create empty workspaces
    if (!newWorkspaceName.trim()) return;
    
    try {
      // 1. Tell the brain to create and switch to the new workspace
      // We pass "folder" as the default icon for now
      createWorkspace(newWorkspaceName.trim(), "folder");
      
      // NEW: Trigger micro-feedback message to instantly confirm workspace allocation
      toast.success("New accounting workspace deployed!");

      // 2. Clear the input text
      setNewWorkspaceName("");
      
      // 3. Tell the Sidebar to close this modal
      onClose();
    } catch (error) {
      console.error("Workspace deployment routine tracking failure:", error);
      // NEW: Inform user instantly if an operational environment generation failure occurs
      toast.error("Could not build a new workspace environment safely.");
    }
  }, [newWorkspaceName, createWorkspace, onClose]);
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
          <div className={styles.inputGroup}>
            <label>Workspace Name</label>
            <input 
              type="text" 
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g., Real Estate Side Hustle"
              autoFocus
              required
            />
          </div>
          
          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose} // Tells the Sidebar to hide this component
            >
              Cancel
            </button>
            <button type="submit" className={styles.confirmBtn}>
              Create Workspace
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
/* === SECTION 4 END === */