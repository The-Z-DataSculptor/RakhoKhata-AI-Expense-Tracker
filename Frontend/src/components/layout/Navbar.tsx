"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & HELPERS ===
   ========================================================================== */
import Link from "next/link";
import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useTheme } from "@/hooks/useTheme";
import styles from "./Navbar.module.css";

/* Helper to safely check client hydration without triggering extra re-renders */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

const FEATURE_ITEMS = [
  "Work Spaces",
  "AI Buddy",
  "Overview Hub",
  "Transactions",
  "Categories",
  "Budgets",
  "Investment Vault",
  "Currency changer",
] as const;
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN NAVIGATION COMPONENT ===
   ========================================================================== */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState<boolean>(false);
  const [isThemeOpen, setIsThemeOpen] = useState<boolean>(false);

  const navRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLLIElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();
  const { activeTheme, changeTheme } = useTheme();

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
    setIsThemeOpen(false);
  };

  const toggleFeatures = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFeaturesOpen((prev) => !prev);
  };

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsThemeOpen((prev) => !prev);
  };

  const handleThemeChange = (theme: "light" | "dark" | "system", e: React.MouseEvent) => {
    e.stopPropagation();
    changeTheme(theme);
    setIsThemeOpen(false);
  };

  const getThemeIcon = () => {
    if (activeTheme === "light") return "☀️";
    if (activeTheme === "dark") return "🌙";
    return "💻";
  };

  const closeAllMenus = () => {
    setIsOpen(false);
    setIsFeaturesOpen(false);
    setIsThemeOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (themeRef.current && !themeRef.current.contains(target)) {
        setIsThemeOpen(false);
      }
      if (featuresRef.current && !featuresRef.current.contains(target)) {
        setIsFeaturesOpen(false);
      }
      if (navRef.current && !navRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllMenus();
      }
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={styles.navbarWrapper}>
      <nav 
        ref={navRef}
        className={`${styles.navbar} ${isOpen ? styles.navbarExpanded : ""}`} 
        aria-label="Main Navigation"
      >
        
        {/* MOBILE HEADER BAR */}
        <div className={styles.mobileNavHeader}>
          <Link href="/" className={styles.logo} onClick={closeAllMenus}>
            Rakho<span className={styles.logoAccent}>Khaata</span>
          </Link>

          <div className={styles.mobileControls}>
            {/* THEME TRIGGER & POPOVER */}
            <div className={styles.themeContainer} ref={themeRef}>
              <button 
                type="button" 
                className={styles.themeTrigger} 
                onClick={toggleTheme}
                aria-label="Switch interface color theme scheme"
                aria-expanded={isThemeOpen}
              >
                <span className={styles.themeCurrentIcon}>
                  {mounted ? getThemeIcon() : "💻"}
                </span>
              </button>

              {isThemeOpen && (
                <ul className={styles.themeDropdown} role="menu">
                  <li>
                    <button 
                      type="button" 
                      role="menuitem" 
                      onClick={(e) => handleThemeChange("light", e)} 
                      className={activeTheme === "light" ? styles.themeActiveOption : ""}
                    >
                      <span>☀️</span> Light
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      role="menuitem" 
                      onClick={(e) => handleThemeChange("dark", e)} 
                      className={activeTheme === "dark" ? styles.themeActiveOption : ""}
                    >
                      <span>🌙</span> Dark
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      role="menuitem" 
                      onClick={(e) => handleThemeChange("system", e)} 
                      className={activeTheme === "system" ? styles.themeActiveOption : ""}
                    >
                      <span>💻</span> System
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* HAMBURGER TOGGLE BUTTON */}
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
        
        {/* NAV LINKS & ACCORDION */}
        <ul className={`${styles.navLinks} ${isOpen ? styles.navLinksActive : ""}`}>
          <li className={styles.dropdownContainer} ref={featuresRef}>
            <button
              type="button"
              className={`${styles.dropdownTrigger} ${isFeaturesOpen ? styles.dropdownTriggerActive : ""}`}
              onClick={toggleFeatures}
              aria-expanded={isFeaturesOpen}
            >
              Features <span className={styles.dropdownArrow}>{isFeaturesOpen ? "▲" : "▼"}</span>
            </button>

            {isFeaturesOpen && (
              <div className={styles.dropdownMenuWrapper}>
                <ul className={styles.dropdownMenu}>
                  {FEATURE_ITEMS.map((item) => (
                    <li key={item} className={styles.dropdownMenuItem}>
                      <Link href="/#features" onClick={closeAllMenus}>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
          <li>
            <Link href="/#pricing" onClick={closeAllMenus}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/beta" onClick={closeAllMenus}>
              Blogs
            </Link>
          </li>
        </ul>
        
        {/* AUTH ACTIONS */}
        <div className={`${styles.authActions} ${isOpen ? styles.authActionsActive : ""}`}>
          <Link href="/login" className={styles.signInLink} onClick={closeAllMenus}>
            Sign In
          </Link>

          <Link href="/signup" className={styles.signUpButton} onClick={closeAllMenus}>
            Get Started
            <span className={styles.buttonArrow} aria-hidden="true">→</span>
          </Link>
        </div>

      </nav>
    </div>
  );
}