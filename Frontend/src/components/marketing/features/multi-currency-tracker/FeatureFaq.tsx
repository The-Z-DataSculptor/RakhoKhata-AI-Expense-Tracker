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

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  // Structured Schema for Google & AI Search Engines (JSON-LD)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className={styles.faqSection} aria-label="Frequently Asked Questions">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Got Questions?</span>
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
                    <FiChevronDown size={18} />
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