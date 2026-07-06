// src/app/(dashboard)/context/WorkspaceContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
// Importing some clean, professional icons from Feather Icons
import { FiUser, FiBriefcase, FiFolder, FiStar, FiHexagon } from "react-icons/fi";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
export interface Workspace {
  id: string;
  name: string;
  iconName: string; // We store a word like "folder" so it can be saved in localStorage
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace | undefined; // Automatically calculated for convenience
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, iconName?: string) => void;
  renderIcon: (iconName: string, size?: number) => React.ReactNode; // Helper to draw icons
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: DEFAULT DATA & ICONS ===
   ========================================================================== */
// The standard workspaces a user gets the very first time they log in
const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "ws-personal-default", name: "Personal", iconName: "user" },
  { id: "ws-business-default", name: "Business", iconName: "briefcase" }
];

// A helper function to turn text tags into actual visual React Icons
const getIconComponent = (iconName: string, size: number = 18) => {
  switch (iconName) {
    case "user": return <FiUser size={size} />;
    case "briefcase": return <FiBriefcase size={size} />;
    case "folder": return <FiFolder size={size} />;
    case "star": return <FiStar size={size} />;
    default: return <FiHexagon size={size} />; // A fallback icon if something goes wrong
  }
};

// Create the blank Context Brain
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: COMPONENT LOGIC (THE PROVIDER) ===
   ========================================================================== */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // --- STATE ---
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ws-personal-default");
  
  // A safety check to stop the screen from flashing before localStorage loads
  const [isReady, setIsReady] = useState(false);

  // --- EFFECT 1: LOAD FROM BROWSER MEMORY ---
  // When the app opens, check if the user has saved custom workspaces before
  useEffect(() => {
    // FIX: Wrapped in setTimeout to prevent React's synchronous cascading render error
    const timerId = setTimeout(() => {
      const savedWorkspaces = localStorage.getItem("app_workspaces");
      const savedActiveId = localStorage.getItem("app_active_workspace_id");

      if (savedWorkspaces) {
        setWorkspaces(JSON.parse(savedWorkspaces));
      }
      if (savedActiveId) {
        setActiveWorkspaceId(savedActiveId);
      }
      
      setIsReady(true); // Tell the app it is safe to render now
    }, 0);

    return () => clearTimeout(timerId); // Clean up the timer
  }, []);

  // --- EFFECT 2: SAVE TO BROWSER MEMORY ---
  // Every single time the workspaces or the active ID changes, silently save it
  useEffect(() => {
    if (isReady) {
      localStorage.setItem("app_workspaces", JSON.stringify(workspaces));
      localStorage.setItem("app_active_workspace_id", activeWorkspaceId);
    }
  }, [workspaces, activeWorkspaceId, isReady]);

  // --- ACTION: SWITCH WORKSPACE ---
  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  // --- ACTION: CREATE NEW WORKSPACE ---
  const createWorkspace = (name: string, iconName: string = "folder") => {
    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}`, // Generates a totally unique ID using the current time
      name: name,
      iconName: iconName,
    };

    // Add the new space to the list, and instantly switch the active view to it
    setWorkspaces((prev) => [...prev, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  // Automatically find the active workspace object so pages don't have to search for it manually
  const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);

  // --- THE BRAIN PAYLOAD ---
  const value = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    renderIcon: getIconComponent
  };

/* === SECTION 4 END === */

/* ==========================================================================
   === SECTION 5: RENDER (JSX) ===
   ========================================================================== */
  // We hold off on showing the app until the memory is loaded to prevent UI glitches
  if (!isReady) return null;

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// A custom hook so any file in our app can just type: const { activeWorkspace } = useWorkspace();
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
/* === SECTION 5 END === */