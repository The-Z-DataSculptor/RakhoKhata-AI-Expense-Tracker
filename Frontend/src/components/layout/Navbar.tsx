// src/components/layout/Navbar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "@/hooks/useTheme";
import styles from "./Navbar.module.css";

/* Helper to safely check client hydration without triggering extra re-renders */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN NAVIGATION COMPONENT ===
   ========================================================================== */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // 🚀 React 19 compliant hydration check (Zero cascading render warnings)
  const mounted = useIsMounted();

  const { activeTheme, changeTheme } = useTheme();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isThemeOpen) setIsThemeOpen(false);
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    changeTheme(theme);
    setIsThemeOpen(false);
  };

  const getThemeIcon = () => {
    if (activeTheme === "light") return "☀️";
    if (activeTheme === "dark") return "🌙";
    return "💻";
  };

  return (
    <div className={styles.navbarWrapper}>
      <nav className={`${styles.navbar} ${isOpen ? styles.navbarExpanded : ""}`}>
        
        <Link href="/" className={styles.logo} onClick={() => setIsOpen(false)}>
          Rakho<span className={styles.logoAccent}>Khata</span>
        </Link>
        
        <button 
          className={`${styles.hamburger} ${isOpen ? styles.hamburgerActive : ""}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
        
        <ul className={`${styles.navLinks} ${isOpen ? styles.navLinksActive : ""}`}>
          <li>
            <Link href="/#features" onClick={() => setIsOpen(false)}>
              Features
            </Link>
          </li>
          <li>
            <Link href="/#pricing" onClick={() => setIsOpen(false)}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/beta" onClick={() => setIsOpen(false)}>
              Blogs
            </Link>
          </li>
        </ul>
        
        <div className={`${styles.authActions} ${isOpen ? styles.authActionsActive : ""}`}>
          
          <div className={styles.themeContainer}>
            <button 
              className={styles.themeTrigger}
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              aria-label="Switch interface color theme scheme"
              aria-expanded={isThemeOpen}
            >
              <span className={styles.themeCurrentIcon}>
                {mounted ? getThemeIcon() : "💻"}
              </span>
            </button>

            {isThemeOpen && (
              <ul className={styles.themeDropdown}>
                <li>
                  <button onClick={() => handleThemeChange("light")} className={activeTheme === "light" ? styles.themeActiveOption : ""}>
                    <span>☀️</span> Light
                  </button>
                </li>
                <li>
                  <button onClick={() => handleThemeChange("dark")} className={activeTheme === "dark" ? styles.themeActiveOption : ""}>
                    <span>🌙</span> Dark
                  </button>
                </li>
                <li>
                  <button onClick={() => handleThemeChange("system")} className={activeTheme === "system" ? styles.themeActiveOption : ""}>
                    <span>💻</span> System
                  </button>
                </li>
              </ul>
            )}
          </div>

          <Link href="/login" className={styles.signInLink} onClick={() => setIsOpen(false)}>
            Sign In
          </Link>

          <Link href="/signup" className={styles.signUpButton} onClick={() => setIsOpen(false)}>
            Get Started
            <span className={styles.buttonArrow}>→</span>
          </Link>
        </div>

      </nav>
    </div>
  );
}
/* === SECTION 2 END === */