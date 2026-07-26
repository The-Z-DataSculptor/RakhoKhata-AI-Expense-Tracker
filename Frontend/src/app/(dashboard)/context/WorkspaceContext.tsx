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
  useCallback,
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

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  iconName?: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace | undefined;
  isLoading: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, currency?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  updateWorkspaceInState: (id: string, updates: Partial<Workspace>) => void;
  renderIcon: (iconName: string, size?: number) => React.ReactNode;
}

interface FetchWorkspacesResponse {
  workspaces: Workspace[];
}

interface CreateWorkspaceResponse {
  workspace: Workspace;
}

function assignDynamicIcon(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("personal")) return "user";
  if (normalized.includes("business")) return "briefcase";
  return "folder";
}

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

function persistActiveWorkspaceId(id: string): void {
  try {
    localStorage.setItem("app_active_workspace_id", id);
  } catch {
    // localStorage might be unavailable
  }
}

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

  // ----- Fetch / Refresh Workspaces -----
  const refreshWorkspaces = useCallback(async () => {
    try {
      const data = await apiFetch<FetchWorkspacesResponse>("/workspaces");

      if (data.workspaces && data.workspaces.length > 0) {
        const enriched = data.workspaces.map((ws) => ({
          ...ws,
          iconName: assignDynamicIcon(ws.name),
        }));
        setWorkspaces(enriched);

        setActiveWorkspaceId((currentId) => {
          const savedId = typeof window !== "undefined" ? localStorage.getItem("app_active_workspace_id") : null;
          const matched = enriched.find((ws) => ws.id === (currentId || savedId));
          return matched ? matched.id : enriched[0].id;
        });
      }
    } catch (error: unknown) {
      console.error("Workspace Pipeline Hydration Exception:", error);
      toast.error("Unable to load financial workspace configuration layers.");
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  // Sync initial workspaces on mount cleanly without synchronous inline state triggers
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const data = await apiFetch<FetchWorkspacesResponse>("/workspaces");
        if (!active) return;

        if (data.workspaces && data.workspaces.length > 0) {
          const enriched = data.workspaces.map((ws) => ({
            ...ws,
            iconName: assignDynamicIcon(ws.name),
          }));
          setWorkspaces(enriched);

          const savedId = localStorage.getItem("app_active_workspace_id");
          const matched = enriched.find((ws) => ws.id === savedId);
          setActiveWorkspaceId(matched ? matched.id : enriched[0].id);
        }
      } catch (error: unknown) {
        console.error("Workspace Pipeline Hydration Exception:", error);
        if (active) toast.error("Unable to load financial workspace configuration layers.");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  // ----- Direct Local In-Memory State Sync -----
  const updateWorkspaceInState = useCallback((id: string, updates: Partial<Workspace>) => {
    setWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id === id) {
          const updatedName = updates.name ?? ws.name;
          return {
            ...ws,
            ...updates,
            name: updatedName,
            iconName: assignDynamicIcon(updatedName),
          };
        }
        return ws;
      })
    );
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
    refreshWorkspaces,
    updateWorkspaceInState,
    renderIcon: renderIconComponent,
  };

  if (!isReady) return null;

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
/* === SECTION 4 END === */