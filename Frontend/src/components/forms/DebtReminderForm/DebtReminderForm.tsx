// src/components/forms/DebtReminderForm/DebtReminderForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
/* === SECTION 1: IMPORTS & DATA CONTRACTS === */
import React, { useState } from "react";
import { FiMail, FiMessageSquare, FiSend, FiX } from "react-icons/fi";
import { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import { toast } from "sonner";
import styles from "./DebtReminderForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
/* === SECTION 2: TYPES, INTERFACES & UTILITIES === */
interface DebtReminderFormProps {
  // Relying on a strongly typed contract shared with the TransactionLedgerGrid component
  transaction: TransactionRecord;
  onCancel: () => void;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
/* === SECTION 3: CORE LOGIC ENGINE & HANDLERS === */
export function DebtReminderForm({ transaction, onCancel }: DebtReminderFormProps) {
  const [recipientName, setRecipientName] = useState<string>( "");
  const [channel, setChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [settleLink, setSettleLink] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>(""); 
  const [isMessageEdited, setIsMessageEdited] = useState<boolean>(false);

  // Defensively match and sanitize category properties to prevent unexpected crashes on null fields
  const transactionCategoryName = String(transaction?.category ?? "");
  const isOwed = transactionCategoryName.toLowerCase().includes("owed");
  
  // Format financial numbers into readable text strings safely using fallback parameters
  const numericAmount = Number(transaction?.originalAmount ?? 0);
  const formattedAmount = `${numericAmount.toFixed(2)} ${String(transaction?.originalCurrency ?? "PKR")}`;
  const sanitizedDescription = String(transaction?.description ?? "Transaction");

  const nameGreeting = recipientName.trim() ? ` ${recipientName.trim()}` : "";
  
  // Clean, natural human language configurations for notification dispatch templates
  let generatedMessage = isOwed
    ? `Hey${nameGreeting}! Just a friendly reminder about "${sanitizedDescription}" for ${formattedAmount}. Whenever you're free, you can send it over. Thanks!`
    : `Hey${nameGreeting}! Just checking in about "${sanitizedDescription}" for ${formattedAmount} that I owe you. Send me your payment details so I can transfer it to you!`;

  if (settleLink.trim()) {
    generatedMessage += `\n\nYou can pay me here: ${settleLink.trim()}`;
  }

  // Define which messaging payload block to use based on user edit state logic flow
  const currentMessagePayload = isMessageEdited ? customMessage : generatedMessage;

  // Handles text dispatch actions safely through browser standard window routing links
  const handleSubmitLinkDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedContactInfo = contactInfo.trim();
    const sanitizedPayload = currentMessagePayload.trim();

    if (!sanitizedContactInfo) {
      toast.error(channel === "WHATSAPP" ? "Please enter your friend's phone number." : "Please enter your friend's email address.");
      return;
    }

    if (!sanitizedPayload) {
      toast.error("The message cannot be blank.");
      return;
    }

    if (channel === "EMAIL") {
      // Validate simple baseline syntax rules before triggering browser mail app routers
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedContactInfo)) {
        toast.error("Please provide a syntactically valid email address destination layout.");
        return;
      }

      // Encode special text characters securely to prevent command injections over mailto protocol streams
      const subject = encodeURIComponent("📝 Payment Reminder - RakhoKhata");
      const body = encodeURIComponent(sanitizedPayload);
      
      // Open browser link safely with appropriate noopener protocols to harden against reverse tabnabbing vulnerabilities
      window.open(`mailto:${sanitizedContactInfo}?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
    } else {
      // Defensively cleanse the string by extracting numbers only to prevent cross-protocol script execution
      const cleanPhone = sanitizedContactInfo.replace(/[^0-9]/g, "");
      if (!cleanPhone || cleanPhone.length < 7) {
        toast.error("Please enter a valid phone number containing proper country codes.");
        return;
      }
      
      // Open chat channel securely, hardening against network boundary leaks
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(sanitizedPayload)}`, "_blank", "noopener,noreferrer");
    }

    // Inform user of successful routine execution before closing the context dialog
    toast.success("Reminder generated! Opening your application...");
    onCancel();
  };
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORTS / RENDER COMPONENT ===
   ========================================================================== */
/* === SECTION 4: EXPORTS / RENDER COMPONENT === */
  return (
    <div className={styles.formCard}>
      {/* HEADER AREA */}
      <div className={styles.headerArea}>
        <div className={styles.headerTitleRow}>
          <h3 className={styles.formTitle}>Send Payment Reminder</h3>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onCancel}
            aria-label="Close reminder dialog context window"
          >
            <FiX size={16} />
          </button>
        </div>
        <p className={styles.formSubtitle}>
          Create a quick message to send to your friend for <span className={styles.highlightText}>{sanitizedDescription}</span>
        </p>
      </div>

      <form onSubmit={handleSubmitLinkDispatch} className={styles.formLayout} noValidate>
        {/* RECIPIENT NAME INPUT */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="friendName">Friend's Name</label>
          <input
            id="friendName"
            type="text"
            className={styles.inputField}
            placeholder="e.g. Ahmed Ali"
            maxLength={60} // Structural limit bound protection against parameter overflows
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        {/* CHANNEL SELECTION SEGMENTED CONTROLS */}
        {/* 🚀 FIXED: Swapped out unpredictable fieldset layouts for clean, unified .fieldGroup wrapper division cards */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Send Via</span>
          <div className={styles.segmentedControl}>
            <label 
              className={`${styles.segmentOption} ${channel === "WHATSAPP" ? styles.segmentActiveWhatsapp : ""}`}
            >
              <input 
                type="radio"
                value="WHATSAPP"
                name="reminderChannelSelector"
                checked={channel === "WHATSAPP"}
                onChange={() => { setChannel("WHATSAPP"); setContactInfo(""); }}
                className={styles.hiddenRadioControl}
              />
              <FiMessageSquare size={14} style={{ marginRight: "6px" }} />
              WhatsApp
            </label>
            <label 
              className={`${styles.segmentOption} ${channel === "EMAIL" ? styles.segmentActiveEmail : ""}`}
            >
              <input 
                type="radio"
                value="EMAIL"
                name="reminderChannelSelector"
                checked={channel === "EMAIL"}
                onChange={() => { setChannel("EMAIL"); setContactInfo(""); }}
                className={styles.hiddenRadioControl}
              />
              <FiMail size={14} style={{ marginRight: "6px" }} />
              Email
            </label>
          </div>
        </div>

        {/* CONTACT INFO FIELD: Label switches context dynamically based on active channel selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="contactDetails">
            {channel === "WHATSAPP" ? "Friend's Phone Number" : "Friend's Email Address"}
          </label>
          <input
            id="contactDetails"
            type={channel === "WHATSAPP" ? "tel" : "email"}
            className={styles.inputField}
            placeholder={channel === "WHATSAPP" ? "Include country code, e.g. 923001234567" : "e.g. friend@email.com"}
            maxLength={100}
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>

        {/* RECOVERY / SETTLEMENT ESCROW ROUTE LINK */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="settleLink">
            Your Payment Link <span className={styles.optionalBadge}>Optional</span>
          </label>
          <input
            id="settleLink"
            type="text"
            className={styles.inputField}
            placeholder="e.g. sadapay.pk/me/handle or Raast ID"
            maxLength={150}
            value={settleLink}
            onChange={(e) => setSettleLink(e.target.value)}
          />
        </div>

        {/* MESSAGING SYSTEM PREVIEW RUNTIME DRAFTING DESK */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="previewDraft">Message Preview</label>
          <div className={`${styles.previewBoxWrapper} ${channel === "WHATSAPP" ? styles.whatsappTint : styles.emailTint}`}>
            <textarea
              id="previewDraft"
              className={styles.previewTextArea}
              rows={5}
              maxLength={500} // Preserve string fragments against buffer memory leaks
              value={currentMessagePayload}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setIsMessageEdited(true);
              }}
            />
          </div>
          <span className={styles.helperText}>
            Click inside the box to change the text if you want to personalize it.
          </span>
        </div>

        {/* ACTIONS FOOTER ELEMENT */}
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn}>
            <FiSend size={14} style={{ marginRight: "6px" }} />
            Send Reminder
          </button>
        </div>
      </form>
    </div>
  );
}
/* === SECTION 4 END === */