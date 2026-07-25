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
import { WorkspaceProvider } from "@/app/(dashboard)/context/WorkspaceContext";
import styles from "./layout.module.css";

/**
 * Dynamically resolves the base URL for server-to-server calls:
 * In production inside Docker on Render, uses NEXT_PUBLIC_API_URL or direct Render backend URL.
 */
function getBackendServerUrl(): string {
  let url =
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://expense-backend-jcy1.onrender.com";

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

  // 1. If cookie is missing on frontend domain, send to login
  if (!sessionToken) {
    redirect("/login");
  }

  let userData = null;
  let activeWorkspace = null;

  try {
    // 2. Verify session token against backend server
    const authResponse = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: { 
        Cookie: `token=${sessionToken}`,
        "Content-Type": "application/json"
      },
      cache: "no-store",
    });

    if (!authResponse.ok) {
      console.warn(`[Dashboard SSR] /auth/me rejected session (Status ${authResponse.status})`);
      redirect("/login");
    }

    const authResult = await authResponse.json();
    userData = authResult.user;

    // 3. Fetch user workspaces for workspace/currency context
    const workspaceResponse = await fetch(`${API_URL}/api/workspaces`, {
      method: "GET",
      headers: { 
        Cookie: `token=${sessionToken}`,
        "Content-Type": "application/json"
      },
      cache: "no-store",
    });

    if (workspaceResponse.ok) {
      const workspaceResult = await workspaceResponse.json();
      if (
        workspaceResult.workspaces &&
        workspaceResult.workspaces.length > 0
      ) {
        activeWorkspace = workspaceResult.workspaces[0];
      }
    }
  } catch (error) {
    // Prevent redirect loops when re-throwing Next.js navigation errors
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
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: RENDER ===
   ========================================================================== */
  return (
    <CurrencyProvider
      initialCurrency={activeWorkspace?.currency || "USD"}
    >
      <WorkspaceProvider>
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
      </WorkspaceProvider>
    </CurrencyProvider>
  );
}
/* === SECTION 3 END === */