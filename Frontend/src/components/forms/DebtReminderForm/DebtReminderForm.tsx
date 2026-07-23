// src/components/forms/DebtReminderForm/DebtReminderForm.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & DATA CONTRACTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiMail, FiMessageSquare, FiSend, FiX } from "react-icons/fi";
import { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import { toast } from "sonner";
import styles from "./DebtReminderForm.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES, INTERFACES & UTILITIES ===
   ========================================================================== */
interface DebtReminderFormProps {
  transaction: TransactionRecord;
  onCancel: () => void;
}

// WHY THIS FIX WAS MADE: Validates URL schemes to prevent open-redirect and phishing links in reminders.
const isValidHttpUrl = (urlStr: string): boolean => {
  if (!urlStr.trim()) return true;
  try {
    const url = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CORE LOGIC ENGINE & HANDLERS ===
   ========================================================================== */
export function DebtReminderForm({ transaction, onCancel }: DebtReminderFormProps) {
  const [recipientName, setRecipientName] = useState<string>("");
  const [channel, setChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [settleLink, setSettleLink] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>(""); 
  const [isMessageEdited, setIsMessageEdited] = useState<boolean>(false);

  const transactionCategoryName = String(transaction?.category ?? "");
  const isOwed = transactionCategoryName.toLowerCase().includes("owed");
  
  const numericAmount = Number(transaction?.originalAmount ?? transaction?.amount ?? 0);
  const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
  const formattedAmount = `${safeAmount.toFixed(2)} ${String(transaction?.originalCurrency ?? "PKR")}`;
  const sanitizedDescription = String(transaction?.description ?? "Transaction");

  const nameGreeting = recipientName.trim() ? ` ${recipientName.trim()}` : "";
  
  let generatedMessage = isOwed
    ? `Hey${nameGreeting}! Just a friendly reminder about "${sanitizedDescription}" for ${formattedAmount}. Whenever you're free, you can send it over. Thanks!`
    : `Hey${nameGreeting}! Just checking in about "${sanitizedDescription}" for ${formattedAmount} that I owe you. Send me your payment details so I can transfer it to you!`;

  if (settleLink.trim()) {
    generatedMessage += `\n\nYou can pay me here: ${settleLink.trim()}`;
  }

  const currentMessagePayload = isMessageEdited ? customMessage : generatedMessage;

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

    if (settleLink.trim() && !isValidHttpUrl(settleLink.trim())) {
      toast.error("Please enter a valid payment link address.");
      return;
    }

    if (channel === "EMAIL") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedContactInfo)) {
        toast.error("Please provide a valid email address.");
        return;
      }

      const subject = encodeURIComponent("📝 Payment Reminder - RakhoKhata");
      const body = encodeURIComponent(sanitizedPayload);
      
      window.open(`mailto:${sanitizedContactInfo}?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
    } else {
      const cleanPhone = sanitizedContactInfo.replace(/[^0-9]/g, "");
      if (!cleanPhone || cleanPhone.length < 7) {
        toast.error("Please enter a valid phone number containing country code.");
        return;
      }
      
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(sanitizedPayload)}`, "_blank", "noopener,noreferrer");
    }

    toast.success("Reminder generated successfully!");
    onCancel();
  };
  /* === SECTION 3 END === */

  /* ==========================================================================
     === SECTION 4: EXPORTS / RENDER COMPONENT ===
     ========================================================================== */
  return (
    <div className={styles.formCard}>
      <div className={styles.headerArea}>
        <div className={styles.headerTitleRow}>
          <h3 className={styles.formTitle}>Send Payment Reminder</h3>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onCancel}
            aria-label="Close reminder dialog"
          >
            <FiX size={16} />
          </button>
        </div>
        <p className={styles.formSubtitle}>
          Create a message to send to your friend for <span className={styles.highlightText}>{sanitizedDescription}</span>
        </p>
      </div>

      <form onSubmit={handleSubmitLinkDispatch} className={styles.formLayout} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="friendName">Friend's Name</label>
          <input
            id="friendName"
            type="text"
            className={styles.inputField}
            placeholder="e.g. Ahmed Ali"
            maxLength={60}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

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

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="previewDraft">Message Preview</label>
          <div className={`${styles.previewBoxWrapper} ${channel === "WHATSAPP" ? styles.whatsappTint : styles.emailTint}`}>
            <textarea
              id="previewDraft"
              className={styles.previewTextArea}
              rows={5}
              maxLength={500}
              value={currentMessagePayload}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setIsMessageEdited(true);
              }}
            />
          </div>
          <span className={styles.helperText}>
            Click inside the box to customize message text.
          </span>
        </div>

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