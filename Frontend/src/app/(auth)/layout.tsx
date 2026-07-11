// src/app/(auth)/layout.tsx

import React from "react";
import styles from "./layout.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.authContainer}>{children}</div>;
}