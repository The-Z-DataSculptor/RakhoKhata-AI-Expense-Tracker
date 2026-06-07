// FILE LOCATION: src/components/layout/DashboardNavbar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS AND DEPENDENCIES START ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
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
import { useTheme } from "../../hooks/useTheme";
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
// WHY: Isolated mapping options written outside component to avoid reconstruction on re-renders
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
];
/* ==========================================================================
   === SECTION 3: CONSTANTS END ===
   ========================================================================== */

export default function DashboardNavbar() {
  /* ==========================================================================
     === SECTION 4: STATE INITIALIZATION START ===
     ========================================================================== */
  const { activeTheme, changeTheme } = useTheme();
  
  // WHY: Controls display states for custom menus and mobile toggle drawers
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");
  const [formattedDate, setFormattedDate] = useState("");
  /* ==========================================================================
     === SECTION 4: STATE INITIALIZATION END ===
     ========================================================================== */

  /* ==========================================================================
     === SECTION 5: EFFECT & HELPER SIDE EFFECTS START ===
     ========================================================================== */
  // WHY: Calculates local real-time context and sets client-side safe strings
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const dateString = new Date().toLocaleDateString("en-US", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    setFormattedDate(dateString);
  }, []);

  // WHY: Explicitly maps the active theme to its matching icon variant
  const getThemeIcon = () => {
    if (activeTheme === "light") return <FiSun size={16} />;
    if (activeTheme === "dark") return <FiMoon size={16} />;
    return <FiMonitor size={16} />;
  };

  const activeCurrencyDetails = CURRENCY_OPTIONS.find(c => c.code === "PKR");
  /* ==========================================================================
     === SECTION 5: EFFECT & HELPER SIDE EFFECTS END ===
     ========================================================================== */

  /* ==========================================================================
     === SECTION 6: MAIN JSX RENDER LAYOUT START ===
     ========================================================================== */
  return (
    <header className={styles.topNavbar}>
      
      {/* --- SUB-COMPONENT: MOBILE OVERLAY SEARCH EXPANSION --- */}
      {/* WHY: On small mobile viewports, clicking the search icon overlays a full input canvas */}
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
                    onClick={() => setIsCurrencyOpen(false)}
                    className={crypto.code === "PKR" ? styles.activeMenuOption : ""}
                  >
                    <span className={styles.currencyMenuSymbol}>{crypto.symbol}</span>
                    <span className={styles.currencyMenuLabel}>{crypto.label}</span>
                    {crypto.code === "PKR" && <FiCheck className={styles.checkMarkerIcon} size={14} />}
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

      {/* --- SUB-COMPONENT: RESPONSIVE RESPONSIVE DROP ACCORDION DRAWER --- */}
      {/* WHY: When standard layout breaks on mobile systems, sub-items tuck into this drawer */}
      {isMobileMenuOpen && (
        <div className={styles.mobileNavigationDrawerTray}>
          <div className={styles.mobileDrawerWrapper}>
            
            <div className={styles.mobileDrawerGroupItem}>
              <p className={styles.mobileLabelHeader}>Global System Currency Setup</p>
              <div className={styles.mobileButtonLayoutGridRow}>
                {CURRENCY_OPTIONS.map((cur) => (
                  <button 
                    key={cur.code}
                    className={cur.code === "PKR" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                    onClick={() => setIsMobileMenuOpen(false)}
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