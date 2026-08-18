"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS & CONTRACTS ===
   ========================================================================== */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiShield, 
  FiLock, 
  FiDatabase, 
  FiCpu, 
  FiEye, 
  FiTrash2, 
  FiMail, 
  FiCheckCircle, 
  FiArrowUp,
  FiChevronDown,
  FiList
} from "react-icons/fi";
import styles from "./page.module.css";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: "overview", title: "1. Overview & Scope", icon: <FiShield /> },
  { id: "data-collection", title: "2. Information We Collect", icon: <FiDatabase /> },
  { id: "data-usage", title: "3. How We Use Information", icon: <FiEye /> },
  { id: "ai-processing", title: "4. AI & Gemini Integration", icon: <FiCpu /> },
  { id: "security-vault", title: "5. Security & Vault Protection", icon: <FiLock /> },
  { id: "third-parties", title: "6. Third-Party Services", icon: <FiCheckCircle /> },
  { id: "user-rights", title: "7. User Rights & Data Deletion", icon: <FiTrash2 /> },
  { id: "contact", title: "8. Contact & Legal Inquiries", icon: <FiMail /> },
];
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: PRIVACY CLIENT COMPONENT ===
   ========================================================================== */
export default function PrivacyClient() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

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
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
      setIsMobileNavOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentActiveTitle = SECTIONS.find((s) => s.id === activeSection)?.title || "Navigation";

  return (
    <main className={styles.privacyCanvas}>
      {/* Hero Header */}
      <section className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <FiShield className={styles.heroBadgeIcon} />
          <span>Security & Transparency</span>
        </div>
        <h1 className={styles.heroHeadline}>Privacy Policy</h1>
        <p className={styles.heroSubtext}>
          Learn how RakhoKhaata secures your financial ledgers, protects your identity, and utilizes artificial intelligence with strict enterprise privacy standards.
        </p>
        <div className={styles.policyMetaBar}>
          <span>Effective Date: <strong>August 18, 2026</strong></span>
          <span className={styles.metaDivider}>•</span>
          <span>Version: <strong>2.4</strong></span>
        </div>
      </section>

      {/* MOBILE TABLE OF CONTENTS (Compact Accordion) */}
      <div className={styles.mobileNavAccordion}>
        <button 
          type="button" 
          className={styles.mobileNavToggleBtn}
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-expanded={isMobileNavOpen}
        >
          <div className={styles.mobileNavBtnText}>
            <FiList className={styles.mobileNavListIcon} />
            <span>{currentActiveTitle}</span>
          </div>
          <FiChevronDown className={`${styles.chevronIcon} ${isMobileNavOpen ? styles.chevronOpen : ""}`} />
        </button>

        {isMobileNavOpen && (
          <div className={styles.mobileDropdownMenu}>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`${styles.mobileNavItem} ${activeSection === sec.id ? styles.mobileNavItemActive : ""}`}
              >
                <span className={styles.navIcon}>{sec.icon}</span>
                <span>{sec.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout Body */}
      <div className={styles.layoutContainer}>
        {/* Desktop Sticky Table of Contents Sidebar */}
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
          <section id="overview" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiShield className={styles.sectionIcon} /> 1. Overview & Scope
            </h2>
            <p>
              Welcome to <strong>RakhoKhaata</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to upholding the highest standards of data security and confidentiality. This Privacy Policy details our practices concerning the collection, storage, processing, and disclosure of personal and financial information when you access our multi-currency tracking software, web applications, and related APIs (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By registering an account, integrating third-party login providers, or logging financial transactions on RakhoKhaata, you acknowledge and agree to the data collection and processing methods outlined herein.
            </p>
          </section>

          {/* Section 2 */}
          <section id="data-collection" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiDatabase className={styles.sectionIcon} /> 2. Information We Collect
            </h2>
            <p>
              To deliver accurate multi-currency financial tracking, automated ledger analytics, and contextual AI coaching, we collect the following categories of information:
            </p>

            <h3 className={styles.subHeader}>A. Account & Identity Information</h3>
            <ul className={styles.bulletList}>
              <li><strong>Personal Profile:</strong> Full name, verified email address, country of residence, preferred base currency (e.g., PKR, USD), spoken languages, occupation style, and financial goals.</li>
              <li><strong>Authentication Credentials:</strong> Passwords hashed using one-way <code>bcrypt</code> algorithms (salt rounds = 12). Raw passwords are never visible to or stored by our systems.</li>
              <li><strong>OAuth Profiles:</strong> When signing in via Google, we collect your unique Google Provider Account ID, email address, name, and profile picture avatar.</li>
            </ul>

            <h3 className={styles.subHeader}>B. Financial Ledger & Workspace Data</h3>
            <ul className={styles.bulletList}>
              <li><strong>Transactions:</strong> Numerical amounts, original currency identifiers, normalized USD baseline anchors (<code>baseAmountUSD</code>), transaction dates, descriptions/merchant names, flow types (Income or Expense), and category tags.</li>
              <li><strong>Multi-Tenancy Workspaces:</strong> Workspace names, designated operating currencies, and custom budget thresholds.</li>
              <li><strong>Vault & Assets:</strong> Asset symbols, asset classifications, purchase allocations, and encrypted Vault access states.</li>
            </ul>

            <h3 className={styles.subHeader}>C. Uploaded Documents & Receipt Files</h3>
            <p>
              When utilizing our AI-powered receipt scanning features, uploaded document buffers (JPEG, PNG, WEBP, PDF) are processed in-memory for structured data extraction.
            </p>
          </section>

          {/* Section 3 */}
          <section id="data-usage" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiEye className={styles.sectionIcon} /> 3. How We Use Information
            </h2>
            <p>We process your data strictly to operate, maintain, and enhance the RakhoKhaata platform:</p>
            <ul className={styles.bulletList}>
              <li><strong>Core Ledger Computation:</strong> Standardizing multi-currency transactions, calculating cash flow metrics, and verifying budget compliance.</li>
              <li><strong>Authentication & Security:</strong> Validating session tokens, preventing Broken Object-Level Authorization (BOLA/IDOR) via strict workspace tenant verification, and issuing security alerts.</li>
              <li><strong>Automated Notifications:</strong> Sending password reset tokens, account verification links, and scheduled financial digests.</li>
              <li><strong>Live Exchange Rate Adjustments:</strong> Converting transaction values against live reference currency rates.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="ai-processing" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiCpu className={styles.sectionIcon} /> 4. AI & Gemini Integration
            </h2>
            <div className={styles.highlightCallout}>
              <strong>Zero Model-Training Guarantee:</strong> User financial ledger records, transaction memos, and receipt images sent to Google Gemini APIs are processed exclusively in real-time runtime memory. Your confidential financial data is <u>never</u> used to train public foundation artificial intelligence models.
            </div>
            <p>
              RakhoKhaata utilizes Google Gemini Large Language Models (LLMs) to power our <strong>Structured Retrieval-Augmented Generation (RAG)</strong> architecture and OCR features:
            </p>
            <ul className={styles.bulletList}>
              <li><strong>Contextual AI Buddy & Analysis:</strong> When you request an AI evaluation or greeting, a bounded snapshot (up to 40 recent transactions and active budget limits) is securely transmitted via TLS 1.3 to generate personalized insights aligned with your selected AI Persona.</li>
              <li><strong>Receipt OCR Scanning:</strong> Uploaded receipts are parsed by Gemini vision models to automatically extract the vendor name, date, total amount, and currency.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="security-vault" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiLock className={styles.sectionIcon} /> 5. Security & Vault Protection
            </h2>
            <p>We apply defense-in-depth architectural measures across every layer of our platform:</p>
            <ul className={styles.bulletList}>
              <li><strong>PIN & Token Hashing:</strong> Investment Vault PINs and verification tokens (such as password reset and email activation codes) are stored solely as cryptographic SHA-256 / bcrypt hashes.</li>
              <li><strong>Encrypted Transport:</strong> All data exchanged between your browser, our Next.js frontend, Node.js API servers, and PostgreSQL databases is encrypted using Transport Layer Security (TLS/HTTPS).</li>
              <li><strong>Session Cookies:</strong> Authentication tokens are stored in secure, <code>httpOnly</code>, <code>SameSite</code> cookies to eliminate XSS token theft vectors.</li>
              <li><strong>Tenant Isolation:</strong> Every database mutation strictly verifies relational workspace ownership before data is read or modified.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="third-parties" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiCheckCircle className={styles.sectionIcon} /> 6. Third-Party Services
            </h2>
            <p>
              We do not sell, rent, or trade your personal or financial data. We share minimal data exclusively with trusted third-party infrastructure providers strictly necessary to deliver the Service:
            </p>
            
            {/* Desktop Table View */}
            <div className={styles.tableWrapper}>
              <table className={styles.legalTable}>
                <thead>
                  <tr>
                    <th>Service Provider</th>
                    <th>Purpose</th>
                    <th>Data Transferred</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Google OAuth 2.0</strong></td>
                    <td>Single Sign-On (SSO) Authentication</td>
                    <td>Email, Name, Social Avatar URL</td>
                  </tr>
                  <tr>
                    <td><strong>Google Gemini API</strong></td>
                    <td>AI Companion Insights & Receipt OCR</td>
                    <td>Selected Ledger Memos & Receipt Image Buffers</td>
                  </tr>
                  <tr>
                    <td><strong>ExchangeRate API</strong></td>
                    <td>Global Live Currency Conversion Rates</td>
                    <td>Currency ISO Codes (No User Identity)</td>
                  </tr>
                  <tr>
                    <td><strong>Transactional Email Provider</strong></td>
                    <td>Account Alerts & Security Notifications</td>
                    <td>User Email Address & Verification Links</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (<= 640px) */}
            <div className={styles.mobileCardsList}>
              <div className={styles.mobileCard}>
                <div className={styles.mobileCardTitle}>Google OAuth 2.0</div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Purpose:</span>
                  <span>Single Sign-On Authentication</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Transferred:</span>
                  <span>Email, Name, Avatar URL</span>
                </div>
              </div>

              <div className={styles.mobileCard}>
                <div className={styles.mobileCardTitle}>Google Gemini API</div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Purpose:</span>
                  <span>AI Insights & Receipt OCR</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Transferred:</span>
                  <span>Ledger Memos & Receipt Buffers</span>
                </div>
              </div>

              <div className={styles.mobileCard}>
                <div className={styles.mobileCardTitle}>ExchangeRate API</div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Purpose:</span>
                  <span>Live Currency Conversion Rates</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Transferred:</span>
                  <span>Currency ISO Codes (Zero Identity)</span>
                </div>
              </div>

              <div className={styles.mobileCard}>
                <div className={styles.mobileCardTitle}>Transactional Email</div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Purpose:</span>
                  <span>Account & Security Notifications</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Transferred:</span>
                  <span>Email & Verification Links</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="user-rights" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiTrash2 className={styles.sectionIcon} /> 7. User Rights & Data Deletion
            </h2>
            <p>
              You maintain complete ownership of your data. You may exercise the following rights directly from your account settings at any time:
            </p>
            <ul className={styles.bulletList}>
              <li><strong>Access & Modification:</strong> View, update, or correct your personal profile, currency choices, and categorization templates.</li>
              <li><strong>Workspace & Ledger Deletion:</strong> Deleting a workspace immediately and permanently cascades deletion to all associated transactions, categories, budgets, and investments via database-level cascade rules.</li>
              <li><strong>Permanent Account Purge:</strong> You may request complete account deletion. Upon verification, all relational records, hashed credentials, and ledger entries are permanently erased from our primary databases.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="contact" className={styles.docSection}>
            <h2 className={styles.sectionHeader}>
              <FiMail className={styles.sectionIcon} /> 8. Contact & Legal Inquiries
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our security practices, please contact our privacy team:
            </p>
            <div className={styles.contactCard}>
              <p><strong>RakhoKhaata Security & Privacy Team</strong></p>
              <p>Email: <a href="mailto:support@rakhokhaata.com">support@rakhokhaata.com</a></p>
              <p>Inquiries: <Link href="/contact">Support Contact Portal</Link></p>
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
  );
}