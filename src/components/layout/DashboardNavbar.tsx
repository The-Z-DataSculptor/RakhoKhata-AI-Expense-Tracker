// src/components/layout/DashboardNavbar.tsx

"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES START ===
   ========================================================================== */
import React, { useState, useSyncExternalStore } from "react";
// WHY: We utilize unified icons from react-icons to ensure clear interactive cues
import { 
  FiSun, 
  FiMoon, 
  FiMonitor, 
  FiSearch, 
  FiBell,
  FiGlobe,
  FiCheck,
  FiMenu,
  FiX
} from "react-icons/fi";
// WHY: Hook dependency to tie dark/light/system mechanics to our DOM data attribute
import { useTheme } from "@/hooks/useTheme";
import styles from "./DashboardNavbar.module.css";
/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES END ===
   ========================================================================== */

/* ==========================================================================
   === SECTION 2: TYPES AND INTERFACES START ===
   ========================================================================== */
type CurrencyType = "PKR" | "USD" | "EUR";

interface CurrencyOption {
  code: CurrencyType;
  symbol: string;
  label: string;
}
/* ==========================================================================
   === SECTION 2: TYPES AND INTERFACES END ===
   ========================================================================== */

/* ==========================================================================
   === SECTION 3: CONSTANTS START ===
   ========================================================================== */
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
];

// FIXED / WHY: Empty subscription function required by useSyncExternalStore
const emptySubscribe = () => () => {};
/* ==========================================================================
   === SECTION 3: CONSTANTS END ===
   ========================================================================== */

