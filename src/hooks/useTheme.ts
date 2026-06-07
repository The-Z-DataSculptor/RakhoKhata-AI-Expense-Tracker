// src/hooks/useTheme.ts
"use client"; // Required because this hook uses browser-only features like useEffect and state

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import { useEffect, useState } from "react";
/* === SECTION 1 END === */


/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
// THE "WHY" COMMENT LAYER: Explicitly defining the only three valid string 
// values our theme switcher will allow. This prevents spelling mistakes later.
export type ThemeMode = "light" | "dark" | "system";
/* === SECTION 2 END === */


/* ==========================================================================
   === SECTION 3: MAIN HOOK ARCHITECTURE ===
   ========================================================================== */
export function useTheme() {
  /* --- STATE INITIALIZATION --- */
  // Initialize theme from localStorage on the client, defaulting to system when nothing is stored.
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const savedPreference = localStorage.getItem("theme") as ThemeMode | null;
    return savedPreference ?? "system";
  });

  /* --- HELPER FUNCTIONS --- */
  /* THE "WHY" COMMENT LAYER: This function directly mutates the actual browser 
     DOM. It targets the root <html> tag and swaps out the custom attribute 
     we configured in our globals.css file, instantly switching the colors. */
  const applyThemeToDOM = (targetTheme: "light" | "dark") => {
    document.documentElement.setAttribute("data-theme", targetTheme);
  };

  /* --- SIDE EFFECTS (USEEFFECTS) --- */
  
  // EFFECT 1: Handling theme changes and system hardware listeners
  useEffect(() => {
    // Define a browser media query listener to check if the operating system is in dark mode
    const systemMediaMatch = window.matchMedia("(prefers-color-scheme: dark)");

    // Core logic runner that calculates exactly which colors to display
    const handleThemeSynchronization = () => {
      // If the user explicitly picked light or dark, write it to storage and apply it
      if (theme !== "system") {
        localStorage.setItem("theme", theme);
        applyThemeToDOM(theme);
        return;
      }

      // IF THE THEME IS "SYSTEM":
      // Remove any explicit individual overrides from storage so it follows the hardware
      localStorage.removeItem("theme");
      
      // Check the current live status of the operating system's color scheme
      if (systemMediaMatch.matches) {
        applyThemeToDOM("dark");
      } else {
        applyThemeToDOM("light");
      }
    };

    // Run the synchronization immediately whenever the state changes
    handleThemeSynchronization();

    /* THE "WHY" COMMENT LAYER: If the user has "system" active, we attach an 
       event listener to the browser. If their OS transitions from light to 
       dark mode (like at sunset), our app switches themes in real-time without 
       requiring a page refresh. */
    if (theme === "system") {
      systemMediaMatch.addEventListener("change", handleThemeSynchronization);
    }

    // Clean up the event listener when the component unmounts to keep memory usage low
    return () => {
      systemMediaMatch.removeEventListener("change", handleThemeSynchronization);
    };
  }, [theme]); // Re-run this entire block whenever the theme state updates

  /* --- RETURN EXPOSED HOOK VALUES --- */
  // We return the current active state and the setter function so our Navbar can use them.
  return {
    activeTheme: theme,
    changeTheme: setTheme,
  };
}
/* === SECTION 3 END === */