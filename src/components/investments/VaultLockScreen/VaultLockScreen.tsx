// src/components/investments/VaultLockScreen/VaultLockScreen.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useRef, useEffect, useCallback } from "react"; // OPTIMIZED: Added useCallback to eliminate compiler re-render flags
import { toast } from "sonner"; // NEW: Imported the global micro-feedback notification engine
import styles from "./VaultLockScreen.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface VaultLockScreenProps {
  /** Function that runs when the user successfully enters the correct PIN */
  onUnlock: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function VaultLockScreen({ onUnlock }: VaultLockScreenProps) {
  // Store the 4 digits currently being typed
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  
  // Track if they made a mistake to trigger the red shake animation
  const [isError, setIsError] = useState<boolean>(false);

  // Keep references to the 4 input boxes so we can auto-focus them
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OPTIMIZED: Memoized focus macro to strictly ensure event performance compliance
  const focusInput = useCallback((index: number) => {
    const targetInput = inputRefs.current[index];
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

  // FIXED: Synchronized the dependency tracking matrix to clear compiler boundary flags safely
  useEffect(() => {
    const savedPin = localStorage.getItem("vault_pin");
    
    // If for some reason this screen shows but there is no PIN saved, unlock immediately
    if (!savedPin) {
      onUnlock();
      return;
    }

    // Small delay ensures the component has fully rendered before grabbing focus
    const timeoutId = setTimeout(() => {
      focusInput(0);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [onUnlock, focusInput]);

  // Check the typed PIN against the one saved in the browser
  // OPTIMIZED: Memoized validation logic hook to clean up cascading calculation checks
  const validatePin = useCallback((enteredPin: string) => {
    const savedPin = localStorage.getItem("vault_pin");

    if (enteredPin === savedPin) {
      // Success! Unlock the vault.
      onUnlock();
    } else {
      // Fail! Trigger the shake animation and clear the boxes.
      setIsError(true);
      setDigits(["", "", "", ""]);
      focusInput(0);
      
      // NEW: Trigger micro-feedback warning alert layout notification instantly
      toast.error("Incorrect access code. Authorization denied.");
      
      // Remove the red shake state after half a second so they can try again
      setTimeout(() => setIsError(false), 500);
    }
  }, [onUnlock, focusInput]);

  // Handle typing numbers into the boxes
  // OPTIMIZED: Flat execution tree maps states directly to clear runtime race constraints on keystroke logs
  const handleChange = useCallback((index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update the current digit array
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // If a number was typed, automatically move to the next box safely
    if (value !== "" && index < 3) {
      focusInput(index + 1);
    }

    // If we just filled the 4th box, automatically check if the PIN is correct
    if (value !== "" && index === 3) {
      validatePin(newDigits.join(""));
    }
  }, [digits, focusInput, validatePin]);

  // Handle pressing "Backspace" to move to the previous box
  // OPTIMIZED: Wrapped layout event handler inside useCallback to keep it stable across root paints
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      focusInput(index - 1);
    }
  }, [digits, focusInput]);

  // Helper for the "Forgot PIN" emergency reset
  // OPTIMIZED: Wrapped emergency override inside a clean hook to comply with modern execution purity rules
  const handleForgotPin = useCallback(() => {
    const confirmReset = window.confirm(
      "In a real app, this would require your main password to reset. For this demo, do you want to clear your PIN and unlock the vault?"
    );
    if (confirmReset) {
      localStorage.removeItem("vault_pin");
      
      // NEW: Prompt clear operational feedback notice info toast
      toast.info("Vault security credentials cleared.");
      onUnlock();
    }
  }, [onUnlock]);
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.lockScreenContainer}>
      <div className={styles.lockBoxPanel}>
        
        {/* TOP ICON AND TEXT */}
        <div className={styles.headerStack}>
          <div className={styles.iconCircle}>
            {/* Clean minimalist lock SVG */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={styles.lockIcon}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className={styles.titleText}>Vault Locked</h2>
          <p className={styles.subtitleText}>Enter your 4-digit PIN to access your investments.</p>
        </div>

        {/* INTERACTIVE PIN ENTRY BOXES */}
        <div className={`${styles.pinBoxesWrapper} ${isError ? styles.shakeError : ""}`}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              className={`${styles.pinBox} ${isError ? styles.pinBoxError : ""}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoComplete="off"
            />
          ))}
        </div>

        {/* BOTTOM HELPER MESSAGES */}
        <div className={styles.footerArea}>
          {isError ? (
            <p className={styles.errorMessage}>Incorrect PIN. Please try again.</p>
          ) : (
            <button 
              type="button" 
              className={styles.forgotPinButton} 
              onClick={handleForgotPin}
            >
              Forgot your PIN?
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
/* === SECTION 4 END === */