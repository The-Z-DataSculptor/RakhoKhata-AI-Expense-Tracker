// src/app/(dashboard)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React from "react";
import { cookies } from "next/headers";     // Next.js native tool to read browser cookies on the server
import { redirect } from "next/navigation"; // Next.js native tool to handle immediate server-side redirection
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar"; 
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext"; 
import { WorkspaceProvider } from "@/app/(dashboard)/context/WorkspaceContext"; 
import styles from "./layout.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPESCRIPT INTERFACES ===
   ========================================================================== */
interface DashboardLayoutProps {
  children: React.ReactNode;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: MAIN COMPONENT RENDER ===
   ========================================================================== */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // 1. Retrieve the secure browser cookie storage box on the server
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("token")?.value;

  // 2. Security Gate A: If no token cookie exists, block rendering and boot to login immediately
  if (!sessionToken) {
    redirect("/login");
  }

  let userData = null;
  let activeWorkspace = null;

  try {
    // 3. Handshake: Dispatch a server-to-server request to your protected Express API endpoint
    const response = await fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: {
        Cookie: `token=${sessionToken}`, 
      },
      cache: "no-store", // Disables internal caching mechanisms so user state profiles match the DB perfectly
    });

    const result = await response.json();
    
    // 4. Security Gate B: If the Express backend rejects the cookie configuration, force immediate re-login
    if (!response.ok) {
      redirect("/login");
    }

    // Capture the clean database user record payload
    userData = result.user;

    // 5. DATA LINK LAYER: Fetch workspaces directly on the server to catch their default currency choice
    const workspaceResponse = await fetch("http://localhost:5000/api/workspaces", {
      method: "GET",
      headers: {
        Cookie: `token=${sessionToken}`,
      },
      cache: "no-store",
    });

    if (workspaceResponse.ok) {
      const workspaceResult = await workspaceResponse.json();
      // Default to their primary workspace (usually the first array index item like "Personal")
      if (workspaceResult.workspaces && workspaceResult.workspaces.length > 0) {
        activeWorkspace = workspaceResult.workspaces[0];
      }
    }

  } catch (error) {
    console.error("Dashboard Server Layout Token Bridge Exception:", error);
    // Safety Fallback: If your Express backend server goes offline mid-session, safeguard application privacy
    redirect("/login");
  }

  return (
    /* 🚀 FIXED: Injected the active server-side workspace currency directly into CurrencyProvider to stop layout jumps */
    <CurrencyProvider initialCurrency={activeWorkspace?.currency || "USD"}>
      <WorkspaceProvider>
        <div className={styles.dashboardShell}>
          
          {/* PERSISTENT SIDEBAR NAVIGATION (Passing our live database profile properties directly down) */}
          <Sidebar user={userData} />

          {/* RIGHT SIDE VIEWPORT ENGINE BLOCK */}
          <div className={styles.mainContentArea}>
            
            {/* INTERACTIVE STICKY TOP TOOLBAR */}
            {/* 🚀 FIXED: Cleaned up props since initialization is handled seamlessly at the Provider root above */}
            <DashboardNavbar 
              user={userData} 
              currentWorkspaceId={activeWorkspace?.id}
            />

            {/* INJECTED CORE APP CONTENT (THE OVERVIEW HUB DROPS IN HERE) */}
            <main className={styles.pageInjectionViewport}>
              {/* INNER WRAPPER: Ensures scroll anchoring functions perfectly across dynamic heights */}
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