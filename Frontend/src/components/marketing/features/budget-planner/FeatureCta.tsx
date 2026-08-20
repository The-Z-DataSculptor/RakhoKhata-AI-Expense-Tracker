"use client";

import React from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import styles from "./FeatureCta.module.css";

export interface FeatureCtaProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const BULLET_POINTS = [
  "No credit card required",
  "Set up in under 2 minutes",
  "Free forever core tier",
] as const;

export default function FeatureCta({
  title,
  description,
  buttonText,
  buttonLink,
}: FeatureCtaProps) {
  return (
    <section className={styles.ctaSection} aria-label="Call To Action">
      <div className={styles.container}>
        <div className={styles.ctaCard}>
          <div className={styles.glowLight} aria-hidden="true" />
          
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>

          <Link href={buttonLink} className={styles.actionBtn}>
            <span>{buttonText}</span>
            <FiArrowRight size={16} />
          </Link>

          <div className={styles.bulletsRow}>
            {BULLET_POINTS.map((b) => (
              <div key={b} className={styles.bulletItem}>
                <FiCheckCircle className={styles.checkIcon} size={14} />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}