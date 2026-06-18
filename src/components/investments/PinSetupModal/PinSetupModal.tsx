// src/components/investments/PinSetupModal/PinSetupModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useRef, useEffect } from "react";
import styles from "./PinSetupModal.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
interface PinSetupModalProps {
  /** Controls if the modal is visible */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function that runs when the PIN is successfully saved */
  onSuccess: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: COMPONENT LOGIC ===
   ========================================================================== */
export function PinSetupModal({ isOpen, onClose, onSuccess }: PinSetupModalProps) {
  // Track which step the user is on
  const [step, setStep] = useState<"CREATE" | "CONFIRM">("CREATE");
  
  // Store the 4 digits currently being typed
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  
  // Store the first PIN they entered to check against the confirmation
  const [firstPin, setFirstPin] = useState<string>("");
  
  // Track if they made a mistake to trigger the red shake animation
  const [isError, setIsError] = useState<boolean>(false);

  // Keep references to the 4 input boxes so we can auto-focus them
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // FIX: Safe helper function to extract the input element and focus it.
  // This completely stops TypeScript from confusing the array with the element.
  const focusInput = (index: number) => {
    const targetInput = inputRefs.current[index];
    if (targetInput) {
      targetInput.focus();
    }
  };

  // FIX: Only handle the auto-focus in the effect to prevent cascading renders
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        focusInput(0);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // FIX: Cleanly reset all state when the user closes the modal
  const handleCloseModal = () => {
    setStep("CREATE");
    setDigits(["", "", "", ""]);
    setFirstPin("");
    setIsError(false);
    onClose();
  };

  // Handle typing numbers into the boxes
  const handleChange = (index: number, value: string) => {
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

    // If we just filled the 4th box, process the submission
    if (value !== "" && index === 3) {
      processSubmission(newDigits.join(""));
    }
  };

  // Handle pressing "Backspace" to move to the previous box
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      focusInput(index - 1);
    }
  };

  // Process what happens when 4 digits are completely entered
  const processSubmission = (completePin: string) => {
    if (step === "CREATE") {
      // Step 1 done: Save the first PIN and move to the Confirm step
      setFirstPin(completePin);
      setStep("CONFIRM");
      setDigits(["", "", "", ""]);
      focusInput(0);
    } else if (step === "CONFIRM") {
      // Step 2 done: Check if they match
      if (completePin === firstPin) {
        // Success! Save to browser memory (localStorage)
        localStorage.setItem("vault_pin", completePin);
        
        // Reset state for future use before closing
        setStep("CREATE");
        setDigits(["", "", "", ""]);
        setFirstPin("");
        setIsError(false);

        onSuccess();
        onClose();
      } else {
        // Fail! They don't match. Show error, shake, and reset confirm step
        setIsError(true);
        setDigits(["", "", "", ""]);
        focusInput(0);
        
        // Remove the shake error state after half a second
        setTimeout(() => setIsError(false), 500);
      }
    }
  };

  if (!isOpen) return null;
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: RENDER (JSX) ===
   ========================================================================== */
  return (
    <div className={styles.modalOverlay} onClick={handleCloseModal}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER AREA */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTextStack}>
            <h2 className={styles.modalTitle}>
              {step === "CREATE" ? "Secure Your Vault" : "Confirm Your PIN"}
            </h2>
            <p className={styles.modalSubtitle}>
              {step === "CREATE" 
                ? "Create a 4-digit PIN to lock your dashboard." 
                : "Enter the same 4 digits again to confirm."}
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleCloseModal}>
            &times;
          </button>
        </div>

        {/* INPUT AREA */}
        <div className={styles.modalBody}>
          
          {/* If there is an error, add the "shakeError" CSS class to the container */}
          <div className={`${styles.pinBoxesContainer} ${isError ? styles.shakeError : ""}`}>
            {digits.map((digit, index) => (
              <input
                key={index}
                // Assign the ref so we can focus it later
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

          {/* Simple helper text or error message */}
          <div className={styles.messageArea}>
            {isError ? (
              <span className={styles.errorMessage}>PINs do not match. Try again.</span>
            ) : (
              <span className={styles.helperMessage}>Your PIN is stored safely on this device.</span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
/* === SECTION 4 END === */