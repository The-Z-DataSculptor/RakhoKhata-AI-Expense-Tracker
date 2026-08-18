"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React from "react";
import Link from "next/link";
import { 
  FaGithub, 
  FaLinkedin, 
  FaTwitter, 
  FaYoutube, 
  FaFacebook, 
  FaInstagram, 
  FaDiscord, 
  FaReddit, 
  FaLock, 
  FaShieldAlt 
} from "react-icons/fa";
import styles from "./Footer.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: FOOTER COMPONENT ===
   ========================================================================== */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerContainer} aria-label="Site Footer">
      <div className={styles.footerInner}>
        
        {/* TOP GRID: BRAND SUMMARY & STRUCTURED SITE LINKS */}
        <div className={styles.footerGrid}>
          
          {/* COLUMN 1: BRAND IDENTITY & VALUE PROPOSITION */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logo} aria-label="RakhoKhaata Home">
              Rakho<span className={styles.logoAccent}>Khaata</span>
            </Link>
            <p className={styles.tagline}>
              Smart daily expense tracking, AI money insights, and private PIN-locked investment vaults built for real people, families, and side-hustlers.
            </p>
            <div className={styles.privacyBadge}>
              <FaLock className={styles.badgeIcon} aria-hidden="true" />
              <span>Zero Public AI Model Training</span>
            </div>
          </div>

          {/* COLUMNS 2 & 3 WRAPPER FOR MOBILE COMPACT GRID */}
          <div className={styles.linksWrapper}>
            {/* COLUMN 2: COMPANY */}
            <div className={styles.linkColumn}>
              <span className={styles.columnTitle}>Company</span>
              <ul className={styles.linkList}>
                <li>
                  <Link href="/about" className={styles.footerLink}>
                    About Mission
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={styles.footerLink}>
                    Help & Support
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className={styles.footerLink}>
                    Pricing & Plans
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className={styles.footerLink}>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: TRUST & LEGAL */}
            <div className={styles.linkColumn}>
              <span className={styles.columnTitle}>Trust & Legal</span>
              <ul className={styles.linkList}>
                <li>
                  <Link href="/privacy" className={styles.footerLink}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={styles.footerLink}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <div className={styles.securityStatus}>
                    <FaShieldAlt className={styles.shieldIcon} aria-hidden="true" />
                    <span>256-bit Protection</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <hr className={styles.footerDivider} />

        {/* BOTTOM BAR: COPYRIGHT & SOCIAL ICONS */}
        <div className={styles.bottomBar}>
          <div className={styles.copyrightText}>
            &copy; {currentYear} <strong>RakhoKhaata</strong>. Created with care by <strong>Syed Zain Hassan</strong>.
          </div>

          <div className={styles.socialIcons} aria-label="Social media profiles">
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="GitHub"
              onClick={(e) => e.preventDefault()}
            >
              <FaGithub size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="LinkedIn"
              onClick={(e) => e.preventDefault()}
            >
              <FaLinkedin size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="Twitter / X"
              onClick={(e) => e.preventDefault()}
            >
              <FaTwitter size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="YouTube"
              onClick={(e) => e.preventDefault()}
            >
              <FaYoutube size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="Facebook"
              onClick={(e) => e.preventDefault()}
            >
              <FaFacebook size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="Instagram"
              onClick={(e) => e.preventDefault()}
            >
              <FaInstagram size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="Discord"
              onClick={(e) => e.preventDefault()}
            >
              <FaDiscord size={18} />
            </a>
            <a 
              href="#!" 
              className={styles.socialIconBtn}
              aria-label="Reddit"
              onClick={(e) => e.preventDefault()}
            >
              <FaReddit size={18} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}