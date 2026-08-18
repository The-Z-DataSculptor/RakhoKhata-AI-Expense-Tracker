/* ==========================================================================
   === SECTION 1: IMPORTS & SEO METADATA ===
   ========================================================================== */
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact & Support | RakhoKhaata Help Center",
  description:
    "Have questions about RakhoKhaata? Get in touch with our team for account support, feature requests, feedback, and enterprise inquiries.",
  keywords: [
    "Contact RakhoKhaata",
    "RakhoKhaata customer support",
    "expense tracker help center",
    "feature request RakhoKhaata",
    "feedback RakhoKhaata",
    "Zain Hassan contact",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Support | RakhoKhaata",
    description:
      "Get in touch with the RakhoKhaata team. We are here to help with your account, feedback, feature suggestions, or business inquiries.",
    url: "/contact",
    siteName: "RakhoKhaata",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Support | RakhoKhaata",
    description:
      "Need help or have an idea to improve RakhoKhaata? Connect with our support and developer team directly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: STRUCTURED SCHEMA (JSON-LD) ===
   ========================================================================== */
const jsonLdContact = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": "https://rakhokhaata.com/contact#webpage",
      "url": "https://rakhokhaata.com/contact",
      "name": "Contact & Support Center | RakhoKhaata",
      "description":
        "Official contact and technical support page for RakhoKhaata expense tracker users, partners, and community inquiries.",
      "mainEntity": {
        "@type": "Organization",
        "name": "RakhoKhaata",
        "url": "https://rakhokhaata.com",
        "email": "ZainHassan@protonmail.com",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "email": "ZainHassan@protonmail.com",
            "contactType": "customer support",
            "availableLanguage": ["English", "Urdu"],
          },
        ],
      },
    },
  ],
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: INLINE VECTOR ICONS ===
   ========================================================================== */
const Icons = {
  Mail: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  HelpCircle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Linkedin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Github: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  ),
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: CONTACT PAGE COMPONENT ===
   ========================================================================== */
export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdContact) }}
      />

      <main className={styles.pageContainer}>
        {/* HERO HEADER */}
        <section className={styles.heroSection}>
          <div className={styles.supportBadge}>
            <span aria-hidden="true">💬</span> We&apos;re Here to Help
          </div>
          <h1 className={styles.heroTitle}>
            How Can We Assist You <br />
            <span className={styles.gradientText}>With RakhoKhaata?</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Have a question about your ledgers, need technical support, or want to suggest a new feature? 
            Reach out directly—we read and respond to every message.
          </p>
        </section>

        {/* 2-COLUMN MAIN CONTENT WRAPPER */}
        <div className={styles.mainGridWrapper}>
          
          {/* LEFT COLUMN: CONTACT CHANNELS & PROMISES */}
          <div className={styles.contactInfoCol}>
            
            {/* CARD 1: DIRECT EMAIL */}
            <div className={styles.infoCard}>
              <div className={styles.cardIconBox}>
                <Icons.Mail />
              </div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>Direct Support & Feedback</h2>
                <p className={styles.cardDesc}>
                  For help with your account, transaction sync questions, or general product feedback.
                </p>
                <a href="mailto:ZainHassan@protonmail.com" className={styles.channelLink}>
                  ZainHassan@protonmail.com
                </a>
              </div>
            </div>

            {/* CARD 2: FEATURE SUGGESTIONS */}
            <div className={styles.infoCard}>
              <div className={styles.cardIconBox}>
                <Icons.MessageSquare />
              </div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>Feature Requests & Roadmap</h2>
                <p className={styles.cardDesc}>
                  Want a specific currency, export format, or custom AI persona added? We build based on what you need.
                </p>
                <span className={styles.subtextTag}>Reviewed every release cycle</span>
              </div>
            </div>

            {/* CARD 3: RESPONSE COMMITMENT */}
            <div className={styles.commitmentCard}>
              <div className={styles.commitmentHeader}>
                <Icons.Clock />
                <span className={styles.commitmentTitle}>Our Response Commitment</span>
              </div>
              <p className={styles.commitmentText}>
                We prioritize user inquiries and aim to reply within <strong>24 to 48 hours</strong>. 
                For instant troubleshooting, check our FAQ section below.
              </p>
            </div>

            {/* CONNECT CHANNELS */}
            <div className={styles.socialRow}>
              <span className={styles.socialLabel}>Developer & Updates:</span>
              <div className={styles.socialLinks}>
                <a
                  href="https://www.linkedin.com/in/syed-zain-hassan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialPill}
                  aria-label="LinkedIn"
                >
                  <Icons.Linkedin /> LinkedIn
                </a>
                <a
                  href="https://github.com/The-Z-DataSculptor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialPill}
                  aria-label="GitHub"
                >
                  <Icons.Github /> GitHub
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: QUICK MESSAGE COMPOSER */}
          <div className={styles.formContainerCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Send Us a Message</h2>
              <p className={styles.formSubtitle}>
                Fill out the details below and we will get back to your email directly.
              </p>
            </div>

            <form
              action="mailto:ZainHassan@protonmail.com"
              method="GET"
              className={styles.contactForm}
            >
              <div className={styles.inputGroup}>
                <label htmlFor="user-name" className={styles.inputLabel}>
                  Your Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  name="name"
                  placeholder="e.g. Sarah Khan"
                  required
                  className={styles.textInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="user-email" className={styles.inputLabel}>
                  Email Address
                </label>
                <input
                  id="user-email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  className={styles.textInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="inquiry-type" className={styles.inputLabel}>
                  Inquiry Topic
                </label>
                <select id="inquiry-type" name="subject" className={styles.selectInput}>
                  <option value="[RakhoKhaata Support] General Help">General Account Help</option>
                  <option value="[RakhoKhaata Feature] Idea Request">Suggest a New Feature</option>
                  <option value="[RakhoKhaata Bug] Technical Issue">Report a Bug / Issue</option>
                  <option value="[RakhoKhaata Partner] Partnership / Inquiry">Partnership & Inquiries</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="user-message" className={styles.inputLabel}>
                  Your Message
                </label>
                <textarea
                  id="user-message"
                  name="body"
                  rows={4}
                  placeholder="Tell us what you need help with or what we can improve..."
                  required
                  className={styles.textAreaInput}
                ></textarea>
              </div>

              <button type="submit" className={styles.submitButton}>
                Send Message <Icons.Send />
              </button>
            </form>
          </div>

        </div>

        {/* QUICK SELF-HELP BANNER */}
        <section className={styles.selfHelpSection}>
          <div className={styles.selfHelpCard}>
            <div className={styles.selfHelpIcon}>
              <Icons.HelpCircle />
            </div>
            <div>
              <h2 className={styles.selfHelpTitle}>Looking for fast answers?</h2>
              <p className={styles.selfHelpDesc}>
                Learn how multi-currency math works, how your Private Vault is protected, and how our zero AI-model training guarantee safeguards your privacy.
              </p>
            </div>
            <Link href="/#faq" className={styles.faqButtonLink}>
              Read Help FAQs →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}