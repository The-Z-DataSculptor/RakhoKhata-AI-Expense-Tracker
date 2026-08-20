import { Metadata } from "next";
import FeatureHero from "../../../../components/marketing/features/ai-financial-companion/FeatureHero";
import FeaturePreview from "../../../../components/marketing/features/ai-financial-companion/FeaturePreview";
import FeatureBenefits from "../../../../components/marketing/features/ai-financial-companion/FeatureBenefits";
import FeatureWorkflow from "../../../../components/marketing/features/ai-financial-companion/FeatureWorkflow";
import FeatureGrid from "../../../../components/marketing/features/ai-financial-companion/FeatureGrid";
import FeatureFaq from "../../../../components/marketing/features/ai-financial-companion/FeatureFaq";
import FeatureCta from "../../../../components/marketing/features/ai-financial-companion/FeatureCta";

export const metadata: Metadata = {
  title: "AI Financial Companion & Ledger Intelligence | RakhoKhaata",
  description:
    "Meet your personal financial co-pilot powered by Gemini AI. Choose from 4 unique personas, audit cash leaks, simulate purchases, and get real-time ledger advice.",
  keywords: [
    "ai financial companion",
    "gemini financial advisor",
    "ai budgeting assistant",
    "smart ledger insights",
    "financial roast ai",
    "personalized money coach",
    "ai cash flow auditor",
  ],
  openGraph: {
    title: "AI Financial Companion & Ledger Intelligence | RakhoKhaata",
    description:
      "Your personal money co-pilot. Switch between 4 distinct AI personalities to audit spending, detect stealth subscriptions, and reach your goals faster.",
    type: "website",
    siteName: "RakhoKhaata",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Financial Companion & Ledger Intelligence | RakhoKhaata",
    description:
      "Conversational finance with 4 distinct AI personas. Audit spending leaks, test affordability, and get real-time ledger guidance.",
  },
};

const SIMPLE_BENEFITS = [
  {
    problem:
      "Generic budgeting apps show raw numbers and static charts without telling you what to actually do or where your money is leaking.",
    solution:
      "Your AI Companion analyzes your ledger in real time, delivering concise, actionable 3-to-5 line insights tailored to your occupation and goals.",
  },
  {
    problem:
      "Most financial advice feels rigid, robotic, or disconnected from how you actually prefer to receive feedback.",
    solution:
      "Switch between 4 tailored personas—from a playful Savage Roaster to an encouraging Growth Coach or a Forensic Auditor.",
  },
  {
    problem:
      "Calculating whether you can afford an upcoming purchase or finding hidden recurring expenses requires complex mental math.",
    solution:
      "Run 1-click power queries like 'Can I afford a weekend splurge?' or 'Find subscription traps' to get instant runway simulations.",
  },
];

const SIMPLE_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Select Your Persona & Goal",
    description:
      "Choose your preferred advisory tone—Savage Critic, Growth Coach, Forensic Auditor, or Precision Strategist—and set your primary financial goal.",
  },
  {
    step: "02",
    title: "Automatic Ledger Telemetry",
    description:
      "As you record daily expenses, your companion automatically calculates safe-to-spend allowances, burn rates, and budget pacing.",
  },
  {
    step: "03",
    title: "Deploy Interactive Queries",
    description:
      "Ask questions in plain English or trigger 1-click timeframe audits to receive grounded, mathematical recommendations instantly.",
  },
];

const SIMPLE_GRID_ITEMS = [
  {
    title: "4 Interactive AI Personalities",
    description:
      "Switch between Savage Roaster, Supportive Coach, Forensic Detective, and Silent Accountant on the fly.",
    iconName: "personas",
  },
  {
    title: "Real-Time Ledger Telemetry",
    description:
      "Context-aware engine injects live income, category pacing, and safe-to-spend balances into every response.",
    iconName: "activity",
  },
  {
    title: "1-Click Timeframe Audits",
    description:
      "Generate instant financial summaries for Today, This Week, or This Month to keep cash flow on track.",
    iconName: "calendar",
  },
  {
    title: "Power Query Launchpad",
    description:
      "Pre-engineered prompt chips let you test affordability, audit burn rates, and find stealth subscriptions in 1 tap.",
    iconName: "zap",
  },
  {
    title: "Occupation & Goal Adaptive",
    description:
      "Tailors recommendations specifically for freelancers, salaried employees, students, and entrepreneurs.",
    iconName: "target",
  },
  {
    title: "Multi-Currency Intelligence",
    description:
      "Seamlessly answers queries in your active workspace currency with zero currency conversion confusion.",
    iconName: "globe",
  },
];

