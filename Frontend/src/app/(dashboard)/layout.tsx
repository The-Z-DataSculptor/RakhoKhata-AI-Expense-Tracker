// src/app/(dashboard)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import React from "react";
import { cookies } from "next/headers";      // Read HttpOnly cookies on the server
import { redirect } from "next/navigation";   // Server‑side redirects
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext";
import { WorkspaceProvider } from "@/app/(dashboard)/context/WorkspaceContext";
import styles from "./layout.module.css";

// Base URL for internal server‑to‑server API calls
const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

interface DashboardLayoutProps {
  children: React.ReactNode;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: SERVER‑SIDE AUTH & DATA FETCHING ===
   ========================================================================== */
/**
 * DashboardLayout
 *
 * WHY this layout is used instead of a client‑side check:
 * The dashboard must be protected.  By verifying the session token directly
 * on the server (reading the cookie via `next/headers` and calling the
 * Express `/auth/me` endpoint), we ensure that no dashboard content is ever
 * sent to unauthenticated users.  If the token is missing or invalid, the
 * user is immediately redirected to `/login` – they never see a flash of
 * the dashboard.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("token")?.value;

  // 1. No cookie → force login
  if (!sessionToken) {
    redirect("/login");
  }

  let userData = null;
  let activeWorkspace = null;

  try {
    // 2. Verify the session token against the backend
    const authResponse = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: { Cookie: `token=${sessionToken}` },
      cache: "no-store",
    });

    const authResult = await authResponse.json();

    // If the backend rejects the session, treat it as expired / invalid
    if (!authResponse.ok) {
      redirect("/login");
    }

    userData = authResult.user;

    // 3. Fetch the user's workspaces to obtain the default currency
    const workspaceResponse = await fetch(`${API_URL}/api/workspaces`, {
      method: "GET",
      headers: { Cookie: `token=${sessionToken}` },
      cache: "no-store",
    });

    if (workspaceResponse.ok) {
      const workspaceResult = await workspaceResponse.json();
      if (
        workspaceResult.workspaces &&
        workspaceResult.workspaces.length > 0
      ) {
        activeWorkspace = workspaceResult.workspaces[0]; // first workspace is the default
      }
    }
  } catch (error) {
    console.error(
      "Dashboard Server Layout Token Bridge Exception:",
      error
    );
    // If the backend is completely unreachable, protect the app
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