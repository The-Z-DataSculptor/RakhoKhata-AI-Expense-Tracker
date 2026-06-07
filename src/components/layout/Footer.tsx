/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import { FaFacebook, FaTwitter, FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import styles from "./Footer.module.css";

/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: FOOTER COMPONENT ===
   ========================================================================== */
export default function Footer() {
  /*
    The "Why" Comment Layer:
    We are using 'react-icons/fa' for all social icons to maintain a single, 
    consistent library. The icons are wrapped in anchor tags to ensure they 
    remain accessible and easily linkable to external profiles.
  */

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerInner}>
        
        {/* === BRAND FOCUS === */}
        <div className={styles.brandCenter}>
          <div className={styles.logo}>
            Rakho<span className={styles.logoAccent}>Khata</span>
          </div>
          <p className={styles.tagline}>Master your wealth with precision, purpose, and effortless clarity.</p>
        </div>

        {/* === TRUST & LEGAL NAVIGATION (Google-Compliant) === */}
        <nav className={styles.navLinks}>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
          <a href="/contact">Contact Us</a>
          <a href="/about">About Us</a>
        </nav>

        {/* === SOCIAL MEDIA LINKS === */}
        <div className={styles.socialIcons}>
          <a href="https://facebook.com" aria-label="Facebook"><FaFacebook size={20} /></a>
          <a href="https://twitter.com" aria-label="Twitter"><FaTwitter size={20} /></a>
          <a href="https://github.com" aria-label="GitHub"><FaGithub size={20} /></a>
          <a href="https://linkedin.com" aria-label="LinkedIn"><FaLinkedin size={20} /></a>
          <a href="https://instagram.com" aria-label="Instagram"><FaInstagram size={20} /></a>
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