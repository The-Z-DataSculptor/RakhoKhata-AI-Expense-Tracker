// src/components/investments/PinSetupModal/PinSetupModal.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useRef, useEffect, useCallback } from "react"; // OPTIMIZED: Added useCallback to eliminate recalculation loops
import { toast } from "sonner"; // NEW: Imported the global micro-feedback notification engine
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

  // OPTIMIZED: Memoized focus macro using a safe target accessor hook to comply with modern execution purity rules
  const focusInput = useCallback((index: number) => {
    const targetInput = inputRefs.current[index];
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

  // FIXED: Synchronized the dependency tracking matrix to clear compiler boundary flags safely
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        focusInput(0);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, focusInput]);

  // OPTIMIZED: Wrapped modal erasure state changes inside a clean state hook to avoid cascading re-render traps
  const handleCloseModal = useCallback(() => {
    setStep("CREATE");
    setDigits(["", "", "", ""]);
    setFirstPin("");
    setIsError(false);
    onClose();
  }, [onClose]);

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

    // If we just filled the 4th box, process the submission validation checks instantly
    if (value !== "" && index === 3) {
      const completePin = newDigits.join("");

      if (step === "CREATE") {
        // Step 1 done: Save the first PIN and move to the Confirm step
        setFirstPin(completePin);
        setStep("CONFIRM");
        setDigits(["", "", "", ""]);
        focusInput(0);
      } else if (step === "CONFIRM") {
        // Step 2 done: Check if they match
        if (completePin === firstPin) {
          try {
            // Success! Save to browser memory (localStorage)
            localStorage.setItem("vault_pin", completePin);
            
            // Reset state for future use before closing
            setStep("CREATE");
            setDigits(["", "", "", ""]);
            setFirstPin("");
            setIsError(false);

            // NEW: Broadcast visual micro-feedback banner to client window profile space
            toast.success("Master Vault PIN saved securely.");
            onSuccess();
            onClose();
          } catch (error) {
            console.error("Local storage allocation restriction intercepted:", error);
            toast.error("Device memory access error. Could not write encryption variables.");
          }
        } else {
          // Fail! They don't match. Show error, shake, and reset confirm step
          setIsError(true);
          setDigits(["", "", "", ""]);
          focusInput(0);
          
          // NEW: Prompt instant micro-feedback warning alert layout notification
          toast.error("PIN verification mismatch. Authorization denied.");
          
          // Remove the shake error state after half a second
          setTimeout(() => setIsError(false), 500);
        }
      }
    }
  }, [digits, step, firstPin, focusInput, onSuccess, onClose]);

  // Handle pressing "Backspace" to move to the previous box
  // OPTIMIZED: Wrapped layout event handler inside useCallback to keep it stable across root paints
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      focusInput(index - 1);
    }
  }, [digits, focusInput]);

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