const SIMPLE_FAQ_ITEMS = [
  {
    question: "How does the AI Companion know my financial data?",
    answer:
      "When you trigger a query, your active workspace metrics (such as recent category totals, safe-to-spend balances, and budget targets) are synthesized securely to provide personalized advice without sharing your data publicly.",
  },
  {
    question: "Can I change my AI Persona at any time?",
    answer:
      "Yes. You can switch between the Savage Roaster, Supportive Coach, Forensic Detective, and Silent Accountant anytime from your Settings or directly in the AI Hub.",
  },
  {
    question: "Is there a daily limit on AI reports?",
    answer:
      "Free accounts include 3 comprehensive timeframe audit reports per day, along with generous daily interactive conversational queries.",
  },
  {
    question: "Does the AI give actual investment or legal advice?",
    answer:
      "The companion provides mathematical ledger analysis, budgeting suggestions, and behavioral insights based on your records, serving as an educational financial co-pilot.",
  },
  {
    question: "What languages does the AI Companion understand?",
    answer:
      "The companion supports multilingual queries in English, Urdu, Hindi, Spanish, French, German, Arabic, and more based on your profile settings.",
  },
];

export default function AiFinancialCompanionPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "RakhoKhaata AI Financial Companion",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, iOS, Android",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Personalized financial co-pilot powered by Gemini AI with 4 adaptive personas and real-time ledger intelligence.",
      },
      {
        "@type": "FAQPage",
        mainEntity: SIMPLE_FAQ_ITEMS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <FeatureHero
        badge="Gemini-Powered Financial Co-Pilot"
        title="Your Personal Money Coach, Auditor, and Strategist in One AI"
        description="Experience conversational finance with 4 distinct personalities. Audit spending leaks, simulate purchases, and get real-time ledger guidance tailored to your goals."
        primaryCtaText="Meet Your AI Buddy Free"
        primaryCtaLink="/signup"
        secondaryCtaText="Test Personas Live"
        secondaryCtaLink="#preview"
      />

      <FeaturePreview
        id="preview"
        headline="Interactive AI Companion Simulator"
        subheadline="Switch between the 4 persona cards below and test prompt chips to see how tone, insights, and suggestions adapt in real time."
      />

      <FeatureBenefits
        sectionTitle="Why Traditional Financial Dashboards Fall Flat"
        sectionSubtitle="Static charts show what happened in the past. Your AI Companion helps you make smarter decisions right now."
        benefits={SIMPLE_BENEFITS}
      />

      <FeatureWorkflow
        sectionTitle="How Your AI Companion Works in 3 Simple Steps"
        sectionSubtitle="Pick your vibe, log expenses naturally, and get instant answers whenever you need financial clarity."
        steps={SIMPLE_WORKFLOW_STEPS}
      />

      <FeatureGrid
        sectionTitle="Engineered for Intelligent Wealth Management"
        sectionSubtitle="Built with state-of-the-art LLM prompts, live ledger context injection, and goal-tracking heuristics."
        items={SIMPLE_GRID_ITEMS}
      />

      <FeatureFaq
        sectionTitle="Frequently Asked Questions"
        sectionSubtitle="Everything you need to know about personas, ledger context, daily allowances, and data security."
        items={SIMPLE_FAQ_ITEMS}
      />

      <FeatureCta
        title="Ready to Put Your Financial Health on Autopilot?"
        description="Connect with your AI companion in under 2 minutes. Free forever, no credit card required."
        buttonText="Get Started with AI Buddy Free"
        buttonLink="/signup"
      />
    </main>
  );
}