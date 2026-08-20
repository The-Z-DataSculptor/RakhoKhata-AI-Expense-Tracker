"use client";

import React from "react";
import {
  FiPieChart,
  FiClock,
  FiAlertTriangle,
  FiGlobe,
  FiCalendar,
  FiShield,
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
    case "donut":
      return <FiPieChart size={22} />;
    case "clock":
      return <FiClock size={22} />;
    case "alert":
      return <FiAlertTriangle size={22} />;
    case "globe":
      return <FiGlobe size={22} />;
    case "calendar":
      return <FiCalendar size={22} />;
    case "shield":
      return <FiShield size={22} />;
    default:
      return <FiPieChart size={22} />;
  }
};

export default function FeatureGrid({
  sectionTitle,
  sectionSubtitle,
  items,
}: FeatureGridProps) {
  return (
    <section className={styles.gridSection} aria-label="Core Budget Capabilities">
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.headerBlock}>
          <span className={styles.pillLabel}>Engine Capabilities</span>
          <h2 className={styles.title}>{sectionTitle}</h2>
          {sectionSubtitle && <p className={styles.subtitle}>{sectionSubtitle}</p>}
        </div>

        {/* 6-CARD GRID */}
        <div className={styles.cardsGrid}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.cardItem}>
              <div className={styles.iconBox}>{renderGridIcon(item.iconName)}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}