// FILE LOCATION: src/components/layout/Sidebar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Importing perfectly unified linear icons from the Feather set within react-icons
import { 
  FiGrid, 
  FiActivity, 
  FiFolder, 
  FiPieChart, 
  FiShield, 
  FiCpu, 
  FiSettings,
  FiChevronDown,
  FiCheck,
  FiBriefcase,
  FiUser,
  FiChevronLeft,
  FiMenu,
  FiX
} from "react-icons/fi";

import styles from "./Sidebar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: DATA STRUCTURES CONFIGURATION ===
   ========================================================================== */
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group: "core" | "growth" | "intelligence";
}

type WorkspaceType = "personal" | "business";

const NAVIGATION_ITEMS: NavItem[] = [
  { label: "Overview Hub", href: "/dashboard", icon: <FiGrid size={18} />, group: "core" },
  { label: "Transactions", href: "/dashboard/transactions", icon: <FiActivity size={18} />, group: "core" },
  { label: "Categories", href: "/dashboard/categories", icon: <FiFolder size={18} />, group: "core" },
  { label: "Budgets", href: "/dashboard/budgets", icon: <FiPieChart size={18} />, group: "core" },
  { label: "Investment Vault", href: "/dashboard/vault", icon: <FiShield size={18} />, group: "growth" },
  { label: "AI Insights", href: "/dashboard/insights", icon: <FiCpu size={18} />, group: "intelligence" },
];
/* === SECTION 2 END === */

export default function Sidebar() {
  const pathname = usePathname();
  
  /* --- STATE ENGINE OVERLAYS --- */
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>("personal");
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Group items out to match our precise structural informational layouts
  const coreItems = NAVIGATION_ITEMS.filter(item => item.group === "core");
  const growthItems = NAVIGATION_ITEMS.filter(item => item.group === "growth");
  const intelligenceItems = NAVIGATION_ITEMS.filter(item => item.group === "intelligence");

  // Dynamic style selectors based on structural toggle state rules
  const containerClassName = `
    ${styles.sidebarContainer} 
    ${isCollapsed ? styles.collapsedSidebar : ""} 
    ${isMobileOpen ? styles.mobileSidebarActive : ""}
  `.trim();

  return (
    <>
      {/* MOBILE HEADER BAR: Only visible on mobile viewports */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileLogo}>
          Rakho<span className={styles.logoAccent}>Khata</span>
        </div>
        <button 
          className={styles.mobileMenuToggleTrigger}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle system navigation drawer"
        >
          {isMobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* MOBILE BACKDROP BLUR OVERLAY */}
      {isMobileOpen && (
        <div 
          className={styles.mobileMenuBackdropOverlay} 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={containerClassName}>
        
        {/* DESKTOP COLLAPSE TRIGGER PIN */}
        <button 
          className={styles.desktopCollapsePinButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand side navigation" : "Collapse side navigation"}
        >
          <FiChevronLeft size={14} className={`${styles.pinIcon} ${isCollapsed ? styles.pinIconRotated : ""}`} />
        </button>

        {/* 1. TOP BRAND PLATE (Matching RakhoKhata Brand Alignment) */}
        <div className={styles.brandHeaderSection}>
          <div className={styles.logoLayout}>
            Rakho<span className={styles.logoAccent}>Khata</span>
          </div>

          {/* WORKSPACE SWITCHER DROPDOWN TOGGLE */}
          <div className={styles.workspaceWrapper}>
            <button 
              className={styles.workspaceSelectorTrigger}
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              aria-label="Toggle structural balance workspace environment"
            >
              <span className={styles.activeWorkspaceIcon}>
                {activeWorkspace === "personal" ? <FiUser size={14} /> : <FiBriefcase size={14} />}
              </span>
              <span className={styles.activeWorkspaceLabel}>
                {activeWorkspace === "personal" ? "Personal Mode" : "Business Mode"}
              </span>
              <FiChevronDown className={`${styles.chevronIndicator} ${isWorkspaceMenuOpen ? styles.chevronRotated : ""}`} size={14} />
            </button>

            {isWorkspaceMenuOpen && (
              <ul className={styles.workspaceDropdownMenu}>
                <li>
                  <button 
                    onClick={() => { setActiveWorkspace("personal"); setIsWorkspaceMenuOpen(false); }}
                    className={activeWorkspace === "personal" ? styles.selectedWorkspaceOption : ""}
                  >
                    <FiUser size={14} />
                    <span>Personal Mode</span>
                    {activeWorkspace === "personal" && <FiCheck className={styles.checkMarker} size={14} />}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveWorkspace("business"); setIsWorkspaceMenuOpen(false); }}
                    className={activeWorkspace === "business" ? styles.selectedWorkspaceOption : ""}
                  >
                    <FiBriefcase size={14} />
                    <span>Business Mode</span>
                    {activeWorkspace === "business" && <FiCheck className={styles.checkMarker} size={14} />}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* 2. CORE NAVIGATION MATRIX LAYER */}
        <nav className={styles.navNavigationStack}>
          
          {/* CORE SECTION */}
          <div className={styles.navGroupSection}>
            {coreItems.map((item) => {
              const isLinkActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setIsMobileOpen(false)}
                  className={`${styles.navLinkRow} ${isLinkActive ? styles.activeNavLinkRow : ""}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  <span className={styles.vectorIconFrame}>{item.icon}</span>
                  <span className={styles.linkTitleLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* GROWTH MODULE LAYER */}
          <div className={styles.navGroupSection}>
            <div className={styles.sectionDividerLabel}>Wealth Management</div>
            {growthItems.map((item) => {
              const isLinkActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setIsMobileOpen(false)}
                  className={`${styles.navLinkRow} ${styles.growthRowVariant} ${isLinkActive ? styles.activeNavLinkRow : ""}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  <span className={styles.vectorIconFrame}>{item.icon}</span>
                  <span className={styles.linkTitleLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* INTELLIGENCE MODULE LAYER */}
          <div className={styles.navGroupSection}>
            <div className={styles.sectionDividerLabel}>Core Intelligence</div>
            {intelligenceItems.map((item) => {
              const isLinkActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setIsMobileOpen(false)}
                  className={`${styles.navLinkRow} ${styles.intelligenceRowVariant} ${isLinkActive ? styles.activeNavLinkRow : ""}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  <span className={styles.vectorIconFrame}>{item.icon}</span>
                  <span className={styles.linkTitleLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>

        </nav>

        {/* 3. LOWER ACCOUNT FOOTER ANCHOR */}
        <div className={styles.accountProfileFooterSection}>
          <div className={styles.userProfileIdentificationCard}>
            <div className={styles.userAvatarIndicatorBubble}>
              <FiUser size={16} />
            </div>
            <div className={styles.identityTextStack}>
              <span className={styles.operatorProfileName}>Zain Hassan</span>
              <span className={styles.operatorSecRole}>Signed In</span>
            </div>
          </div>
          
          <Link 
            href="/dashboard/settings" 
            onClick={() => setIsMobileOpen(false)}
            className={styles.systemSettingsActionGearButton}
            aria-label="Access environment network settings platform"
          >
            <FiSettings size={18} />
          </Link>
        </div>

      </aside>
    </>
  );
}