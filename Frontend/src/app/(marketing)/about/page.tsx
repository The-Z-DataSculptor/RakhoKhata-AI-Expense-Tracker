/* ==========================================================================
   === SECTION 1: IMPORTS & SEO METADATA ===
   ========================================================================== */
import type { Metadata } from "next";
import Link from "next/link";
import { 
  FiUser, 
  FiHeart, 
  FiShield, 
  FiZap, 
  FiCheckCircle, 
  FiArrowRight, 
  FiTrendingUp, 
  FiLock 
} from "react-icons/fi";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About Us | The Story Behind RakhoKhaata by Zain Hassan",
  description:
    "Learn why independent developer Zain Hassan built RakhoKhaata—a simple, zero-jargon daily expense tracker and AI money manager created for everyday people.",
  keywords: [
    "About RakhoKhaata",
    "Zain Hassan developer",
    "simple expense tracker story",
    "independent developer finance app",
    "multi-currency money manager",
    "why rakho khaata was built",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | The Story Behind RakhoKhaata",
    description:
      "Built by an everyday worker for everyday people. Track daily expenses, protect your investments, and build financial peace of mind.",
    url: "/about",
    siteName: "RakhoKhaata",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | The Story Behind RakhoKhaata",
    description:
      "Built by independent developer Zain Hassan for everyday people who want simple money tracking with zero headaches.",
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
const jsonLdAbout = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://rakhokhaata.com/about#webpage",
      "url": "https://rakhokhaata.com/about",
      "name": "About RakhoKhaata & Founder Zain Hassan",
      "description":
        "The story, vision, and core engineering philosophy behind RakhoKhaata's simple multi-currency money tracking platform.",
      "mainEntity": {
        "@type": "Person",
        "name": "Syed Zain Hassan",
        "jobTitle": "Founder & Full-Stack Software Engineer",
        "description":
          "Independent software engineer and creator of RakhoKhaata, passionate about building simple, accessible financial software for everyday workers.",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://rakhokhaata.com/#software",
      "name": "RakhoKhaata",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web, Android, iOS, Windows, macOS",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    },
  ],
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: ABOUT PAGE COMPONENT ===
   ========================================================================== */
export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAbout) }}
      />

      <main className={styles.aboutCanvas}>
        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <div className={styles.badge}>
            <FiHeart className={styles.badgeIcon} /> Our Story & Mission
          </div>
          <h1 className={styles.heroHeadline}>
            Built by a Real Person, <br />
            <span className={styles.gradientText}>For Real Everyday Life.</span>
          </h1>
          <p className={styles.heroSubtext}>
            No corporate boardrooms. No bloated spreadsheets. Just an honest, simple tool built 
            to help you understand where your hard-earned money goes without the headache.
          </p>
        </section>

        {/* FOUNDER STORY CARD */}
        <section className={styles.storySection}>
          <div className={styles.storyCard}>
            <div className={styles.founderHeader}>
              <div className={styles.avatarWrap}>
                <FiUser className={styles.avatarIcon} />
              </div>
              <div>
                <h2 className={styles.founderName}>Hi, I&apos;m Zain Hassan</h2>
                <p className={styles.founderRole}>Independent Developer & Creator of RakhoKhaata</p>
              </div>
            </div>

            <div className={styles.storyBody}>
              <p>
                Like millions of hardworking people around the world, I get paid every month. And for a long 
                time, I faced the exact same frustrating mystery at the end of every week: 
                <em> &quot;Where did my paycheck actually go?&quot;</em>
              </p>
              
              <p>
                I tried spreadsheets, but maintaining them felt like a second job. I tried existing finance apps, 
                but they were loaded with complex accounting terminology, locked basic features behind paywalls, 
                or made it impossible to separate my daily home expenses from my side projects and savings.
              </p>

              <blockquote className={styles.quoteBox}>
                &ldquo;I didn&apos;t want an accounting degree. I just wanted to know if I could afford dinner 
                with friends, keep my investments private, and track what I saved in plain, simple numbers.&rdquo;
              </blockquote>

              <p>
                So, I built <strong>RakhoKhaata</strong>. I built it for moms, dads, office workers, freelancers, 
                and anyone working hard to build a better financial future who simply wants clarity, not confusion.
              </p>
            </div>
          </div>
        </section>

        {/* CORE VALUES / THE 4 PILLARS */}
        <section className={styles.pillarsSection}>
          <div className={styles.sectionHeaderWrap}>
            <span className={styles.miniPill}>Our Core Values</span>
            <h2 className={styles.sectionTitle}>What Makes RakhoKhaata Different</h2>
            <p className={styles.sectionSubtitle}>
              Every line of code and feature is designed around simplicity, privacy, and genuine utility.
            </p>
          </div>

          <div className={styles.pillarsGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>
                <FiZap />
              </div>
              <h3 className={styles.pillarTitle}>Zero Jargon Simplicity</h3>
              <p className={styles.pillarText}>
                No debits, credits, or balance sheets. Log what you earned and what you spent in seconds. 
                Our AI speaks plain English, answering your questions like a helpful friend.
              </p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>
                <FiLock />
              </div>
              <h3 className={styles.pillarTitle}>Private by Design</h3>
              <p className={styles.pillarText}>
                Your investments, gold, and savings stay locked behind your private PIN Vault. Even if 
                someone is watching over your shoulder, your financial privacy is 100% protected.
              </p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>
                <FiTrendingUp />
              </div>
              <h3 className={styles.pillarTitle}>Home & Hustle Separation</h3>
              <p className={styles.pillarText}>
                Never mix grocery bills with freelance client payments. Dedicated workspaces keep your 
                personal life and side gigs organized in distinct, clean spaces.
              </p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconBox}>
                <FiShield />
              </div>
              <h3 className={styles.pillarTitle}>Your Data is Not For Sale</h3>
              <p className={styles.pillarText}>
                We do not sell user data, and your financial memos and receipts are never used to train 
                public AI models. Your finances remain strictly yours.
              </p>
            </div>
          </div>
        </section>

        {/* FUTURE ROADMAP / PROMISE TO USERS */}
        <section className={styles.roadmapSection}>
          <div className={styles.roadmapCard}>
            <h2 className={styles.roadmapTitle}>Our Continuous Improvement Promise</h2>
            <p className={styles.roadmapText}>
              RakhoKhaata is an evolving, living tool. As an independent developer, I listen directly to 
              what everyday users ask for. Here is what we are continuously improving:
            </p>

            <div className={styles.roadmapList}>
              <div className={styles.roadmapItem}>
                <FiCheckCircle className={styles.checkIcon} />
                <div>
                  <strong>Faster AI Vision Receipt Scanning:</strong>
                  <p>Enhancing camera OCR to capture handwritten store notes and multi-currency bills accurately.</p>
                </div>
              </div>

              <div className={styles.roadmapItem}>
                <FiCheckCircle className={styles.checkIcon} />
                <div>
                  <strong>Smarter Budget Leak Alerts:</strong>
                  <p>Gentle reminders before subscription renewals and automated safe-to-spend calculations.</p>
                </div>
              </div>

              <div className={styles.roadmapItem}>
                <FiCheckCircle className={styles.checkIcon} />
                <div>
                  <strong>Deeper Global Multi-Currency Support:</strong>
                  <p>Near instant exchange rate updates across USD, PKR, EUR, AED, and 120+ world currencies.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaHeadline}>Ready to Take Control of Your Daily Cash?</h2>
            <p className={styles.ctaSubtext}>
              Join hundreds of everyday people who have replaced money stress with total clarity.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/signup" className={styles.primaryCtaBtn}>
                Get Started Free <FiArrowRight />
              </Link>
              <Link href="/contact" className={styles.secondaryCtaBtn}>
                Send Zain a Message
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}