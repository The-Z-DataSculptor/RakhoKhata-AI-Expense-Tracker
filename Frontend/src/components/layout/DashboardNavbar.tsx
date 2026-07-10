// src/components/layout/DashboardNavbar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useSyncExternalStore } from "react";
import { FiSun, FiMoon, FiMonitor, FiBell, FiCheck, FiMenu, FiX } from "react-icons/fi";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency, CurrencyType } from "@/app/(dashboard)/context/CurrencyContext";
import styles from "./DashboardNavbar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface CurrencyOption {
  code: CurrencyType;
  symbol: string;
  label: string;
  flag: string;
}

// NEW: Explicitly accept user profile parameters dropped from the Server layout matrix
interface DashboardNavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    uiTheme?: string;
  } | null;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
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

const emptySubscribe = () => () => {};

export default function DashboardNavbar({ user }: DashboardNavbarProps) {
  const { activeTheme, changeTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getThemeIcon = () => {
    if (activeTheme === "light") return <FiSun size={16} />;
    if (activeTheme === "dark") return <FiMoon size={16} />;
    return <FiMonitor size={16} />;
  };

  const activeCurrencyDetails = CURRENCY_OPTIONS.find(c => c.code === currency);

  // NEW ATTENTION TO DETAIL: Extract only the user's first name for a clean, personal greeting header card
  const displayGreetingName = user?.name ? user.name.split(" ")[0] : "User";

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

  if (!isMounted) {
    return <header className={styles.topNavbarBlankPlaceholder} />;
  }
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <header className={styles.topNavbar} suppressHydrationWarning>
      
      {/* LEFT SECTION: USER GREETING DECK */}
      <div className={styles.welcomeSection}>
        <h2 className={styles.greetingTitle}>
          {/* DYNAMIC: Welcomes you cleanly by your real database account identifier */}
          {greeting}, <span className={styles.userName}>{displayGreetingName}</span>
        </h2>
        <p className={styles.dateSubtext}>{formattedDate}</p>
      </div>

      {/* RIGHT SECTION: SYSTEM PREFERENCE TRIGGERS */}
      <div className={styles.actionControlDeck}>
        
        {/* ACTION NODE: REGIONAL CURRENCY MANAGEMENT */}
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

        {/* ACTION NODE: NOTIFICATION SYSTEM BELL */}
        <button className={styles.utilityIconButton} aria-label="Notifications">
          <SideEffectNotificationDot />
        </button>

        {/* ACTION NODE: SYSTEM DISPLAY THEME DROPDOWN */}
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
            <div className={styles.themeDropdownMenuFrame}>
              <div className={styles.dropdownMenuHeader}>Interface Theme</div>
              <ul className={styles.themeOptionsList}>
                <li>
                  <button 
                    onClick={() => { changeTheme("light"); setIsThemeOpen(false); }} 
                    className={activeTheme === "light" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiSun size={14} /> 
                      <span>Light</span>
                    </div>
                    {activeTheme === "light" && <FiCheck className={styles.checkMarkerIcon} size={12} />}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { changeTheme("dark"); setIsThemeOpen(false); }} 
                    className={activeTheme === "dark" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiMoon size={14} /> 
                      <span>Dark</span>
                    </div>
                    {activeTheme === "dark" && <FiCheck className={styles.checkMarkerIcon} size={12} />}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { changeTheme("system"); setIsThemeOpen(false); }} 
                    className={activeTheme === "system" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiMonitor size={14} /> 
                      <span>System</span>
                    </div>
                    {activeTheme === "system" && <FiCheck className={styles.checkMarkerIcon} size={12} />}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* RESPONSIVE MOBILE ACCORDION COMPONENT MENU TOGGLE */}
        <button 
          className={styles.hamburgerMenuIconToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation options menu"
        >
          {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

      </div>

      {/* COMPONENT DRAWER OVERLAY TRAYS FOR MINIFIED VIEWPORTS */}
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

// Lightweight inner component to safely render specific notification nodes
function SideEffectNotificationDot() {
  return (
    <>
      <FiBell size={18} />
      <span className={styles.notificationPulseBadge}></span>
    </>
  );
}
/* === SECTION 4 END === */