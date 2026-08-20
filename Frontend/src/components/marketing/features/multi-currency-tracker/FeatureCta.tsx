"use client";

import React from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import styles from "./FeatureCta.module.css";

export interface FeatureCtaProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
}

const GUARANTEES = [
  "Free to get started",
  "No credit card required",
  "Takes under 2 minutes",
] as const;

export default function FeatureCta({
  title,
  description,
  buttonText = "Start Tracking In Any Currency",
  buttonLink = "/signup",
}: FeatureCtaProps) {
  return (
    <section className={styles.ctaSection} aria-label="Sign Up Call To Action">
      <div className={styles.container}>
        <div className={styles.ctaCard}>
          {/* BACKGROUND GLOW */}
          <div className={styles.cardGlow} aria-hidden="true" />

          {/* CARD CONTENT */}
          <div className={styles.cardContent}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>

            <div className={styles.actionGroup}>
              <Link href={buttonLink} className={styles.ctaButton}>
                <span>{buttonText}</span>
                <FiArrowRight className={styles.arrowIcon} size={18} />
              </Link>
            </div>

            {/* TRUST BADGES */}
            <div className={styles.guaranteeRow}>
              {GUARANTEES.map((item) => (
                <div key={item} className={styles.guaranteeItem}>
                  <FiCheckCircle className={styles.checkIcon} size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}