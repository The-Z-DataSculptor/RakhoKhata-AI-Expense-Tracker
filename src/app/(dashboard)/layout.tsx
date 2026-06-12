// src/app/(dashboard)/layout.tsx

/* FIXED / WHY: Removed the "use client" directive from the root level. Layout wrappers 
   in Next.js work best as Server Components by default to maintain fast initial loading 
   speeds and optimize data stream cascades across child page components. */

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar"; // Global top utility hub
import { CurrencyProvider } from "@/app/(dashboard)/context/CurrencyContext";// Global financial state manager
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
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <CurrencyProvider>
      <div className={styles.dashboardShell}>
        
        {/* PERSISTENT SIDEBAR NAVIGATION (260px / 72px) */}
        <Sidebar />

        {/* RIGHT SIDE VIEWPORT ENGINE BLOCK */}
        <div className={styles.mainContentArea}>
          
          {/* INTERACTIVE STICKY TOP TOOLBAR */}
          <DashboardNavbar />

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
    </CurrencyProvider>
  );
}
/* === SECTION 3 END === */