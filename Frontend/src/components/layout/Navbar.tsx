"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & HELPERS ===
   ========================================================================== */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useTheme } from "@/hooks/useTheme";
import { FiChevronDown } from "react-icons/fi";
import styles from "./Navbar.module.css";

/* Helper to safely check client hydration without triggering extra re-renders */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

/**
 * SEO-Optimized Feature Navigation Structure
 * Original pristine short names maintained.
 */
const SEO_FEATURE_PAGES = [
  { name: "AI Financial Companion", href: "/features/ai-financial-companion" },
  { name: "Receipt Scanner (OCR)", href: "/features/receipt-scanner" },
  { name: "Investment Vault", href: "/features/investment-vault" },
  { name: "Category Budget Planner", href: "/features/budget-planner" },
  { name: "Multi-Currency Tracker", href: "/features/multi-currency-tracker" },
] as const;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN NAVIGATION COMPONENT ===
   ========================================================================== */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState<boolean>(false);
  
  // Separate theme dropdown states for mobile vs desktop for perfect click-outside handling
  const [isMobileThemeOpen, setIsMobileThemeOpen] = useState<boolean>(false);
  const [isDesktopThemeOpen, setIsDesktopThemeOpen] = useState<boolean>(false);

  const pathname = usePathname() || "";
  const router = useRouter();

  const navRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLLIElement>(null);
  const mobileThemeRef = useRef<HTMLDivElement>(null);
  const desktopThemeRef = useRef<HTMLDivElement>(null);
  
  const mounted = useIsMounted();
  const { activeTheme, changeTheme } = useTheme();

  const isFeaturesActive = pathname.startsWith("/features");

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
    setIsMobileThemeOpen(false);
  };

  const toggleFeatures = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFeaturesOpen((prev) => !prev);
  };

  const handleThemeChange = (theme: "light" | "dark" | "system", e: React.MouseEvent) => {
    e.stopPropagation();
    changeTheme(theme);
    setIsMobileThemeOpen(false);
    setIsDesktopThemeOpen(false);
  };

  const getThemeIcon = () => {
    if (activeTheme === "light") return "☀️";
    if (activeTheme === "dark") return "🌙";
    return "💻";
  };

  const closeAllMenus = () => {
    setIsOpen(false);
    setIsFeaturesOpen(false);
    setIsMobileThemeOpen(false);
    setIsDesktopThemeOpen(false);
  };

  // Smooth jump handler to the PricingSection component
  const handlePricingClick = (e: React.MouseEvent) => {
    closeAllMenus();
    if (pathname === "/") {
      e.preventDefault();
      const pricingElement = document.getElementById("pricing");
      if (pricingElement) {
        pricingElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      router.push("/#pricing");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (mobileThemeRef.current && !mobileThemeRef.current.contains(target)) {
        setIsMobileThemeOpen(false);
      }
      if (desktopThemeRef.current && !desktopThemeRef.current.contains(target)) {
        setIsDesktopThemeOpen(false);
      }
      if (featuresRef.current && !featuresRef.current.contains(target)) {
        setIsFeaturesOpen(false);
      }
      if (navRef.current && !navRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAllMenus();
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Shared Theme Dropdown stored as a JSX variable
  const themeDropdownJSX = (
    <ul className={styles.themeDropdown} role="menu">
      <li>
        <button type="button" role="menuitem" onClick={(e) => handleThemeChange("light", e)} className={activeTheme === "light" ? styles.themeActiveOption : ""}>
          <span>☀️</span> Light
        </button>
      </li>
      <li>
        <button type="button" role="menuitem" onClick={(e) => handleThemeChange("dark", e)} className={activeTheme === "dark" ? styles.themeActiveOption : ""}>
          <span>🌙</span> Dark
        </button>
      </li>
      <li>
        <button type="button" role="menuitem" onClick={(e) => handleThemeChange("system", e)} className={activeTheme === "system" ? styles.themeActiveOption : ""}>
          <span>💻</span> System
        </button>
      </li>
    </ul>
  );

  return (
    <div className={styles.navbarWrapper}>
      <nav 
        ref={navRef}
        className={`${styles.navbar} ${isOpen ? styles.navbarExpanded : ""}`} 
        aria-label="Main Navigation"
      >
        
        {/* =========================================
            HEADER BAR (Always Visible) 
            ========================================= */}
        <div className={styles.navHeader}>
          <Link href="/" className={styles.logo} onClick={closeAllMenus}>
            Rakho<span className={styles.logoAccent}>Khaata</span>
          </Link>

          <div className={styles.mobileActions}>
            {/* MOBILE THEME TOGGLE */}
            <div className={styles.themeContainerMobile} ref={mobileThemeRef}>
              <button 
                type="button" 
                className={styles.themeTrigger} 
                onClick={(e) => { e.stopPropagation(); setIsMobileThemeOpen(!isMobileThemeOpen); }}
                aria-label="Switch interface color theme scheme"
                aria-expanded={isMobileThemeOpen}
              >
                <span className={styles.themeCurrentIcon}>{mounted ? getThemeIcon() : "💻"}</span>
              </button>
              {isMobileThemeOpen && themeDropdownJSX}
            </div>

            {/* HAMBURGER BUTTON */}
            <button 
              type="button" 
              className={`${styles.hamburger} ${isOpen ? styles.hamburgerActive : ""}`} 
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </button>
          </div>
        </div>
        
        {/* =========================================
            NAV MENU (Hidden on Mobile unless Open) 
            ========================================= */}
        <div className={`${styles.navMenu} ${isOpen ? styles.navMenuOpen : ""}`}>
          <ul className={styles.navLinks}>
            
            {/* FEATURES DROPDOWN */}
            <li className={styles.dropdownContainer} ref={featuresRef}>
              <button
                type="button"
                className={`${styles.dropdownTrigger} ${isFeaturesOpen || isFeaturesActive ? styles.dropdownTriggerActive : ""}`}
                onClick={toggleFeatures}
                aria-expanded={isFeaturesOpen}
                aria-haspopup="true"
              >
                Features <FiChevronDown className={`${styles.dropdownArrow} ${isFeaturesOpen ? styles.dropdownArrowRotated : ""}`} />
              </button>

              {isFeaturesOpen && (
                <div className={styles.dropdownMenuWrapper}>
                  <ul className={styles.dropdownMenu} role="menu">
                    {SEO_FEATURE_PAGES.map((feature) => {
                      const isCurrent = pathname === feature.href;
                      return (
                        <li key={feature.href} className={styles.dropdownMenuItem}>
                          <Link 
                            href={feature.href} 
                            onClick={closeAllMenus}
                            className={isCurrent ? styles.dropdownItemActive : ""}
                          >
                            {feature.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>

            {/* CONNECTED PRICING JUMP LINK */}
            <li>
              <Link href="/#pricing" onClick={handlePricingClick}>
                Pricing
              </Link>
            </li>

            <li>
              <Link href="/blog" onClick={closeAllMenus} className={pathname === "/blog" ? styles.navLinkActive : ""}>
                Blog
              </Link>
            </li>
          </ul>
          
          {/* AUTH ACTIONS & DESKTOP THEME */}
          <div className={styles.authActions}>
            {/* DESKTOP THEME TOGGLE */}
            <div className={styles.themeContainerDesktop} ref={desktopThemeRef}>
              <button 
                type="button" 
                className={styles.themeTrigger} 
                onClick={(e) => { e.stopPropagation(); setIsDesktopThemeOpen(!isDesktopThemeOpen); }}
                aria-label="Switch interface color theme scheme"
                aria-expanded={isDesktopThemeOpen}
              >
                <span className={styles.themeCurrentIcon}>{mounted ? getThemeIcon() : "💻"}</span>
              </button>
              {isDesktopThemeOpen && themeDropdownJSX}
            </div>

            <Link href="/login" className={styles.signInLink} onClick={closeAllMenus}>
              Sign In
            </Link>

            <Link href="/signup" className={styles.signUpButton} onClick={closeAllMenus}>
              Get Started
              <span className={styles.buttonArrow} aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

      </nav>
    </div>
  );
}