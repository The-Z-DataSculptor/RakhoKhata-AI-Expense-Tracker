"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & COMPONENT DATA ===
   ========================================================================== */
import React, { useState } from "react";
import Link from "next/link";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";
import styles from "./FaqSection.module.css";

const FAQ_LIST = [
  {
    question: "Is RakhoKhaata really free to use?",
    answer:
      "Yes! Our Free Starter plan gives you up to 700 transaction entries every single month, multiple workspaces, and your private investment vault without paying a penny. There are no surprise trials or mandatory credit cards required.",
  },
  {
    question: "How does the AI Money Companion work?",
    answer:
      "Unlike confusing accounting tools, our AI Companion speaks in simple, everyday language. It looks at your recent spending to answer questions like 'Where did most of my money go this week?' or 'Am I on track for my savings goal?' and alerts you to forgotten subscription renewals.",
  },
  {
    question: "Can I track multiple currencies (like USD, PKR, and EUR) together?",
    answer:
      "Yes. RakhoKhaata is built for real-world global workers, freelancers, and families. You can earn in USD or EUR while spending locally in PKR or AED. The app automatically fetches live conversion rates so your total net worth and cash flow stay accurate.",
  },
  {
    question: "How does the Private Investment Vault protect my savings?",
    answer:
      "Your Investment Vault is protected behind an independent 4-digit security PIN. Even if family members, roommates, or colleagues are looking at your phone or laptop screen while you log daily expenses, your gold, crypto, savings, and stocks remain hidden.",
  },
  {
    question: "What is the difference between Personal and Business Workspaces?",
    answer:
      "Workspaces let you keep your life organized with zero overlap. Use your Personal Workspace for household groceries, rent, and utility bills, and switch to your Business Workspace with one tap to track client invoices, software licenses, and project expenses.",
  },
  {
    question: "Is my personal and financial data kept private?",
    answer:
      "Strictly private. We use industry-standard bcrypt and SHA-256 cryptographic hashing for all passwords and vault PINs. Furthermore, your confidential financial ledger entries and receipts are never used to train public AI models.",
  },
];
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: FAQ ACCORDION COMPONENT ===
   ========================================================================== */
export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className={styles.faqSection} aria-label="Frequently Asked Questions">
      <div className={styles.faqContainer}>
        
        {/* SECTION HEADER */}
        <div className={styles.headerBlock}>
          <div className={styles.sectionBadge}>
            <FiHelpCircle aria-hidden="true" /> Got Questions?
          </div>
          <h2 className={styles.mainTitle}>Frequently Asked Questions</h2>
          <p className={styles.subTitle}>
            Everything you need to know about tracking daily cash, multi-currency ledgers, and privacy.
          </p>
        </div>

        {/* ACCORDION LIST */}
        <div className={styles.accordionList} role="region" aria-label="FAQ Accordion">
          {FAQ_LIST.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={item.question} 
                className={`${styles.accordionItem} ${isOpen ? styles.itemOpen : ""}`}
              >
                <button
                  type="button"
                  className={styles.questionButton}
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  <FiChevronDown className={styles.chevronIcon} aria-hidden="true" />
                </button>

                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  className={`${styles.answerWrapper} ${isOpen ? styles.answerVisible : ""}`}
                >
                  <p className={styles.answerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM HELP PROMPT */}
        <div className={styles.bottomHelpCard}>
          <p>
            Have a question we didn&apos;t answer here?{" "}
            <Link href="/contact" className={styles.contactLink}>
              Chat with our support team →
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}