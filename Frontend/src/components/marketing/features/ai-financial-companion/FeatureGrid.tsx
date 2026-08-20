/* D:\Developer\Expense-Tracker\Frontend\src\components\marketing\features\ai-financial-companion\FeatureGrid.tsx */
"use client";

import React from "react";
import {
  FiUsers,
  FiActivity,
  FiCalendar,
  FiZap,
  FiTarget,
  FiGlobe,
} from "react-icons/fi";
import styles from "./FeatureGrid.module.css";

export interface GridItem {
  title: string;
  description: string;
  iconName: string;
}

export interface FeatureGridProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  items: GridItem[];
}

const renderGridIcon = (name: string) => {
  switch (name) {
    case "personas":
      return <FiUsers size={22} />;
    case "activity":
      return <FiActivity size={22} />;
    case "calendar":
      return <FiCalendar size={22} />;
    case "zap":
      return <FiZap size={22} />;
    case "target":
      return <FiTarget size={22} />;
    case "globe":
      return <FiGlobe size={22} />;
    default:
      return <FiZap size={22} />;
  }
};

export default function FeatureGrid({
  sectionTitle,
  sectionSubtitle,
  items,
}: FeatureGridProps) {
  return (
    <section 
      className={styles.gridSection} 
      aria-label="Core Engine Capabilities and Features"
    >
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <header className={styles.headerBlock}>
          <span className={styles.pillLabel}>Engine Capabilities</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && (
            <p className={styles.subtitle}>{sectionSubtitle}</p>
          )}
        </header>

        {/* 6-CARD SEMANTIC GRID */}
        <div className={styles.featuresGrid}>
          {items.map((item, idx) => (
            <article key={idx} className={styles.gridCard}>
              <div className={styles.iconBox} aria-hidden="true">
                {renderGridIcon(item.iconName)}
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}