// src/app/(dashboard)/context/WorkspaceContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FiUser, FiBriefcase, FiFolder, FiStar, FiHexagon } from "react-icons/fi";
import { toast } from "sonner";
import { apiFetch } from "@/utils/api"; // Upgraded: Secure HttpOnly cross-origin fetch utility
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface Workspace {
  id: string;
  name: string;
  currency: string;  // Upgraded: Mapped to capture backend currency strings (e.g. PKR, GBP)
  iconName?: string; // Optional field computed dynamically from record names
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace | undefined; 
  isLoading: boolean; // Upgraded: Exposes loading status trackers for sidebar spinner states
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, currency?: string) => Promise<void>; // Upgraded: Returns a promise for loading forms
  deleteWorkspace: (id: string) => Promise<void>;                     // Upgraded: Connects directly to backend cascade delete channels
  renderIcon: (iconName: string, size?: number) => React.ReactNode; 
}

// 🚀 NEW: Declared typed backend response contracts to eliminate 'unknown' compiler bugs
interface FetchWorkspacesResponse {
  workspaces: Workspace[];
}

interface CreateWorkspaceResponse {
  workspace: Workspace;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE UTILITIES & ICON MAPPER ===
   ========================================================================== */
// Helper to automatically assign icons based on database workspace names
const assignDynamicIcon = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes("personal")) return "user";
  if (normalized.includes("business")) return "briefcase";
  return "folder";
};

// Maps text tags directly into React Icons components
const getIconComponent = (iconName: string, size: number = 18) => {
  switch (iconName) {
    case "user": return <FiUser size={size} />;
    case "briefcase": return <FiBriefcase size={size} />;
    case "folder": return <FiFolder size={size} />;
    case "star": return <FiStar size={size} />;
    default: return <FiHexagon size={size} />; 
  }
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: COMPONENT LOGIC (THE PROVIDER) ===
   ========================================================================== */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // --- STATE LAYER ---
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // --- EFFECT 1: INITIAL COMPILING FROM BACKEND ---
  useEffect(() => {
    const fetchInitialDataStream = async () => {
      try {
        setIsLoading(true);
        // 🚀 FIXED: Passed the generic type block so TypeScript knows 'data' contains workspaces array
        const data = await apiFetch<FetchWorkspacesResponse>("/workspaces");
        
        if (data.workspaces && data.workspaces.length > 0) {
          // Map database nodes onto local structures, resolving their icon styles dynamically
          const compiledSpaces = data.workspaces.map((ws: Workspace) => ({
            ...ws,
            iconName: assignDynamicIcon(ws.name)
          }));
          
          setWorkspaces(compiledSpaces);

          // Active Memory Sync: Check if they had a preferred active view cache locked in local storage
          const savedActiveId = localStorage.getItem("app_active_workspace_id");
          const verifiedActiveMatch = compiledSpaces.find((ws: Workspace) => ws.id === savedActiveId);
          
          // Switch to their cached choice, otherwise default to their oldest remaining active platform tab
          setActiveWorkspaceId(verifiedActiveMatch ? verifiedActiveMatch.id : compiledSpaces[0].id);
        }
      } catch (error: unknown) {
        console.error("Workspace Pipeline Hydration Exception:", error);
        toast.error("Unable to load financial workspace configuration layers.");
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    fetchInitialDataStream();
  }, []);

  // --- ACTION: SWITCH WORKSPACE LEDGER VIEW ---
  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    if (isReady) {
      localStorage.setItem("app_active_workspace_id", id); // Lock user view preferences into local memory channels
    }
  };

  // --- ACTION: CREATE NEW REMOTE WORKSPACE ---
  const createWorkspace = async (name: string, currency: string = "PKR") => {
    try {
      // 🚀 FIXED: Injected explicit creation contract structure to validate response metadata properties
      const data = await apiFetch<CreateWorkspaceResponse>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, currency }),
      });

      const initializedWorkspace: Workspace = {
        ...data.workspace,
        iconName: assignDynamicIcon(data.workspace.name)
      };

      // Merge new instance node into active array and update runtime selection context
      setWorkspaces((prev) => [...prev, initializedWorkspace]);
      switchWorkspace(initializedWorkspace.id);
      
      toast.success(`${name} workspace generated successfully.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to establish custom ledger profile.";
      toast.error(msg);
    }
  };

  // --- ACTION: CASCADE DELETE WORKSPACE ---
  const deleteWorkspace = async (id: string) => {
    try {
      // Direct remote network teardown request 
      await apiFetch(`/workspaces/${id}`, { method: "DELETE" });

      // Clean the removed workspace tracking block from memory state
      const filteredSpaces = workspaces.filter((ws) => ws.id !== id);
      setWorkspaces(filteredSpaces);

      // Routing Fix: If active workspace was removed, redirect to primary default setup
      if (activeWorkspaceId === id && filteredSpaces.length > 0) {
        switchWorkspace(filteredSpaces[0].id);
      }
      
      toast.success("Workspace tracking profile and logs cleared.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Security lock preventing workspace removal.";
      toast.error(msg);
    }
  };

  // Automatically compute full object parameters to feed data attributes down to navbars and widgets
  const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);

  const value = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    isLoading,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    renderIcon: getIconComponent
  };
/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: RENDER (JSX) ===
   ========================================================================== */
  // Safely blocks application layout flashing while profile tokens authenticate
  if (!isReady) return null;

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
/* === SECTION 5 END === */