export default function DashboardNavbar() {
  /* ==========================================================================
     === SECTION 4: STATE INITIALIZATION START ===
     ========================================================================== */
  const { activeTheme, changeTheme } = useTheme();
  
  // FIXED / WHY: useSyncExternalStore safely determines if we are rendering on client vs server 
  // without triggering a useEffect hook or throwing cascading setState linter errors.
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client value
    () => false  // Server/Hydration value
  );

  // WHY: Controls display states for custom menus and mobile toggle drawers
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  
  // WHY: Reactive state tracking for user currency switches
  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>("PKR");
  /* ==========================================================================
     === SECTION 4: STATE INITIALIZATION END ===
     ========================================================================== */

  /* ==========================================================================
     === SECTION 5: HELPER SIDE EFFECTS START ===
     ========================================================================== */
  // WHY: Explicitly maps the active theme to its matching icon variant
  const getThemeIcon = () => {
    if (activeTheme === "light") return <FiSun size={16} />;
    if (activeTheme === "dark") return <FiMoon size={16} />;
    return <FiMonitor size={16} />;
  };

  // WHY: Dynamically matches selection to active state instead of defaulting to PKR
  const activeCurrencyDetails = CURRENCY_OPTIONS.find(c => c.code === activeCurrency);

  // WHY: Compute values dynamically during render rather than setting state inside an effect.
  let greeting = "Welcome";
  let formattedDate = "";

  if (isMounted) {
    const hour = new Date().getHours();
    greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    formattedDate = new Date().toLocaleDateString("en-US", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  /* ==========================================================================
     === SECTION 5: HELPER SIDE EFFECTS END ===
     ========================================================================== */

  /* ==========================================================================
     === HYDRATION FALLBACK INTERCEPTOR ===
     ========================================================================== */
  // WHY: If rendering on the server, return a structurally balanced empty bar layout node. 
  if (!isMounted) {
    return <header className={styles.topNavbarBlankPlaceholder} />;
  }

  /* ==========================================================================
     === SECTION 6: MAIN JSX RENDER LAYOUT START ===
     ========================================================================== */
  return (
    <header className={styles.topNavbar} suppressHydrationWarning>
      
      {/* --- SUB-COMPONENT: MOBILE OVERLAY SEARCH EXPANSION --- */}
      {isMobileSearchActive && (
        <div className={styles.mobileSearchOverlay}>
          <FiSearch className={styles.searchIcon} size={16} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className={styles.mobileSearchInput}
            autoFocus
          />
          <button 
            className={styles.closeSearchButton}
            onClick={() => setIsMobileSearchActive(false)}
            aria-label="Exit search view"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* --- LEFT HAND ELEMENT BLOCK: GREETINGS --- */}
      <div className={styles.welcomeSection}>
        <h2 className={styles.greetingTitle}>
          {greeting}, <span className={styles.userName}>Zain</span>
        </h2>
        <p className={styles.dateSubtext}>{formattedDate}</p>
      </div>

      {/* --- CENTER ELEMENT BLOCK: GLOBAL DESKTOP SEARCH --- */}
      <div className={styles.searchWrapper}>
        <FiSearch className={styles.searchIcon} size={16} />
        <input 
          type="text" 
          placeholder="Search transactions, ledgers... (⌘K)" 
          className={styles.searchInput}
        />
      </div>

      {/* --- RIGHT HAND ELEMENT BLOCK: UTILITY CONTROLS --- */}
      <div className={styles.actionControlDeck}>
        
        {/* MOBILE INTERACTIVE ACTION ICON TRIGGER ELEMENTS */}
        <button 
          className={styles.mobileSearchTriggerButton}
          onClick={() => setIsMobileSearchActive(true)}
          aria-label="Open mobile input query field"
        >
          <FiSearch size={18} />
        </button>

        {/* UTILITY: MULTI-CURRENCY CONSOLE DECK */}
        <div className={styles.dropdownMenuContainer}>
          <button 
            className={styles.currencyToggleTrigger}
            onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsThemeOpen(false); }}
            aria-label="Change currency"
            aria-expanded={isCurrencyOpen}
          >
            <FiGlobe size={14} className={styles.utilityIconInline} />
            <span className={styles.currencyCodeLabel}>
              {activeCurrencyDetails?.code} ({activeCurrencyDetails?.symbol})
            </span>
          </button>

          {isCurrencyOpen && (
            <ul className={styles.dropdownMenuFrame}>
              {CURRENCY_OPTIONS.map((crypto) => (
                <li key={crypto.code}>
                  <button 
                    onClick={() => { setActiveCurrency(crypto.code); setIsCurrencyOpen(false); }}
                    className={crypto.code === activeCurrency ? styles.activeMenuOption : ""}
                  >
                    <span className={styles.currencyMenuSymbol}>{crypto.symbol}</span>
                    <span className={styles.currencyMenuLabel}>{crypto.label}</span>
                    {crypto.code === activeCurrency && <FiCheck className={styles.checkMarkerIcon} size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* UTILITY: NOTIFICATION BELL INDICATOR */}
        <button className={styles.utilityIconButton} aria-label="Notifications">
          <FiBell size={18} />
          <span className={styles.notificationPulseBadge}></span>
        </button>

        {/* UTILITY: THEME TOGGLE FRAMEWORK */}
        <div className={styles.dropdownMenuContainer}>
          <button 
            className={styles.utilityIconButton}
            onClick={() => { setIsThemeOpen(!isThemeOpen); setIsCurrencyOpen(false); }}
            aria-label="Change color theme"
            aria-expanded={isThemeOpen}
          >
            {getThemeIcon()}
          </button>

          {isThemeOpen && (
            <ul className={styles.dropdownMenuFrame}>
              <li>
                <button onClick={() => { changeTheme("light"); setIsThemeOpen(false); }} className={activeTheme === "light" ? styles.activeMenuOption : ""}>
                  <FiSun size={14} /> Light
                </button>
              </li>
              <li>
                <button onClick={() => { changeTheme("dark"); setIsThemeOpen(false); }} className={activeTheme === "dark" ? styles.activeMenuOption : ""}>
                  <FiMoon size={14} /> Dark
                </button>
              </li>
              <li>
                <button onClick={() => { changeTheme("system"); setIsThemeOpen(false); }} className={activeTheme === "system" ? styles.activeMenuOption : ""}>
                  <FiMonitor size={14} /> System
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* HAMBURGER TRIGGER UTILITY (VIEWPORTS BELOW 768px) */}
        <button 
          className={styles.hamburgerMenuIconToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle system control options drawer"
        >
          {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

      </div>

      {/* --- SUB-COMPONENT: RESPONSIVE DROP ACCORDION DRAWER --- */}
      {isMobileMenuOpen && (
        <div className={styles.mobileNavigationDrawerTray}>
          <div className={styles.mobileDrawerWrapper}>
            
            <div className={styles.mobileDrawerGroupItem}>
              <p className={styles.mobileLabelHeader}>Global System Currency Setup</p>
              <div className={styles.mobileButtonLayoutGridRow}>
                {CURRENCY_OPTIONS.map((cur) => (
                  <button 
                    key={cur.code}
                    className={cur.code === activeCurrency ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                    onClick={() => { setActiveCurrency(cur.code); setIsMobileMenuOpen(false); }}
                  >
                    {cur.symbol} {cur.code}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.mobileDrawerGroupItem}>
              <p className={styles.mobileLabelHeader}>Interface Visual Framework</p>
              <div className={styles.mobileButtonLayoutGridRow}>
                <button onClick={() => { changeTheme("light"); setIsMobileMenuOpen(false); }} className={activeTheme === "light" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}>Light</button>
                <button onClick={() => { changeTheme("dark"); setIsMobileMenuOpen(false); }} className={activeTheme === "dark" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}>Dark</button>
                <button onClick={() => { changeTheme("system"); setIsMobileMenuOpen(false); }} className={activeTheme === "system" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}>System</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
/* ==========================================================================
   === SECTION 6: MAIN JSX RENDER LAYOUT END ===
   ========================================================================== */