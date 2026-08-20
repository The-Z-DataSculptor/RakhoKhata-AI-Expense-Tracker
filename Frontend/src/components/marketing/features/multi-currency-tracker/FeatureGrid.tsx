"use client";

import React from "react";
import {
  FiGlobe,
  FiTrendingUp,
  FiLayers,
  FiLock,
  FiRefreshCw,
  FiWifiOff,
} from "react-icons/fi";
import styles from "./FeatureGrid.module.css";

export interface FeatureGridItem {
  title: string;
  description: string;
  iconName?: string;
}

export interface FeatureGridProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  items: FeatureGridItem[];
}

function renderGridIcon(iconName?: string) {
  switch (iconName) {
    case "globe":
      return <FiGlobe size={22} />;
    case "trending":
      return <FiTrendingUp size={22} />;
    case "layers":
      return <FiLayers size={22} />;
    case "lock":
      return <FiLock size={22} />;
    case "refresh":
      return <FiRefreshCw size={22} />;
    case "offline":
      return <FiWifiOff size={22} />;
    default:
      return <FiGlobe size={22} />;
  }
}

export default function FeatureGrid({
  sectionTitle,
  sectionSubtitle,
  items,
}: FeatureGridProps) {
  return (
    <section className={styles.gridSection} aria-label="Feature Capabilities">
      <div className={styles.container}>
        
        {/* HEADER BLOCK */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Key Capabilities</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 6-CARD GRID */}
        <div className={styles.featuresGrid}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.gridCard}>
              <div className={styles.iconBox}>
                {renderGridIcon(item.iconName)}
              </div>
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