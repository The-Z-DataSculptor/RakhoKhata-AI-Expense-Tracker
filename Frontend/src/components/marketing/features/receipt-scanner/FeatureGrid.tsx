/* src/components/marketing/features/receipt-scanner/FeatureGrid.tsx */

"use client";

import React from "react";
import {
  FiCamera,
  FiSmartphone,
  FiFileText,
  FiGlobe,
  FiZap,
  FiLayers,
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
    case "camera":
      return <FiCamera size={22} />;
    case "smartphone":
      return <FiSmartphone size={22} />;
    case "file":
      return <FiFileText size={22} />;
    case "globe":
      return <FiGlobe size={22} />;
    case "zap":
      return <FiZap size={22} />;
    case "layers":
      return <FiLayers size={22} />;
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
    <section className={styles.gridSection} aria-label="Receipt Scanner Capabilities">
      <div className={styles.container}>
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Engine Capabilities</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 6-CARD GRID */}
        <div className={styles.featuresGrid}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.gridCard}>
              <div className={styles.iconBox}>{renderGridIcon(item.iconName)}</div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}