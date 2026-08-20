import { Metadata } from "next";
import FeatureHero from "../../../../components/marketing/features/investment-vault/FeatureHero";
import FeaturePreview from "../../../../components/marketing/features/investment-vault/FeaturePreview";
import FeatureBenefits from "../../../../components/marketing/features/investment-vault/FeatureBenefits";
import FeatureWorkflow from "../../../../components/marketing/features/investment-vault/FeatureWorkflow";
import FeatureGrid from "../../../../components/marketing/features/investment-vault/FeatureGrid";
import FeatureFaq from "../../../../components/marketing/features/investment-vault/FeatureFaq";
import FeatureCta from "../../../../components/marketing/features/investment-vault/FeatureCta";

export const metadata: Metadata = {
  title: "Secure Investment Vault & Portfolio Tracker | RakhoKhaata",
  description:
    "Track crypto, stocks, gold, and custom assets in an isolated, PIN-protected vault with real-time currency conversion and complete transaction timelines.",
  keywords: [
    "investment vault app",
    "pin protected portfolio tracker",
    "crypto and stock ledger",
    "private wealth tracker",
    "multi-currency asset manager",
    "secure investment journal",
  ],
  openGraph: {
    title: "Secure Investment Vault | RakhoKhaata",
    description:
      "Keep your portfolio private with optional PIN lock, automatic average cost calculations, and detailed timeline tracking.",
    type: "website",
  },
};

const SIMPLE_BENEFITS = [
  {
    problem:
      "Your investment balances and crypto holdings are exposed on screen whenever you check basic daily expenses around coworkers or friends.",
    solution:
      "Lock your entire portfolio behind an isolated 4-digit PIN security barrier. Your assets remain hidden until you enter your personal code.",
  },
  {
    problem:
      "Assets purchased across different exchanges and currencies make it impossible to calculate your true average cost per coin or share.",
    solution:
      "Our engine normalizes every buy order to USD and recalculates your average cost basis instantly in your workspace currency.",
  },
  {
    problem:
      "Standard portfolio apps only show your current balance, erasing your original thesis, investment notes, and buy-in rationale.",
    solution:
      "Maintain a dedicated strategy memo and an audit timeline for every asset, capturing timestamps, units added, and personal trade notes.",
  },
];

const SIMPLE_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Set Your 4-Digit Security PIN",
    description:
      "Enable instant cryptographic protection on your portfolio. Set a 4-digit code that locks your wealth records on all devices.",
  },
  {
    step: "02",
    title: "Log Holdings & Trade Strategy",
    description:
      "Add your Bitcoin, equities, precious metals, or custom assets with amount owned, total invested capital, and investment notes.",
  },
  {
    step: "03",
    title: "Track Average Cost & History",
    description:
      "Expand any asset to view average cost per unit, read your trade thesis, and inspect the chronological purchase history log.",
  },
];

const SIMPLE_GRID_ITEMS = [
  {
    title: "PIN-Protected Privacy Lock",
    description:
      "Keep high-value holdings completely confidential with bcrypt-secured 4-digit PIN authentication and tokenized email reset.",
    iconName: "lock",
  },
  {
    title: "Automated Average Cost Engine",
    description:
      "Instantly compute your exact break-even cost per unit as you accumulate positions over multiple buy orders.",
    iconName: "calculator",
  },
  {
    title: "Multi-Currency Capital Conversion",
    description:
      "Log purchases in USD, PKR, EUR, or GBP—holdings dynamically reflect in your workspace currency using live rates.",
    iconName: "globe",
  },
  {
    title: "Interactive Strategy Memos",
    description:
      "Attach investment notes and buy hypotheses directly to each asset so you never forget why you entered a position.",
    iconName: "book",
  },
  {
    title: "Visual Activity Timeline",
    description:
      "Every top-up, adjustment, and rebalance creates a chronological milestone entry with full purchase receipts.",
    iconName: "activity",
  },
  {
    title: "Any Asset Category",
    description:
      "Track traditional stocks, crypto tokens, precious metals, real estate equity, or custom private investments seamlessly.",
    iconName: "box",
  },
];

const SIMPLE_FAQ_ITEMS = [
  {
    question: "Is the 4-digit PIN lock mandatory?",
    answer:
      "No. The PIN lock is completely optional. You can use the Investment Vault freely without a PIN, or enable it at any time from your vault dashboard.",
  },
  {
    question: "What happens if I forget my vault PIN?",
    answer:
      "Click 'Forgot your PIN?' on the lock screen. A secure, single-use 15-minute reset token will be delivered to your registered email address.",
  },
  {
    question: "Can I log assets in different currencies?",
    answer:
      "Yes. You can record a stock buy in USD and a real estate holding in PKR. The vault standardizes all positions using base USD and displays totals in your chosen workspace currency.",
  },
  {
    question: "How is the average cost per unit calculated?",
    answer:
      "The vault divides your total localized invested capital by the total quantity owned, updating in real time as new purchases are logged.",
  },
  {
    question: "Can I track private or custom assets?",
    answer:
      "Yes. In addition to public tickers, you can create custom asset profiles with your own icons, naming, units, and strategy notes.",
  },
];

export default function InvestmentVaultPage() {
  return (
    <main>
      <FeatureHero
        badge="Confidential Portfolio Protection"
        title="Track Your Wealth in a Secure, PIN-Protected Investment Vault"
        description="Keep your stocks, crypto, and private assets confidential. Monitor average cost basis, log strategy notes, and inspect complete buy histories."
        primaryCtaText="Open Your Vault Free"
        primaryCtaLink="/signup"
        secondaryCtaText="Try Interactive Demo"
        secondaryCtaLink="#preview"
      />

      <FeaturePreview
        id="preview"
        headline="Interactive Investment Vault Demo"
        subheadline="Click on any asset row below to open its private strategy memo and review its complete chronological activity timeline."
      />

      <FeatureBenefits
        sectionTitle="Why Standard Portfolio Trackers Fall Short"
        sectionSubtitle="Spreadsheets leak privacy and typical trackers miss trade context. RakhoKhaata provides isolated, protected tracking."
        benefits={SIMPLE_BENEFITS}
      />

      <FeatureWorkflow
        sectionTitle="How the Investment Vault Works in 3 Steps"
        sectionSubtitle="Activate your privacy lock once, log positions easily, and review detailed timeline analytics."
        steps={SIMPLE_WORKFLOW_STEPS}
      />

      <FeatureGrid
        sectionTitle="Engineered for Serious Wealth Tracking"
        sectionSubtitle="Built with cryptographic security, dynamic currency conversion, and structured trade journals."
        items={SIMPLE_GRID_ITEMS}
      />

      <FeatureFaq
        sectionTitle="Frequently Asked Questions"
        sectionSubtitle="Everything you need to know about PIN security, currency conversion, and asset timelines."
        items={SIMPLE_FAQ_ITEMS}
      />

      <FeatureCta
        title="Ready to Secure Your Portfolio?"
        description="Create your private vault in under 2 minutes. Free forever, no credit card required."
        buttonText="Create Your Secure Vault Free"
        buttonLink="/signup"
      />
    </main>
  );
}