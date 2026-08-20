"use client";

import React from "react";
import {
  FiLock,
  FiPercent,
  FiGlobe,
  FiBookOpen,
  FiActivity,
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
    case "lock":
      return <FiLock size={22} />;
    case "calculator":
      return <FiPercent size={22} />;
    case "globe":
      return <FiGlobe size={22} />;
    case "book":
      return <FiBookOpen size={22} />;
    case "activity":
      return <FiActivity size={22} />;
    case "box":
      return <FiLayers size={22} />;
    default:
      return <FiLayers size={22} />;
  }
};

export default function FeatureGrid({
  sectionTitle,
  sectionSubtitle,
  items,
}: FeatureGridProps) {
  return (
    <section className={styles.gridSection} aria-label="Investment Vault Capabilities">
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