// src/components/Navbar.tsx
"use client"; // Required for handling mobile menus and interactive theme custom hooks

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import styles from "./Navbar.module.css";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: MAIN NAVIGATION COMPONENT ===
   ========================================================================== */
export default function Navbar() {
  /* --- STATE INITIALIZATION --- */
  // Manages the layout configuration for mobile viewports (expanded vs collapsed)
  const [isOpen, setIsOpen] = useState(false);
  
  // Controls the visibility state of the glassmorphic theme dropdown panel
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  /* THE "WHY" COMMENT LAYER: We call our custom hook here. We no longer use 
     local React useState tracking because this hook establishes a direct live 
     bridge to your browser environment selectors, localStorage profiles, and 
     the global document element context attributes. */
  const { activeTheme, changeTheme } = useTheme();

  /* --- INTERACTIVE HANDLERS --- */
  // Toggles the hamburger state and dropdown overlays
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isThemeOpen) setIsThemeOpen(false); // Clean up theme menus if mobile framework shifts
  };

  /* THE "WHY" COMMENT LAYER: This refactored handler captures the selection from 
     the dropdown panel UI list options, pushes it directly up to the useTheme hook 
     to activate global CSS color variable blocks, and closes the panel view cleanly. */
  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    changeTheme(theme);
    setIsThemeOpen(false);
  };

  // Helper macro to map the UI string configuration to matching active icons
  const getThemeIcon = () => {
    if (activeTheme === "light") return "☀️";
    if (activeTheme === "dark") return "🌙";
    return "💻";
  };

  /* --- MAIN JSX RENDER LAYOUT --- */
  return (
    <div className={styles.navbarWrapper}>
      <nav className={`${styles.navbar} ${isOpen ? styles.navbarExpanded : ""}`}>
        
        {/* Left Column: Stylized Text Logo configured as a root homepage router link */}
        <Link href="/" className={styles.logo} onClick={() => setIsOpen(false)}>
          Rakho<span className={styles.logoAccent}>Khata</span>
        </Link>
        
        {/* Hamburger Menu Toggle Button (Visible only on mobile/tablet screens) */}
        <button 
          className={`${styles.hamburger} ${isOpen ? styles.hamburgerActive : ""}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
        
        {/* Middle Column: Centered Informational Links */}
        <ul className={`${styles.navLinks} ${isOpen ? styles.navLinksActive : ""}`}>
          <li><a href="#features" onClick={() => setIsOpen(false)}>Features</a></li>
          <li><a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a></li>
          <li><a href="#blog" onClick={() => setIsOpen(false)}>Blogs</a></li>
        </ul>
        
        {/* Right Column: Creative Action Buttons & Theme Controls */}
        <div className={`${styles.authActions} ${isOpen ? styles.authActionsActive : ""}`}>
          
          {/* Theme Dropdown Module Container Component */}
          <div className={styles.themeContainer}>
            <button 
              className={styles.themeTrigger}
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              aria-label="Switch interface color theme scheme"
              aria-expanded={isThemeOpen}
            >
              <span className={styles.themeCurrentIcon}>{getThemeIcon()}</span>
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