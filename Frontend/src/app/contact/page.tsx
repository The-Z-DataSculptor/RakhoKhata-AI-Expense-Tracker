// src/app/contact/page.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & METADATA ===
   ========================================================================== */
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Contact & Developer Profile | Syed Zain Hassaan",
  description:
    "Learn more about Syed Zain Hassaan, the Full‑Stack Developer behind RakhoKhata, and get in touch for collaborations.",
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: INLINE VECTOR ICONS ===
   ========================================================================== */
/**
 * WHY inline SVGs are used:
 * They keep the page lightweight – no extra icon library needs to be
 * downloaded. The icons are simple, scalable, and respect the current
 * text colour via `currentColor`.
 */
const Icons = {
  Mail: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Github: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  ),
  Linkedin: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Code: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Server: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  ),
  Database: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  Cpu: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: PAGE COMPONENT ===
   ========================================================================== */
/**
 * WHY this page exists:
 * It provides a personal contact card and showcases the technology stack
 * used to build RakhoKhata, helping potential collaborators or employers
 * understand the developer's skills.
 */
export default function ContactPage() {
  return (
    <main className={styles.pageContainer}>
      <div className={styles.contentCard}>
        {/* HEADER SECTION */}
        <div className={styles.headerSection}>
          <div className={styles.developerBadge}>
            ⚡ Full-Stack Developer & Software Architect
          </div>

          <h1 className={styles.nameTitle}>
            Hi, I&apos;m{" "}
            <span className={styles.highlightName}>Syed Zain Hassaan</span>
          </h1>

          <p className={styles.bioText}>
            I am a passionate Full-Stack Engineer who takes pride in building
            fast, scalable, and resilient web software. From database design
            and containerization down to micro‑animations and intuitive UIs,
            I build applications that deliver real value.
          </p>

          <p className={styles.collaborationText}>
            I am always enthusiastic about working on new ideas, solving
            complex engineering problems, and collaborating with fellow
            developers, founders, and ambitious teams.
          </p>
        </div>

        <hr className={styles.divider} />

        {/* TECH STACK ARCHITECTURE */}
        <div className={styles.stackSection}>
          <h2 className={styles.sectionTitle}>
            Tech Stack Behind RakhoKhata
          </h2>
          <p className={styles.stackSubtitle}>
            This project demonstrates the full‑stack architecture built for{" "}
            <strong>RakhoKhata</strong>—part of a versatile engineering
            toolkit I use across web applications:
          </p>

          <div className={styles.stackGrid}>
            {/* CARD 1: FRONTEND */}
            <div className={styles.stackCard}>
              <div className={styles.stackHeader}>
                <span className={styles.stackIcon}>
                  <Icons.Code />
                </span>
                <h3>Frontend Architecture</h3>
              </div>
              <ul className={styles.techBulletList}>
                <li>
                  <strong>Next.js 16</strong> (App Router) &{" "}
                  <strong>React 19</strong>
                </li>
                <li>
                  <strong>TypeScript</strong> for strict type‑safe code
                </li>
                <li>
                  <strong>Recharts</strong> for interactive analytics
                </li>
                <li>
                  <strong>React Hook Form + Zod</strong> data validation
                </li>
              </ul>
            </div>

            {/* CARD 2: BACKEND & SECURITY */}
            <div className={styles.stackCard}>
              <div className={styles.stackHeader}>
                <span className={styles.stackIcon}>
                  <Icons.Server />
                </span>
                <h3>Backend & Security</h3>
              </div>
              <ul className={styles.techBulletList}>
                <li>
                  <strong>Node.js & Express 5</strong> REST API
                </li>
                <li>
                  <strong>PASETO</strong> for auth
                </li>
                <li>
                  <strong>Rate Limiting & CORS</strong> protection
                </li>
                <li>
                  <strong>Node‑Cron & Resend</strong> automated email alerts
                </li>
              </ul>
            </div>

            {/* CARD 3: DATABASE & DOCUMENTS */}
            <div className={styles.stackCard}>
              <div className={styles.stackHeader}>
                <span className={styles.stackIcon}>
                  <Icons.Database />
                </span>
                <h3>Database & Documents</h3>
              </div>
              <ul className={styles.techBulletList}>
                <li>
                  <strong>PostgreSQL & Neon DB</strong> via{" "}
                  <strong>Prisma ORM</strong>
                </li>
                <li>
                  <strong>PDFKit</strong> for automatic PDF statement generation
                </li>
                <li>
                  <strong>ExcelJS & PapaParse</strong> spreadsheet tools
                </li>
                <li>
                  <strong>Docker</strong> containerized environments
                </li>
              </ul>
            </div>

            {/* CARD 4: AI INTEGRATION */}
            <div className={styles.stackCard}>
              <div className={styles.stackHeader}>
                <span className={styles.stackIcon}>
                  <Icons.Cpu />
                </span>
                <h3>AI & Smart Processing</h3>
              </div>
              <ul className={styles.techBulletList}>
                <li>
                  <strong>Native Gemini AI SDK</strong> (@google/genai)
                </li>
                <li>
                  <strong>Secure Server Gateway</strong> for AI API keys
                </li>
                <li>
                  <strong>Automated Audits</strong> & expense categorization
                </li>
                <li>
                  <strong>Multer</strong> image receipt processing pipeline
                </li>
              </ul>
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* CONTACT LINKS GRID */}
        <div className={styles.contactSection}>
          <h2 className={styles.sectionTitle}>Let&apos;s Connect</h2>

          <div className={styles.linksGrid}>
            {/* Email – uses mailto: protocol */}
            <a
              href="mailto:ZainHassan@protonmail.com"
              className={styles.contactCard}
            >
              <div className={styles.contactIcon}>
                <Icons.Mail />
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Email Me</span>
                <span className={styles.contactValue}>
                  ZainHassan@protonmail.com
                </span>
              </div>
            </a>

            {/* GitHub – opens in a new tab */}
            <a
              href="https://github.com/The-Z-DataSculptor"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactCard}
            >
              <div className={styles.contactIcon}>
                <Icons.Github />
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>GitHub Profile</span>
                <span className={styles.contactValue}>
                  github.com/The-Z-DataSculptor
                </span>
              </div>
            </a>

            {/* LinkedIn – opens in a new tab */}
            <a
              href="https://www.linkedin.com/in/syed-zain-hassan/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactCard}
            >
              <div className={styles.contactIcon}>
                <Icons.Linkedin />
              </div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>LinkedIn Profile</span>
                <span className={styles.contactValue}>
                  linkedin.com/in/syed-zain-hassan
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className={styles.buttonGroup}>
          <Link href="/signup" className={styles.primaryBtn}>
            Start Using RakhoKhata <Icons.ArrowRight />
          </Link>

          <Link href="/" className={styles.secondaryBtn}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
/* === SECTION 3 END === */