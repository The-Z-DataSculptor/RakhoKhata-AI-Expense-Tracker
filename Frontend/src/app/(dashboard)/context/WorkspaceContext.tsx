// src/app/(dashboard)/context/WorkspaceContext.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  FiUser,
  FiBriefcase,
  FiFolder,
  FiStar,
  FiHexagon,
} from "react-icons/fi";
import { toast } from "sonner";
import { apiFetch } from "@/utils/api";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */

// Workspace data shape returned by the backend and used throughout the app
export interface Workspace {
  id: string;
  name: string;
  currency: string;
  iconName?: string; // Computed client‑side for display purposes
}

// The full context shape provided to consumers
interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace | undefined;
  isLoading: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, currency?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  renderIcon: (iconName: string, size?: number) => React.ReactNode;
}

// Contract for the GET /api/workspaces response
interface FetchWorkspacesResponse {
  workspaces: Workspace[];
}

// Contract for the POST /api/workspaces response
interface CreateWorkspaceResponse {
  workspace: Workspace;
}

/**
 * Helper that determines a display icon name based on the workspace name.
 */
function assignDynamicIcon(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("personal")) return "user";
  if (normalized.includes("business")) return "briefcase";
  return "folder";
}

/**
 * Maps an icon name string to a React Icon component.
 */
function renderIconComponent(
  iconName: string,
  size: number = 18
): React.ReactNode {
  switch (iconName) {
    case "user":
      return <FiUser size={size} />;
    case "briefcase":
      return <FiBriefcase size={size} />;
    case "folder":
      return <FiFolder size={size} />;
    case "star":
      return <FiStar size={size} />;
    default:
      return <FiHexagon size={size} />;
  }
}

/**
 * Safely saves the active workspace id to localStorage.
 * Silently ignores errors (e.g., storage full or unavailable).
 */
function persistActiveWorkspaceId(id: string): void {
  try {
    localStorage.setItem("app_active_workspace_id", id);
  } catch {
    // localStorage might be disabled or full – not critical
  }
}

// Create the context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PROVIDER LOGIC ===
   ========================================================================== */

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // ----- Fetch workspaces on mount -----
  useEffect(() => {
    let cancelled = false;

    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        const data = await apiFetch<FetchWorkspacesResponse>("/workspaces");

        if (cancelled) return;

        if (data.workspaces && data.workspaces.length > 0) {
          const enriched = data.workspaces.map((ws) => ({
            ...ws,
            iconName: assignDynamicIcon(ws.name),
          }));
          setWorkspaces(enriched);

          // Restore the previously active workspace or default to the first one
          const savedId = localStorage.getItem("app_active_workspace_id");
          const matched = enriched.find((ws) => ws.id === savedId);
          setActiveWorkspaceId(matched ? matched.id : enriched[0].id);
        }
      } catch (error: unknown) {
        console.error("Workspace Pipeline Hydration Exception:", error);
        toast.error(
          "Unable to load financial workspace configuration layers."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    fetchWorkspaces();
    return () => {
      cancelled = true;
    };
  }, []);

  // ----- Workspace switching -----
  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    if (isReady) {
      persistActiveWorkspaceId(id);
    }
  };

  // ----- Create a new workspace -----
  const createWorkspace = async (name: string, currency: string = "PKR") => {
    try {
      const data = await apiFetch<CreateWorkspaceResponse>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, currency }),
      });

      const newWorkspace: Workspace = {
        ...data.workspace,
        iconName: assignDynamicIcon(data.workspace.name),
      };

      setWorkspaces((prev) => [...prev, newWorkspace]);
      switchWorkspace(newWorkspace.id);
      toast.success(`${name} workspace generated successfully.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to establish custom ledger profile.";
      toast.error(message);
    }
  };

  // ----- Delete a workspace -----
  const deleteWorkspace = async (id: string) => {
    try {
      await apiFetch(`/workspaces/${id}`, { method: "DELETE" });

      const remaining = workspaces.filter((ws) => ws.id !== id);
      setWorkspaces(remaining);

      // If the active workspace was deleted, activate the first remaining one
      if (activeWorkspaceId === id && remaining.length > 0) {
        switchWorkspace(remaining[0].id);
      }

      toast.success("Workspace tracking profile and logs cleared.");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Security lock preventing workspace removal.";
      toast.error(message);
    }
  };

  // Derive the active workspace object for convenience
  const activeWorkspace = workspaces.find(
    (ws) => ws.id === activeWorkspaceId
  );

  const contextValue: WorkspaceContextType = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    isLoading,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    renderIcon: renderIconComponent,
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER & EXPORTED HOOK ===
   ========================================================================== */

  // Prevent children from rendering until the initial workspace list is ready
  if (!isReady) return null;

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Hook to consume the workspace context.
 * Must be called inside a WorkspaceProvider.
 */
export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
/* === SECTION 4 END === */