import { Metadata } from "next";
import FeatureHero from "@/components/marketing/features/multi-currency-tracker/FeatureHero";
import FeaturePreview from "@/components/marketing/features/multi-currency-tracker/FeaturePreview";
import FeatureBenefits from "@/components/marketing/features/multi-currency-tracker/FeatureBenefits";
import FeatureWorkflow from "@/components/marketing/features/multi-currency-tracker/FeatureWorkflow";
import FeatureGrid from "@/components/marketing/features/multi-currency-tracker/FeatureGrid";
import FeatureFaq from "@/components/marketing/features/multi-currency-tracker/FeatureFaq";
import FeatureCta from "@/components/marketing/features/multi-currency-tracker/FeatureCta";

export const metadata: Metadata = {
  title: "Multi-Currency Expense Tracker & Global Ledgers | RakhoKhaata",
  description:
    "Track foreign client income and local daily expenses in one simple app. Automatic live exchange rates for 40+ currencies with separate work and personal books.",
  keywords: [
    "multi currency expense tracker",
    "freelancer money manager app",
    "track business and personal expenses separately",
    "expat budget tracker",
    "manage money in multiple currencies",
  ],
  openGraph: {
    title: "Multi-Currency Expense Tracker | RakhoKhaata",
    description:
      "Get paid in Dollars, pay bills in Rupees, and keep your business and personal cash flow completely organized.",
    type: "website",
  },
};

const SIMPLE_BENEFITS_DATA = [
  {
    problem:
      "You earn in USD on Upwork or Stripe, but you buy groceries and pay rent in PKR or AED. Doing manual math on calculators or spreadsheets every time you spend money is exhausting.",
    solution:
      "Log what you earned and what you spent in their real currencies. RakhoKhaata pulls live bank rates and converts everything into your main currency for you automatically.",
  },
  {
    problem:
      "Mixing work receipts with personal household bills makes it almost impossible to know how much profit your business actually made at the end of the month.",
    solution:
      "Create clean, separate workspaces with one click (e.g. 'Freelance Work' and 'Home Budget'). Each workspace keeps its own money, bills, and currency separate.",
  },
  {
    problem:
      "Exchange rates change daily. If the Dollar moves up or down, your old spreadsheets get broken and show wrong totals.",
    solution:
      "RakhoKhaata remembers the exact rate from the day you added the transaction. Your past reports, monthly charts, and savings totals always stay 100% accurate.",
  },
];

const SIMPLE_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Create Your Workspaces",
    description:
      "Make one book for your client work in USD, and another book for your daily home expenses in PKR or your local currency.",
  },
  {
    step: "02",
    title: "Add Income & Bills Fast",
    description:
      "Pick any currency when entering a bill or payout. The app automatically fetches the real bank exchange rate for that exact moment.",
  },
  {
    step: "03",
    title: "Check Your True Savings",
    description:
      "See clear monthly charts, total income, and your safe-to-spend balance converted into one clean summary without any manual math.",
  },
];

const SIMPLE_GRID_ITEMS = [
  {
    title: "40+ Global Currencies",
    description:
      "Works with PKR, USD, EUR, GBP, AED, SAR, CAD, AUD, and dozens more with proper symbols and flags.",
    iconName: "globe",
  },
  {
    title: "Live Bank Exchange Rates",
    description:
      "Rates update automatically in the background so your numbers and balances always match current market rates.",
    iconName: "trending",
  },
  {
    title: "Separate Work & Home Books",
    description:
      "Switch between your client business and family budget in one click without ever mixing up your money.",
    iconName: "layers",
  },
  {
    title: "Saved History Protection",
    description:
      "We save the original amount and currency for every transaction, so your past records never get distorted.",
    iconName: "lock",
  },
  {
    title: "Instant Total Recalculation",
    description:
      "Change your display currency at any time and watch all your spending charts and balances recalculate instantly.",
    iconName: "refresh",
  },
  {
    title: "Works Even When Offline",
    description:
      "Keep adding foreign receipts on the road even without Wi-Fi. The app uses smart offline rates until you reconnect.",
    iconName: "offline",
  },
];

const SIMPLE_FAQ_ITEMS = [
  {
    question: "Do I need to calculate exchange rates myself?",
    answer:
      "No. Every time you log an income or expense in a different currency, RakhoKhaata automatically fetches the live bank exchange rate and calculates the converted value for you.",
  },
  {
    question: "Can I keep my freelance business and home expenses separate?",
    answer:
      "Yes, absolutely. You can create separate workspaces (like 'Freelance Work' and 'Personal Household'). Each workspace has its own currency, transaction list, and budget charts.",
  },
  {
    question: "What happens if I change my display currency later?",
    answer:
      "Your original transactions will never change or get messed up. The app keeps the original currency and amount safe, and simply recalculates the totals and charts in your newly selected currency.",
  },
  {
    question: "Which currencies are supported in RakhoKhaata?",
    answer:
      "Over 40 world currencies are supported, including PKR, USD, EUR, GBP, AED, SAR, INR, CAD, AUD, SGD, JPY, and all major Gulf and Asian currencies.",
  },
  {
    question: "Is there any extra fee or paid add-on to use multi-currency?",
    answer:
      "No. Multi-currency tracking, live rate conversions, and separate workspaces are included for all users for free.",
  },
];

export default function MultiCurrencyTrackerPage() {
  return (
    <main>
      <FeatureHero
        badge="Multi-Currency & Separate Workspaces"
        title="Earn in Dollars, Spend in Rupees, Track Everything Without Spreadsheets"
        description="Made for freelancers, remote workers, expats, and travelers. Keep your work and personal money completely separate while live exchange rates handle all the conversion math."
        primaryCtaText="Start Tracking Free"
        primaryCtaLink="/signup"
        secondaryCtaText="See How It Works"
        secondaryCtaLink="#preview"
      />

      <FeaturePreview
        id="preview"
        headline="See Your Money Clearly in Any Currency"
        subheadline="Click any currency below to see how your balance, income, and bills convert in real time."
      />

      <FeatureBenefits
        sectionTitle="Why Most People Struggle With Multiple Currencies"
        sectionSubtitle="Regular budgeting apps only let you pick one currency. Here is how RakhoKhaata makes international money simple."
        benefits={SIMPLE_BENEFITS_DATA}
      />

      <FeatureWorkflow
        sectionTitle="How It Works In 3 Simple Steps"
        sectionSubtitle="No complicated setup or financial knowledge required. Get organized in less than two minutes."
        steps={SIMPLE_WORKFLOW_STEPS}
      />

      <FeatureGrid
        sectionTitle="Built for Anyone Earning or Spending Across Borders"
        sectionSubtitle="Everything you need to manage your money without complicated formulas or expensive banking apps."
        items={SIMPLE_GRID_ITEMS}
      />

      <FeatureFaq
        sectionTitle="Frequently Asked Questions"
        sectionSubtitle="Simple answers to common questions about currencies and workspaces."
        items={SIMPLE_FAQ_ITEMS}
      />

      <FeatureCta
        title="Ready to Stop Wrestling With Spreadsheets and Calculators?"
        description="Join freelancers, remote contractors, and expats tracking their global money in one clean dashboard."
        buttonText="Create Your Free Account"
        buttonLink="/signup"
      />
    </main>
  );
}