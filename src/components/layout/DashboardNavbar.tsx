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
  FiBell,
  FiCheck,
  FiMenu,
  FiX
} from "react-icons/fi";
// WHY: Hook dependency to tie dark/light/system mechanics to our DOM data attribute
import { useTheme } from "@/hooks/useTheme";
// FIXED / WHY: Imported from your selected domain-specific local layout directory
import { useCurrency, CurrencyType } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./DashboardNavbar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES AND INTERFACES START ===
   ========================================================================== */
interface CurrencyOption {
  code: CurrencyType;
  symbol: string;
  label: string;
  flag: string; // WHY: Displaying regional indicators elevates the visual aesthetic of the layout deck
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONSTANTS START ===
   ========================================================================== */
// WHY: Static registry housing global currencies, India, and all 6 core GCC Gulf nations
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", flag: "🇮🇳" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "ر.س", label: "Saudi Riyal", flag: "🇸🇦" },
  { code: "KWD", symbol: "د.ك", label: "Kuwaiti Dinar", flag: "🇰🇼" },
  { code: "OMR", symbol: "ر.ع.", label: "Omani Rial", flag: "🇴🇲" },
  { code: "QAR", symbol: "ر.ق", label: "Qatari Riyal", flag: "🇶🇦" },
  { code: "BHD", symbol: "د.ب", label: "Bahraini Dinar", flag: "🇧🇭" },
];

// FIXED / WHY: Empty subscription function required by useSyncExternalStore
const emptySubscribe = () => () => {};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: COMPONENT LOGIC START ===
   ========================================================================== */
export default function DashboardNavbar() {
  const { activeTheme, changeTheme } = useTheme();
  
  // FIXED / WHY: Extracted setCurrency directly from global context state channel to broadcast changes instantly
  const { currency, setCurrency } = useCurrency();
  
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

  // WHY: Explicitly maps the active theme to its matching icon variant
  const getThemeIcon = () => {
    if (activeTheme === "light") return <FiSun size={16} />;
    if (activeTheme === "dark") return <FiMoon size={16} />;
    return <FiMonitor size={16} />;
  };

  // FIXED / WHY: Dynamically matches selection directly to context 'currency' variable
  const activeCurrencyDetails = CURRENCY_OPTIONS.find(c => c.code === currency);

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

  // WHY: If rendering on the server, return a structurally balanced empty bar layout node. 
  if (!isMounted) {
    return <header className={styles.topNavbarBlankPlaceholder} />;
  }
  /* === SECTION 4 END === */

  /* ==========================================================================
     === SECTION 5: RENDER (JSX) START ===
     ========================================================================== */
  return (
    <header className={styles.topNavbar} suppressHydrationWarning>
      
      {/* --- LEFT HAND ELEMENT BLOCK: GREETINGS --- */}
      <div className={styles.welcomeSection}>
        <h2 className={styles.greetingTitle}>
          {greeting}, <span className={styles.userName}>Zain</span>
        </h2>
        <p className={styles.dateSubtext}>{formattedDate}</p>
      </div>

      {/* --- RIGHT HAND ELEMENT BLOCK: UTILITY CONTROLS --- */}
      <div className={styles.actionControlDeck}>
        
        {/* UTILITY: MULTI-CURRENCY CONSOLE DECK */}
        <div className={styles.dropdownMenuContainer}>
          <button 
            className={styles.currencyToggleTrigger}
            onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsThemeOpen(false); }}
            aria-label="Change currency"
            aria-expanded={isCurrencyOpen}
          >
            <span className={styles.utilityFlagInline}>{activeCurrencyDetails?.flag}</span>
            <span className={styles.currencyCodeLabel}>
              {activeCurrencyDetails?.code} ({activeCurrencyDetails?.symbol})
            </span>
          </button>

          {isCurrencyOpen && (
            <div className={styles.dropdownMenuFrame}>
              <div className={styles.dropdownMenuHeader}>Select Dashboard Currency</div>
              <ul className={styles.dropdownScrollableContainer}>
                {CURRENCY_OPTIONS.map((option) => (
                  <li key={option.code}>
                    <button 
                      onClick={() => { setCurrency(option.code); setIsCurrencyOpen(false); }}
                      className={option.code === currency ? styles.activeMenuOption : ""}
                    >
                      <span className={styles.currencyMenuFlag}>{option.flag}</span>
                      <span className={styles.currencyMenuCode}>{option.code}</span>
                      <span className={styles.currencyMenuLabel}>{option.label}</span>
                      <span className={styles.currencyMenuSymbolBadge}>{option.symbol}</span>
                      {option.code === currency && (
                        <FiCheck className={styles.checkMarkerIcon} size={12} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
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
              <div className={styles.dropdownMenuHeader}>Interface Theme</div>
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
                    className={cur.code === currency ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                    onClick={() => { setCurrency(cur.code); setIsMobileMenuOpen(false); }}
                  >
                    <span>{cur.flag}</span> {cur.code} ({cur.symbol})
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
/* === SECTION 5 END === */