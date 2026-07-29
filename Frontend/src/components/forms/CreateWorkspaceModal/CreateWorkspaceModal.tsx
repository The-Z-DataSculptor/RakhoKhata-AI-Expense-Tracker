// src/components/forms/CreateWorkspaceModal/CreateWorkspaceModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState, useCallback, useEffect } from "react"; 
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { toast } from "sonner";
import styles from "./CreateWorkspaceModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
interface CreateWorkspaceModalProps {
  onClose: () => void; 
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export default function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspace();
  
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);

  // Listens for Escape key presses to dismiss modal accessibly.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  const handleCreateWorkspaceSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    
    const sanitizedName = newWorkspaceName.trim();

    if (!sanitizedName) {
      toast.error("Workspace name cannot be empty.");
      return;
    }
    
    try {
      setIsPending(true);
      await createWorkspace(sanitizedName, "USD");
      setNewWorkspaceName("");
      toast.success("Workspace created successfully!");
      onClose();
    } catch (error: unknown) {
      console.error("Workspace creation failure:", error);
      const errorMessage = error instanceof Error ? error.message : "Unexpected database error.";
      toast.error(`Failed to create workspace: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  }, [newWorkspaceName, createWorkspace, onClose, isPending]);
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: EXPORTS / RENDER COMPONENT ===
     ========================================================================== */
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <h3 className={styles.modalTitle}>Create New Workspace</h3>
        <p className={styles.modalDescription}>
          Set up a separate environment for a new business, project, or goal.
        </p>
        
        <form onSubmit={handleCreateWorkspaceSubmit} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="workspaceName">Workspace Name</label>
            <input 
              id="workspaceName"
              type="text" 
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g., Real Estate Side Hustle"
              disabled={isPending} 
              maxLength={50}
              autoFocus
              required
            />
          </div>
          
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