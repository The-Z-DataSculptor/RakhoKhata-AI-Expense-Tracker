"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & SECTION CONTRACTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiFileText, 
  FiUserCheck, 
  FiShield, 
  FiCpu, 
  FiGlobe, 
  FiCreditCard, 
  FiAlertCircle, 
  FiTrash2, 
  FiMail, 
  FiArrowUp 
} from "react-icons/fi";
import styles from "./page.module.css";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: "acceptance", title: "1. Acceptance of Terms", icon: <FiFileText /> },
  { id: "accounts", title: "2. Account & Vault Security", icon: <FiShield /> },
  { id: "disclaimer", title: "3. Financial Tool Disclaimer", icon: <FiAlertCircle /> },
  { id: "ai-terms", title: "4. AI & Gemini Fair Usage", icon: <FiCpu /> },
  { id: "currency", title: "5. Live Exchange Rates", icon: <FiGlobe /> },
  { id: "subscriptions", title: "6. Free Access & Plans", icon: <FiCreditCard /> },
  { id: "user-conduct", title: "7. Acceptable Use & Conduct", icon: <FiUserCheck /> },
  { id: "termination", title: "8. Data Purge & Account Deletion", icon: <FiTrash2 /> },
  { id: "contact", title: "9. Contact & Inquiries", icon: <FiMail /> },
];

const jsonLdTerms = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Terms of Service | RakhoKhaata",
  "url": "https://rakhokhaata.com/terms",
  "description": "Clear guidelines on account safety, multi-currency ledger tools, AI companion usage, and user rights.",
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TERMS PAGE COMPONENT ===
   ========================================================================== */
