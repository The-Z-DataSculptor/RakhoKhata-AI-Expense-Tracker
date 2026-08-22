// Frontend/src/app/(dashboard)/context/WorkspaceContext.tsx
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
  useRef,
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
  isReady: boolean;
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
  if (typeof window !== "undefined") {
    try {
      if (id) {
        localStorage.setItem("app_active_workspace_id", id);
      } else {
        localStorage.removeItem("app_active_workspace_id");
      }
    } catch {
      // Ignore localStorage availability errors
    }
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
  initialWorkspaces = [],
}: {
  children: ReactNode;
  initialWorkspaces?: Workspace[];
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    initialWorkspaces.map((ws) => ({
      ...ws,
      iconName: assignDynamicIcon(ws.name),
    }))
  );

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    if (initialWorkspaces.length === 0) return "";
    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem("app_active_workspace_id")
        : null;
    const exists = initialWorkspaces.some((ws) => ws.id === savedId);
    const targetId = exists && savedId ? savedId : initialWorkspaces[0].id;
    persistActiveWorkspaceId(targetId);
    return targetId;
  });

  const [isLoading, setIsLoading] = useState<boolean>(initialWorkspaces.length === 0);
  const [isReady, setIsReady] = useState<boolean>(initialWorkspaces.length > 0);

  const initialHydratedRef = useRef<boolean>(initialWorkspaces.length > 0);

  const resolveTargetWorkspaceId = useCallback(
    (list: Workspace[], currentId: string): string => {
      if (!list || list.length === 0) return "";
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem("app_active_workspace_id")
          : null;
      const matched = list.find((ws) => ws.id === (currentId || savedId));
      return matched ? matched.id : list[0].id;
    },
    []
  );

  const refreshWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch<FetchWorkspacesResponse>("/workspaces");
      const fetchedWorkspaces = Array.isArray(data?.workspaces) ? data.workspaces : [];

      if (fetchedWorkspaces.length > 0) {
        const enriched = fetchedWorkspaces.map((ws) => ({
          ...ws,
          iconName: assignDynamicIcon(ws.name),
        }));
        setWorkspaces(enriched);

        setActiveWorkspaceId((currId) => {
          const targetId = resolveTargetWorkspaceId(enriched, currId);
          persistActiveWorkspaceId(targetId);
          return targetId;
        });
      } else {
        setWorkspaces([]);
        setActiveWorkspaceId("");
        persistActiveWorkspaceId("");
      }
    } catch (error: unknown) {
      console.error("Workspace Fetch Exception:", error);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [resolveTargetWorkspaceId]);

  useEffect(() => {
    if (initialHydratedRef.current) {
      return;
    }

    let isMounted = true;

    // Asynchronous fetch queue to avoid synchronous render waterfalls
    const executeInitialFetch = async () => {
      try {
        const data = await apiFetch<FetchWorkspacesResponse>("/workspaces");
        if (!isMounted) return;

        const fetchedWorkspaces = Array.isArray(data?.workspaces) ? data.workspaces : [];

        if (fetchedWorkspaces.length > 0) {
          const enriched = fetchedWorkspaces.map((ws) => ({
            ...ws,
            iconName: assignDynamicIcon(ws.name),
          }));
          setWorkspaces(enriched);

          setActiveWorkspaceId((currId) => {
            const targetId = resolveTargetWorkspaceId(enriched, currId);
            persistActiveWorkspaceId(targetId);
            return targetId;
          });
        } else {
          setWorkspaces([]);
          setActiveWorkspaceId("");
          persistActiveWorkspaceId("");
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        console.error("Workspace Initial Fetch Exception:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    void executeInitialFetch();

    return () => {
      isMounted = false;
    };
  }, [resolveTargetWorkspaceId]);

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

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    persistActiveWorkspaceId(id);
  };

  const createWorkspace = async (name: string, currency: string = "USD") => {
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

  const deleteWorkspace = async (id: string) => {
    try {
      await apiFetch(`/workspaces/${id}`, { method: "DELETE" });

      const remaining = workspaces.filter((ws) => ws.id !== id);
      setWorkspaces(remaining);

      if (activeWorkspaceId === id) {
        if (remaining.length > 0) {
          switchWorkspace(remaining[0].id);
        } else {
          setActiveWorkspaceId("");
          persistActiveWorkspaceId("");
        }
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

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);

  const contextValue: WorkspaceContextType = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    isLoading,
    isReady,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
    updateWorkspaceInState,
    renderIcon: renderIconComponent,
  };

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