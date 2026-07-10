// src/components/layout/Sidebar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie"; // NEW: Used to destroy sessions on sign-out
import { toast } from "sonner"; // Used to confirm logout status

// Importing the Workspace Context Hook
import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";

// Import the standalone creation modal component
import CreateWorkspaceModal from "@/components/forms/CreateWorkspaceModal/CreateWorkspaceModal";

// Importing linear icons from the Feather set
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
  FiChevronLeft,
  FiMenu,
  FiX,
  FiPlus,
  FiUser,
  FiLogOut
} from "react-icons/fi";

import styles from "./Sidebar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: DATA STRUCTURES & INTERFACES ===
   ========================================================================== */
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group: "core" | "growth" | "intelligence";
}

// NEW: Explicit structure configuration for our incoming Neon database record
interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    uiTheme?: string;
  } | null;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { label: "Overview Hub", href: "/dashboard", icon: <FiGrid size={18} />, group: "core" },
  { label: "Transactions", href: "/dashboard/transactions", icon: <FiActivity size={18} />, group: "core" },
  { label: "Categories", href: "/dashboard/categories", icon: <FiFolder size={18} />, group: "core" },
  { label: "Budgets", href: "/dashboard/budgets", icon: <FiPieChart size={18} />, group: "core" },
  { label: "Investment Vault", href: "/dashboard/investment-vault", icon: <FiShield size={18} />, group: "growth" },
  { label: "AI Insights", href: "/dashboard/ai-insights", icon: <FiCpu size={18} />, group: "intelligence" },
];
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // --- GLOBAL WORKSPACE BRAIN CONNECTION ---
  const { workspaces, activeWorkspace, switchWorkspace, renderIcon } = useWorkspace();
  
  // --- STATE ENGINE OVERLAYS ---
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  // Fallbacks to keep layouts fully crash-proof if database sync lags
  const accountName = user?.name || "RakhoKhata User";
  const accountEmail = user?.email || "Cloud Synced";

  // Group nav items to match visual hierarchy layouts
  const coreItems = NAVIGATION_ITEMS.filter(item => item.group === "core");
  const growthItems = NAVIGATION_ITEMS.filter(item => item.group === "growth");
  const intelligenceItems = NAVIGATION_ITEMS.filter(item => item.group === "intelligence");

  // Dynamic style string selectors based on sidebar orientation rules
  const containerClassName = `
    ${styles.sidebarContainer} 
    ${isCollapsed ? styles.collapsedSidebar : ""} 
    ${isMobileOpen ? styles.mobileSidebarActive : ""}
  `.trim();

  // Simple handler toggle functions to clean up inline markup calls
  const toggleWorkspaceDropdown = () => {
    setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    if (isWorkspaceMenuOpen) setIsWorkspaceMenuOpen(false);
  };

  // NEW BY THE BOOK: Authentic session destruction function 
  const handleSignOutAction = () => {
    setIsProfileMenuOpen(false);
    
    // 1. Terminate the token from the browser cookie safe vault
    Cookies.remove("token", { path: "/" });
    
    // 2. Alert user of successful session closure
    toast.success("Logged out successfully. See you soon!");
    
    // 3. Force route change instantly to login entry gate
    router.push("/login");
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
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

      {/* CREATE WORKSPACE MODAL POPUP ANCHOR */}
      {isCreateModalOpen && (
        <CreateWorkspaceModal onClose={() => setIsCreateModalOpen(false)} />
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

        {/* 1. TOP BRAND PLATE & WORKSPACE ENGINE */}
        <div className={styles.brandHeaderSection}>
          <div className={styles.logoLayout}>
            Rakho<span className={styles.logoAccent}>Khata</span>
          </div>

          <div className={styles.workspaceWrapper}>
            <button 
              className={styles.workspaceSelectorTrigger}
              onClick={toggleWorkspaceDropdown}
              aria-label="Toggle workspace environment selector"
            >
              <span className={styles.activeWorkspaceIcon}>
                {activeWorkspace ? renderIcon(activeWorkspace.iconName, 14) : null}
              </span>
              <span className={styles.activeWorkspaceLabel}>
                {activeWorkspace ? activeWorkspace.name : "Loading..."}
              </span>
              <FiChevronDown className={`${styles.chevronIndicator} ${isWorkspaceMenuOpen ? styles.chevronRotated : ""}`} size={14} />
            </button>

            {isWorkspaceMenuOpen && (
              <div className={styles.workspaceDropdownMenu}>
                <div className={styles.workspaceScrollArea}>
                  {workspaces.map((ws) => {
                    const isSelected = activeWorkspace?.id === ws.id;
                    return (
                      <button 
                        key={ws.id}
                        onClick={() => { switchWorkspace(ws.id); setIsWorkspaceMenuOpen(false); }}
                        className={isSelected ? styles.selectedWorkspaceOption : ""}
                      >
                        {renderIcon(ws.iconName, 14)}
                        <span>{ws.name}</span>
                        {isSelected && <FiCheck className={styles.checkMarker} size={14} />}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.dropdownDivider} />

                <button 
                  className={styles.createWorkspaceBtn}
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <FiPlus size={14} />
                  <span>Create Workspace</span>
                </button>
              </div>
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

          {/* WEALTH MANAGEMENT SECTION */}
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

          {/* AI INTELLIGENCE SECTION */}
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

        {/* 3. LOWER INTERACTIVE SESSION FOOTER ENGINE */}
        <div className={styles.profileMasterSectionWrapper}>
          
          {/* POPOVER DECK DROPDOWN OVERLAY ELEMENT */}
          {isProfileMenuOpen && (
            <div className={styles.profilePopoverMenuDeck}>
              
              {/* USER PROFILE META ZONE */}
              {!isCollapsed && (
                <div className={styles.popoverMetaUserBlock}>
                  {/* DYNAMIC LOOKUP: Displays live database user name */}
                  <p className={styles.popoverUserLabelTitle}>{accountName}</p>
                  <p className={styles.popoverUserConnectionTag}>Verified Profile Account</p>
                </div>
              )}

              <div className={styles.dropdownDivider} />

              {/* NAVIGATION INTERACTION LINKS */}
              <Link 
                href="/dashboard/settings" 
                className={styles.popoverInteractButtonRow}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <FiSettings size={14} />
                <span>Account Settings</span>
              </Link>

              <button 
                type="button" 
                className={`${styles.popoverInteractButtonRow} ${styles.popoverSignOutActionLink}`}
                onClick={handleSignOutAction}
              >
                <FiLogOut size={14} />
                <span>Sign Out Account</span>
              </button>

            </div>
          )}

          {/* THE INTERACTIVE FLAT TRIGGER CONTROL PLATE CARD */}
          <button 
            type="button"
            className={`${styles.accountProfileFooterSection} ${isProfileMenuOpen ? styles.footerSectionActiveTrigger : ""}`}
            onClick={toggleProfileDropdown}
            aria-label="Toggle user session profile management popover menu"
          >
            <div className={styles.userProfileIdentificationCard}>
              <div className={styles.userAvatarIndicatorBubble}>
                <FiUser size={16} />
                <span className={styles.activePulseStatusDotIndicator} />
              </div>
              <div className={styles.identityTextStack}>
                {/* DYNAMIC LOOKUP: Replaces hardcoded strings with actual account values */}
                <span className={styles.operatorProfileName}>{accountName}</span>
                <span className={styles.operatorSecRole}>{accountEmail}</span>
              </div>
            </div>
            
            {!isCollapsed && (
              <div className={styles.profileCardIndicatorChevronFrame}>
                <FiChevronDown className={`${styles.popoverIndicatorChevronIcon} ${isProfileMenuOpen ? styles.chevronRotated : ""}`} size={14} />
              </div>
            )}
          </button>

        </div>

      </aside>
    </>
  );
}
/* === SECTION 4 END === */