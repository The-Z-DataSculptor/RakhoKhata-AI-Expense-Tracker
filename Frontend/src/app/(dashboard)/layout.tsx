// src/app/(dashboard)/layout.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React from "react";
import { cookies } from "next/headers"; // Next.js native tool to read browser cookies on the server
import { redirect } from "next/navigation"; // Next.js native tool to handle immediate server-side redirection
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar"; // Global top utility hub
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext"; // Global financial state manager
import { WorkspaceProvider } from "@/app/(dashboard)/context/WorkspaceContext"; // Global workspace state manager
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

  try {
    // 3. Handshake: Dispatch a server-to-server request to your protected Express API endpoint
    const response = await fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`, // Presenting our token keycard cleanly
      },
      cache: "no-store", // Crucial: Disables caching so layout profile metrics are always real-time
    });

    const result = await response.json();

    // 4. Security Gate B: If the Express backend rejects the token signature, clear entry and force re-login
    if (!response.ok) {
      redirect("/login");
    }

    // Capture the clean database user record payload
    userData = result.user;

  } catch (error) {
    console.error("Dashboard Server Layout Token Bridge Exception:", error);
    // Safety Fallback: If your Express backend server goes offline mid-session, protect data privacy
    redirect("/login");
  }

  return (
    <CurrencyProvider>
      <WorkspaceProvider>
        <div className={styles.dashboardShell}>
          
          {/* PERSISTENT SIDEBAR NAVIGATION (Passing our live database profile properties directly down) */}
          <Sidebar user={userData} />

          {/* RIGHT SIDE VIEWPORT ENGINE BLOCK */}
          <div className={styles.mainContentArea}>
            
            {/* INTERACTIVE STICKY TOP TOOLBAR (Passing our live database profile properties directly down) */}
            <DashboardNavbar user={userData} />

            {/* INJECTED CORE APP CONTENT (THE OVERVIEW HUB DROPS IN HERE) */}
            <main className={styles.pageInjectionViewport}>
              {/* WHY: This inner wrapper ensures scroll anchoring functions perfectly 
                  and forces minimum height constraints across injected sub-components. */}
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