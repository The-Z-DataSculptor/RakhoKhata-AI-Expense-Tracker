// src/components/Navbar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import styles from "./Navbar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: MAIN NAVIGATION COMPONENT ===
   ========================================================================== */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { activeTheme, changeTheme } = useTheme();

  /* --- LIFECYCLE: Set mounted flag after client hydration --- */
  useEffect(() => {
    // 👇 Defer state update to avoid React 19 warning about synchronous setState in effect
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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
          <li><a href="#features" onClick={() => setIsOpen(false)}>Features</a></li>
          <li><a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a></li>
          <li><a href="#blog" onClick={() => setIsOpen(false)}>Blogs</a></li>
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

          <a href="/login" className={styles.signInLink} onClick={() => setIsOpen(false)}>
            Sign In
          </a>
          <button className={styles.signUpButton}>
            Get Started
            <span className={styles.buttonArrow}>→</span>
          </button>
        </div>

      </nav>
    </div>
  );
}
/* === SECTION 2 END === */