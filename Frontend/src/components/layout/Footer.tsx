// src/components/Footer.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import { FaFacebook, FaTwitter, FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import styles from "./Footer.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: FOOTER COMPONENT ===
   ========================================================================== */
export default function Footer() {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerInner}>
        
        {/* === BRAND FOCUS === */}
        <div className={styles.brandCenter}>
          <Link href="/" className={styles.logo}>
            Rakho<span className={styles.logoAccent}>Khata</span>
          </Link>
          <p className={styles.tagline}>Master your wealth with precision, purpose, and effortless clarity.</p>
        </div>

        {/* === TRUST & LEGAL NAVIGATION (🚀 CONNECTED TO /beta) === */}
        <nav className={styles.navLinks}>
          <Link href="/beta">Privacy Policy</Link>
          <Link href="/beta">Terms of Service</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/beta">About Us</Link>
        </nav>

        {/* === SOCIAL MEDIA LINKS === */}
        <div className={styles.socialIcons}>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook size={20} /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter size={20} /></a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub size={20} /></a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin size={20} /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={20} /></a>
        </div>

        {/* === FOOTER IDENTIFIER === */}
        <div className={styles.copy}>
          &copy; {new Date().getFullYear()} Rakho Khata — Crafted for the modern era.
        </div>

      </div>
    </footer>
  );
}
/* === SECTION 2 END === */