// Frontend/src/app/(dashboard)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext";
import { WorkspaceProvider, Workspace } from "@/app/(dashboard)/context/WorkspaceContext";
import { UserProvider } from "@/app/(dashboard)/context/UserContext";
import styles from "./layout.module.css";

function getBackendServerUrl(): string {
  let url =
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://mediumpurple-chimpanzee-243781.hostingersite.com"
      : "http://localhost:5000");

  url = url.replace(/\/+$/, "");
  if (url.endsWith("/api")) {
    url = url.slice(0, -4);
  }
  return url;
}

const API_URL = getBackendServerUrl();

interface DashboardLayoutProps {
  children: React.ReactNode;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SERVER‑SIDE AUTH & DATA FETCHING ===
   ========================================================================== */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("token")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  let userData = null;
  let serverWorkspaces: Workspace[] = [];
  let activeWorkspace: Workspace | null = null;

  try {
    const authResponse = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Cookie: `token=${sessionToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!authResponse.ok) {
      redirect("/login");
    }

    const authResult = await authResponse.json().catch(() => null);
    userData = authResult?.user || null;

    if (!userData) {
      redirect("/login");
    }

    const workspaceResponse = await fetch(`${API_URL}/api/workspaces`, {
      method: "GET",
      headers: {
        Cookie: `token=${sessionToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (workspaceResponse.ok) {
      const workspaceResult = await workspaceResponse.json().catch(() => null);
      if (
        workspaceResult?.workspaces &&
        Array.isArray(workspaceResult.workspaces) &&
        workspaceResult.workspaces.length > 0
      ) {
        serverWorkspaces = workspaceResult.workspaces;
        activeWorkspace = serverWorkspaces[0];
      }
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("[Dashboard SSR Exception]:", error);
    redirect("/login");
  }

  return (
    <WorkspaceProvider initialWorkspaces={serverWorkspaces}>
      <UserProvider initialUser={userData}>
        <CurrencyProvider initialCurrency={activeWorkspace?.currency || "USD"}>
          <div className={styles.dashboardShell}>
            <Sidebar user={userData} />

            <div className={styles.mainContentArea}>
              <DashboardNavbar
                user={userData}
                currentWorkspaceId={activeWorkspace?.id}
              />

              <main className={styles.pageInjectionViewport}>
                <div className={styles.scrollAnchorWrapper}>
                  {children}
                </div>
              </main>
            </div>
          </div>
        </CurrencyProvider>
      </UserProvider>
    </WorkspaceProvider>
  );
}