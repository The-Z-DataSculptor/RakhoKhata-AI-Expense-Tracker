/* D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\ai-financial-companion\FeatureFaq.tsx */

"use client";

import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./FeatureFaq.module.css";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FeatureFaqProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  items: FaqItem[];
}

export default function FeatureFaq({
  sectionTitle,
  sectionSubtitle,
  items,
}: FeatureFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className={styles.faqSection} aria-label="Frequently Asked Questions">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Clear Answers</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* FAQ ACCORDION LIST */}
        <div className={styles.accordionWrapper}>
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}
              >
                <button
                  type="button"
                  className={styles.questionButton}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  <div
                    className={`${styles.chevronCircle} ${
                      isOpen ? styles.chevronRotated : ""
                    }`}
                  >
                    <FiChevronDown size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div className={styles.answerContainer}>
                    <p className={styles.answerText}>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}