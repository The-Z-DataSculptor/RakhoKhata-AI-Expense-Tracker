"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState } from "react";
import { FiMail, FiMessageSquare, FiSend, FiX } from "react-icons/fi";
import { TransactionRecord } from "@/components/transactions/TransactionLedgerGrid/TransactionLedgerGrid";
import { toast } from "sonner";
import styles from "./DebtReminderForm.module.css";
/* === SECTION 1 END === */

interface DebtReminderFormProps {
  transaction: TransactionRecord;
  onCancel: () => void;
}

export function DebtReminderForm({ transaction, onCancel }: DebtReminderFormProps) {
  const [recipientName, setRecipientName] = useState<string>("");
  const [channel, setChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [settleLink, setSettleLink] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>(""); 
  const [isMessageEdited, setIsMessageEdited] = useState<boolean>(false);

  const isOwed = transaction.category.toLowerCase().includes("owed");
  const formattedAmount = `${transaction.originalAmount.toFixed(2)} ${transaction.originalCurrency}`;

  const nameGreeting = recipientName.trim() ? ` ${recipientName.trim()}` : "";
  
  // Clean, natural human language for the text templates
  let generatedMessage = isOwed
    ? `Hey${nameGreeting}! Just a friendly reminder about "${transaction.description}" for ${formattedAmount}. Whenever you're free, you can send it over. Thanks!`
    : `Hey${nameGreeting}! Just checking in about "${transaction.description}" for ${formattedAmount} that I owe you. Send me your payment details so I can transfer it to you!`;

  if (settleLink.trim()) {
    generatedMessage += `\n\nYou can pay me here: ${settleLink.trim()}`;
  }

  const currentMessagePayload = isMessageEdited ? customMessage : generatedMessage;

  const handleSubmitLinkDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactInfo.trim()) {
      toast.error(channel === "WHATSAPP" ? "Please enter your friend's phone number." : "Please enter your friend's email address.");
      return;
    }

    if (!currentMessagePayload.trim()) {
      toast.error("The message cannot be blank.");
      return;
    }

    if (channel === "EMAIL") {
      const subject = encodeURIComponent("📝 Payment Reminder - RakhoKhata");
      const body = encodeURIComponent(currentMessagePayload);
      window.open(`mailto:${contactInfo.trim()}?subject=${subject}&body=${body}`, "_blank");
    } else {
      const cleanPhone = contactInfo.replace(/[^0-9]/g, "");
      if (!cleanPhone) {
        toast.error("Please enter a valid phone number with numbers only.");
        return;
      }
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentMessagePayload)}`, "_blank");
    }

    toast.success("Reminder generated! Opening your application...");
    onCancel();
  };

  return (
    <div className={styles.formCard}>
      {/* HEADER AREA */}
      <div className={styles.headerArea}>
        <div className={styles.headerTitleRow}>
          <h3 className={styles.formTitle}>Send Payment Reminder</h3>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>
            <FiX size={16} />
          </button>
        </div>
        <p className={styles.formSubtitle}>
          Create a quick message to send to your friend for <span className={styles.highlightText}>{transaction.description}</span>
        </p>
      </div>

      <form onSubmit={handleSubmitLinkDispatch} className={styles.formLayout}>
        {/* FIELD 1: RECIPIENT NAME */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="friendName">Friend's Name</label>
          <input
            id="friendName"
            type="text"
            className={styles.inputField}
            placeholder="e.g. Ahmed Ali"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        {/* FIELD 2: CHANNEL SELECTION TOGGLE */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Send Via</label>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentOption} ${channel === "WHATSAPP" ? styles.segmentActiveWhatsapp : ""}`}
              onClick={() => { setChannel("WHATSAPP"); setContactInfo(""); }}
            >
              <FiMessageSquare size={14} style={{ marginRight: "6px" }} />
              WhatsApp
            </button>
            <button
              type="button"
              className={`${styles.segmentOption} ${channel === "EMAIL" ? styles.segmentActiveEmail : ""}`}
              onClick={() => { setChannel("EMAIL"); setContactInfo(""); }}
            >
              <FiMail size={14} style={{ marginRight: "6px" }} />
              Email
            </button>
          </div>
        </div>

        {/* FIELD 3: CONTACT INPUT */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="contactDetails">
            {channel === "WHATSAPP" ? "Friend's Phone Number" : "Friend's Email Address"}
          </label>
          <input
            id="contactDetails"
            type={channel === "WHATSAPP" ? "tel" : "email"}
            className={styles.inputField}
            placeholder={channel === "WHATSAPP" ? "Include country code, e.g. 923001234567" : "e.g. friend@email.com"}
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>

        {/* FIELD 4: SETTLEMENT LINK */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="settleLink">
            Your Payment Link <span className={styles.optionalBadge}>Optional</span>
          </label>
          <input
            id="settleLink"
            type="text"
            className={styles.inputField}
            placeholder="e.g. sadapay.pk/me/handle or Raast ID"
            value={settleLink}
            onChange={(e) => setSettleLink(e.target.value)}
          />
        </div>

        {/* FIELD 5: LIVE EDITABLE PREVIEW BOX */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="previewDraft">Message Preview</label>
          <div className={`${styles.previewBoxWrapper} ${channel === "WHATSAPP" ? styles.whatsappTint : styles.emailTint}`}>
            <textarea
              id="previewDraft"
              className={styles.previewTextArea}
              rows={5}
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

        {/* ACTIONS FOOTER */}
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