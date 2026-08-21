// src/app/(marketing)/page.tsx

/* ==========================================================================
   === SECTION 1: IMPORTS & SEO METADATA ===
   ========================================================================== */
import type { Metadata } from "next";
import Hero from "../../components/marketing/Hero";
import PainPointsQuiz from "../../components/marketing/PainPointsQuiz";
import FeatureCommandCenter from "../../components/marketing/FeatureCommandCenter";
import PricingSection from "../../components/marketing/PricingSection";
import FaqSection from "../../components/marketing/FaqSection";
import styles from "./page.module.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rakhokhaata.com"),
  title: "Rakho Khaata – Your Friendly AI Money Coach & Expense Tracker",
  description:
    "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, and chat with AI.",
  keywords: [
    "ai money coach",
    "smart expense ledger",
    "daily expense tracker",
    "personal finance tracker web app",
    "multi currency budget app",
    "free receipt scanner app",
    "ai expense manager",
    "track daily spending without spreadsheets",
    "private investment vault tracker",
    "PKR USD expense tracker",
  ],
  authors: [{ name: "Syed Zain Hassan", url: "https://rakhokhaata.com/about" }],
  creator: "RakhoKhaata",
  publisher: "RakhoKhaata",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rakho Khaata – Your Friendly AI Money Coach & Expense Tracker",
    description:
      "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, and chat with AI.",
    url: "https://rakhokhaata.com",
    siteName: "Rakho Khaata",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Rakho Khaata - Your Friendly AI Money Coach & Expense Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rakho Khaata – Your Friendly AI Money Coach & Expense Tracker",
    description:
      "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, and chat with AI.",
    images: ["/og-preview.png"],
    creator: "@rakhokhaata",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: STRUCTURED SCHEMA (JSON-LD) ===
   ========================================================================== */
const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://rakhokhaata.com/#software",
      "name": "Rakho Khaata",
      "operatingSystem": "All modern browsers (Web, iOS, Android, macOS, Windows)",
      "applicationCategory": "FinanceApplication",
      "applicationSubCategory": "Personal Finance, Budgeting & AI Money Coach",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
      "description":
        "Meet Rakho Khaata — your smart personal money coach and secure expense ledger. Track spending effortlessly, manage budgets, scan receipts, and chat with an AI financial companion.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1840",
      },
      "author": {
        "@type": "Person",
        "name": "Syed Zain Hassan",
        "url": "https://rakhokhaata.com/about",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://rakhokhaata.com/#organization",
      "name": "Rakho Khaata",
      "url": "https://rakhokhaata.com",
      "logo": "https://rakhokhaata.com/icon.png",
      "sameAs": [
        "https://twitter.com/rakhokhaata",
        "https://github.com/The-Z-DataSculptor",
        "https://linkedin.com/in/syed-zain-hassan",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://rakhokhaata.com/#website",
      "url": "https://rakhokhaata.com",
      "name": "Rakho Khaata",
      "publisher": {
        "@id": "https://rakhokhaata.com/#organization",
      },
      "inLanguage": "en-US",
    },
    {
      "@type": "FAQPage",
      "@id": "https://rakhokhaata.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is RakhoKhaata really free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Our Free Starter plan gives you up to 700 transaction entries every single month, multiple workspaces, and your private investment vault without paying a penny. There are no surprise trials or mandatory credit cards required.",
          },
        },
        {
          "@type": "Question",
          "name": "How does the AI Money Companion work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike confusing accounting tools, our AI Companion speaks in simple, everyday language. It looks at your recent spending to answer questions like 'Where did most of my money go this week?' or 'Am I on track for my savings goal?' and alerts you to forgotten subscription renewals.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I track multiple currencies (like USD, PKR, and EUR) together?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. RakhoKhaata is built for real-world global workers, freelancers, and families. You can earn in USD or EUR while spending locally in PKR or AED. The app automatically fetches live conversion rates so your total net worth and cash flow stay accurate.",
          },
        },
        {
          "@type": "Question",
          "name": "How does the Private Investment Vault protect my savings?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Your Investment Vault is protected behind an independent 4-digit security PIN. Even if family members, roommates, or colleagues are looking at your phone or laptop screen while you log daily expenses, your gold, crypto, savings, and stocks remain hidden.",
          },
        },
        {
          "@type": "Question",
          "name": "What is the difference between Personal and Business Workspaces?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Workspaces let you keep your life organized with zero overlap. Use your Personal Workspace for household groceries, rent, and utility bills, and switch to your Business Workspace with one tap to track client invoices, software licenses, and project expenses.",
          },
        },
        {
          "@type": "Question",
          "name": "Is my personal and financial data kept private?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Strictly private. We use industry-standard bcrypt and SHA-256 cryptographic hashing for all passwords and vault PINs. Furthermore, your confidential financial ledger entries and receipts are never used to train public AI models.",
          },
        },
      ],
    },
  ],
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: HOMEPAGE COMPONENT ===
   ========================================================================== */
export default function Home() {
  return (
    <>
      {/* Search Engine Structured Data Graph (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <main className={styles.main}>
        {/* 1. Hero Overview */}
        <Hero />

        {/* 2. Interactive Problem Solver & Value Demonstration */}
        <PainPointsQuiz />

        {/* 3. Core Feature Command Center */}
        <FeatureCommandCenter />

        {/* 4. Beta Access & Pricing */}
        <PricingSection />

        {/* 5. Frequently Asked Questions with Rich Schema */}
        <FaqSection />
      </main>
    </>
  );
}
/* === SECTION 3 END === */