export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>("acceptance");
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const sectionElements = SECTIONS.map((sec) => document.getElementById(sec.id));
      const scrollPosition = window.scrollY + 180;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTerms) }}
      />

      <main className={styles.termsCanvas}>
        {/* Hero Header */}
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>
            <FiFileText className={styles.heroBadgeIcon} />
            <span>Legal & Service Agreement</span>
          </div>
          <h1 className={styles.heroHeadline}>Terms of Service</h1>
          <p className={styles.heroSubtext}>
            Plain, transparent rules for using RakhoKhaata. Designed to protect your privacy, ensure secure financial logging, and provide clear service expectations.
          </p>
          <div className={styles.policyMetaBar}>
            <span>Last Updated: <strong>August 18, 2026</strong></span>
            <span className={styles.metaDivider}>•</span>
            <span>Version: <strong>2.0</strong></span>
          </div>
        </section>

        {/* Main Layout Body */}
        <div className={styles.layoutContainer}>
          {/* Sticky Table of Contents Sidebar */}
          <aside className={styles.sidebarStickyNav} aria-label="Table of contents">
            <div className={styles.sidebarCard}>
              <h2 className={styles.sidebarTitle}>Navigation</h2>
              <nav className={styles.navLinkList}>
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`${styles.navLinkItem} ${
                      activeSection === sec.id ? styles.navLinkActive : ""
                    }`}
                  >
                    <span className={styles.navIcon}>{sec.icon}</span>
                    <span className={styles.navTitleText}>{sec.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Legal Text Content */}
          <article className={styles.contentDoc}>
            {/* Section 1 */}
            <section id="acceptance" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiFileText className={styles.sectionIcon} /> 1. Acceptance of Terms
              </h2>
              <p>
                Welcome to <strong>RakhoKhaata</strong> (&quot;the Service&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), created and maintained by independent software engineer <strong>Syed Zain Hassan</strong>. 
              </p>
              <p>
                By signing up, logging in, or accessing any part of the web application, you acknowledge that you have read, understood, and agreed to these Terms of Service. RakhoKhaata is a safe, family-friendly tool built for everyday individuals, workers, parents, and freelancers worldwide.
              </p>
            </section>

            {/* Section 2 */}
            <section id="accounts" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiShield className={styles.sectionIcon} /> 2. Account & Vault Security
              </h2>
              <p>
                We engineer RakhoKhaata with defense-in-depth security to protect your financial records:
              </p>
              <ul className={styles.bulletList}>
                <li><strong>Token & Password Encryption:</strong> Passwords and session tokens are protected using industry-standard hashing and secure session cookies.</li>
                <li><strong>Investment Vault PIN:</strong> Your 4-digit Investment Vault PIN is hashed cryptographically. You are responsible for keeping this PIN confidential on shared household devices.</li>
                <li><strong>Multi-Tenancy Isolation:</strong> All workspace transactions and budgets are strictly tied to your authenticated account ID to prevent unauthorized data access.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="disclaimer" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiAlertCircle className={styles.sectionIcon} /> 3. Financial Tool Disclaimer
              </h2>
              <div className={styles.highlightCallout}>
                <strong>No Certified Financial Advice:</strong> RakhoKhaata is an automated bookkeeping and tracking tool. All visual budget gauges, safe-to-spend estimations, and AI insights are provided strictly for informational and organizational convenience.
              </div>
              <p>
                RakhoKhaata does not provide certified financial, tax, or investment advisory services. Always consult certified financial professionals before making major investment, tax, or borrowing decisions.
              </p>
            </section>

            {/* Section 4 */}
            <section id="ai-terms" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiCpu className={styles.sectionIcon} /> 4. AI & Gemini Fair Usage Policy
              </h2>
              <p>
                Our conversational AI Money Buddy and OCR Receipt Scanner are powered by Google Gemini APIs to analyze your recent transactions and extract receipt amounts:
              </p>
              <ul className={styles.bulletList}>
                <li><strong>Intended Purpose:</strong> AI capabilities are provided exclusively to help you understand your spending patterns, categorize expenses, and scan paper receipts.</li>
                <li><strong>Fair Usage Limits:</strong> To ensure high availability and prevent automated abuse, excessive or automated script-based AI queries are subject to standard rate-limiting.</li>
                <li><strong>Zero Model Training:</strong> Your confidential receipts and transaction memos sent for real-time analysis are never used to train public artificial intelligence models.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="currency" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiGlobe className={styles.sectionIcon} /> 5. Live Multi-Currency Conversion
              </h2>
              <p>
                RakhoKhaata integrates live exchange rate feeds from trusted third-party providers (such as ExchangeRate-API) to automatically convert multi-currency inflows (USD, EUR, AED, etc.) into your domestic base ledger (e.g., PKR, USD).
              </p>
              <p>
                Exchange rates are provided for estimation purposes and may experience slight real-time market variances. We are not responsible for discrepancies caused by bank spread fees or credit card foreign exchange markups.
              </p>
            </section>

            {/* Section 6 */}
            <section id="subscriptions" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiCreditCard className={styles.sectionIcon} /> 6. Free Access & Future Upgrades
              </h2>
              <ul className={styles.bulletList}>
                <li><strong>Current Free Access:</strong> RakhoKhaata is currently 100% free to use. All registered users can track daily expenses, configure dual workspaces, and lock their Investment Vault with zero mandatory subscription fees.</li>
                <li><strong>Future Optional Upgrades:</strong> In the future, optional Pro tiers may be introduced for high-volume automation. Any pricing updates will be communicated clearly and transparently in advance.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="user-conduct" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiUserCheck className={styles.sectionIcon} /> 7. Acceptable Use & Conduct
              </h2>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul className={styles.bulletList}>
                <li>Attempting to bypass tenant workspace isolation or access another user&apos;s ledger.</li>
                <li>Running automated scraping bots, denial-of-service scripts, or exploiting API endpoints.</li>
                <li>Using our OCR receipt scanner to process malicious, unlawful, or harmful image payloads.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="termination" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiTrash2 className={styles.sectionIcon} /> 8. Data Purge & Account Deletion
              </h2>
              <p>
                You maintain total ownership of your financial records. You may permanently delete your individual workspaces or request a full account purge at any time from your account settings.
              </p>
              <p>
                Upon account deletion, all relational database records, encrypted credentials, categories, and investment balances are permanently erased from our primary database servers.
              </p>
            </section>

            {/* Section 9 */}
            <section id="contact" className={styles.docSection}>
              <h2 className={styles.sectionHeader}>
                <FiMail className={styles.sectionIcon} /> 9. Contact & Inquiries
              </h2>
              <p>
                If you have any questions, feedback, or inquiries regarding these Terms of Service, please reach out directly:
              </p>
              <div className={styles.contactCard}>
                <p><strong>Syed Zain Hassan</strong> — Independent Developer, RakhoKhaata</p>
                <p>Email: <a href="mailto:ZainHassan@protonmail.com">ZainHassan@protonmail.com</a></p>
                <p>Help Center: <Link href="/contact">Support Contact Form</Link></p>
              </div>
            </section>
          </article>
        </div>

        {/* Back to Top Floating Button */}
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className={styles.backToTopBtn}
            title="Scroll back to top"
            aria-label="Scroll back to top"
          >
            <FiArrowUp size={18} />
          </button>
        )}
      </main>
    </>
  );
}