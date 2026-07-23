// src/components/layout/Sidebar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES ===
   ========================================================================== */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { useWorkspace } from "@/app/(dashboard)/context/WorkspaceContext";
import CreateWorkspaceModal from "@/components/forms/CreateWorkspaceModal/CreateWorkspaceModal";

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
  const { workspaces, activeWorkspace, switchWorkspace, renderIcon, isLoading } = useWorkspace();
  
  // Defensive array checks for safe workspace mapping
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);      
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);                  
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);                
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);      

  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const accountName = user?.name || "RakhoKhata User";
  const accountEmail = user?.email || "Cloud Synced";

  // WHY THIS FIX WAS MADE: Memoizing navigation arrays prevents unnecessary array filtering
  // computations on every single render cycle during state updates.
  const coreItems = useMemo(() => NAVIGATION_ITEMS.filter(item => item.group === "core"), []);
  const growthItems = useMemo(() => NAVIGATION_ITEMS.filter(item => item.group === "growth"), []);
  const intelligenceItems = useMemo(() => NAVIGATION_ITEMS.filter(item => item.group === "intelligence"), []);

  const containerClassName = `
    ${styles.sidebarContainer} 
    ${isCollapsed ? styles.collapsedSidebar : ""} 
    ${isMobileOpen ? styles.mobileSidebarActive : ""}
  `.trim();

  const toggleWorkspaceDropdown = useCallback(() => {
    setIsWorkspaceMenuOpen(prev => !prev);
    setIsProfileMenuOpen(false);
  }, []);

  const toggleProfileDropdown = useCallback(() => {
    setIsProfileMenuOpen(prev => !prev);
    setIsWorkspaceMenuOpen(false);
  }, []);

  // WHY THIS FIX WAS MADE: Listens for Escape key presses and click-outside events
  // to cleanly dismiss open menus and meet accessibility standards.
  useEffect(() => {
    const handleGlobalClickAway = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWorkspaceMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClickAway);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClickAway);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignOutAction = () => {
    setIsProfileMenuOpen(false);
    Cookies.remove("token", { path: "/" });
    toast.success("Logged out successfully. See you soon!");
    window.location.href = "/login";
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: RENDER (JSX) ===
     ========================================================================== */
  return (
    <>
      {/* MOBILE HEADER BAR */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileLogo}>
          Rakho<span className={styles.logoAccent}>Khata</span>
        </div>
        <button 
          type="button"
          className={styles.mobileMenuToggleTrigger}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle system navigation drawer"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* MOBILE BACKDROP DRAWER BLUR OVERLAY */}
      {isMobileOpen && (
        <div 
          className={styles.mobileMenuBackdropOverlay} 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* DYNAMIC FORM MODAL WINDOW */}
      {isCreateModalOpen && (
        <CreateWorkspaceModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      <aside className={containerClassName}>
        
        {/* DESKTOP SIDEBAR SHRINK TRIGGER ARROW PIN */}
        <button 
          type="button"
          className={styles.desktopCollapsePinButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand side navigation" : "Collapse side navigation"}
        >
          <FiChevronLeft size={14} className={`${styles.pinIcon} ${isCollapsed ? styles.pinIconRotated : ""}`} />
        </button>

        {/* --- BLOCK A: BRAND INSIGNIA & WORKSPACE PICKER SWITCHER --- */}
        <div className={styles.brandHeaderSection}>
          <div className={styles.logoLayout}>
            Rakho<span className={styles.logoAccent}>Khata</span>
          </div>

          <div className={styles.workspaceWrapper} ref={workspaceDropdownRef}>
            <button 
              type="button"
              className={styles.workspaceSelectorTrigger}
              onClick={toggleWorkspaceDropdown}
              aria-label="Toggle workspace environment selector"
              aria-expanded={isWorkspaceMenuOpen}
            >
              <span className={styles.activeWorkspaceIcon}>
                {activeWorkspace && !isLoading ? renderIcon(activeWorkspace.iconName || "folder", 14) : <FiFolder size={14} />}
              </span>
              <span className={styles.activeWorkspaceLabel}>
                {isLoading ? "Loading spaces..." : (activeWorkspace ? activeWorkspace.name : "Select Space")}
              </span>
              <FiChevronDown className={`${styles.chevronIndicator} ${isWorkspaceMenuOpen ? styles.chevronRotated : ""}`} size={14} />
            </button>

            {/* DROP-DOWN DRAWER CONTEXT OPTIONS INDEX */}
            {isWorkspaceMenuOpen && (
              <div className={styles.workspaceDropdownMenu} role="menu">
                <div className={styles.workspaceScrollArea}>
                  {isLoading ? (
                    <div className={styles.loadingPlaceholderText}>Fetching active ledgers...</div>
                  ) : (
                    safeWorkspaces.map((ws) => {
                      const isSelected = activeWorkspace?.id === ws.id;
                      return (
                        <button 
                          key={ws.id}
                          type="button"
                          role="menuitem"
                          onClick={() => { switchWorkspace(ws.id); setIsWorkspaceMenuOpen(false); }}
                          className={isSelected ? styles.selectedWorkspaceOption : ""}
                        >
                          {renderIcon(ws.iconName || "folder", 14)}
                          <span>{ws.name}</span>
                          {isSelected && <FiCheck className={styles.checkMarker} size={14} />}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className={styles.dropdownDivider} />

                <button 
                  type="button"
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

        {/* --- BLOCK B: PRIMARY ROUTE NAV HIGHLIGHT LINERS --- */}
        <nav className={styles.navNavigationStack} aria-label="Main Navigation">
          
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
                >
                  <span className={styles.vectorIconFrame}>{item.icon}</span>
                  <span className={styles.linkTitleLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>

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
                >
                  <span className={styles.vectorIconFrame}>{item.icon}</span>
                  <span className={styles.linkTitleLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>

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
                >
                  <span className={styles.vectorIconFrame}>{item.icon}</span>
                  <span className={styles.linkTitleLabel}>{item.label}</span>
                </Link>
              );
            })}
          </div>

        </nav>

        {/* --- BLOCK C: BOTTOM USER DRAWER ACCOUNT MANAGER --- */}
        <div className={styles.profileMasterSectionWrapper} ref={profileDropdownRef}>
          
          {isProfileMenuOpen && (
            <div className={styles.profilePopoverMenuDeck} role="menu">
              {!isCollapsed && (
                <div className={styles.popoverMetaUserBlock}>
                  <p className={styles.popoverUserLabelTitle}>{accountName}</p>
                  <p className={styles.popoverUserConnectionTag}>Verified Profile Account</p>
                </div>
              )}

              <div className={styles.dropdownDivider} />

              <Link 
                href="/dashboard/settings" 
                className={styles.popoverInteractButtonRow}
                onClick={() => setIsProfileMenuOpen(false)}
                role="menuitem"
              >
                <FiSettings size={14} />
                <span>Account Settings</span>
              </Link>

              <button 
                type="button" 
                role="menuitem"
                className={`${styles.popoverInteractButtonRow} ${styles.popoverSignOutActionLink}`}
                onClick={handleSignOutAction}
              >
                <FiLogOut size={14} />
                <span>Sign Out Account</span>
              </button>
            </div>
          )}

          <button 
            type="button"
            className={`${styles.accountProfileFooterSection} ${isProfileMenuOpen ? styles.footerSectionActiveTrigger : ""}`}
            onClick={toggleProfileDropdown}
            aria-label="Toggle profile management settings layout popover window"
            aria-expanded={isProfileMenuOpen}
          >
            <div className={styles.userProfileIdentificationCard}>
              <div className={styles.userAvatarIndicatorBubble}>
                <FiUser size={16} />
                <span className={styles.activePulseStatusDotIndicator} />
              </div>
              <div className={styles.identityTextStack}>
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