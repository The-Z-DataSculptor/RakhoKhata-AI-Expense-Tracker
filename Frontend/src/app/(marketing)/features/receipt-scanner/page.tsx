import { Metadata } from "next";
import FeatureHero from "../../../../components/marketing/features/receipt-scanner/FeatureHero";
import FeaturePreview from "../../../../components/marketing/features/receipt-scanner/FeaturePreview";
import FeatureBenefits from "../../../../components/marketing/features/receipt-scanner/FeatureBenefits";
import FeatureWorkflow from "../../../../components/marketing/features/receipt-scanner/FeatureWorkflow";
import FeatureGrid from "../../../../components/marketing/features/receipt-scanner/FeatureGrid";
import FeatureFaq from "../../../../components/marketing/features/receipt-scanner/FeatureFaq";
import FeatureCta from "../../../../components/marketing/features/receipt-scanner/FeatureCta";

export const metadata: Metadata = {
  title: "AI Receipt Scanner & OCR Expense Tracker | RakhoKhaata",
  description:
    "Snap a photo or upload PDF invoices to instantly extract merchant names, dates, amounts, and currencies with multimodal Gemini AI OCR.",
  keywords: [
    "ai receipt scanner",
    "ocr expense tracker",
    "receipt to spreadsheet",
    "instant invoice scanner",
    "gemini vision receipt parser",
    "automated expense logging",
  ],
  openGraph: {
    title: "AI Receipt Scanner & OCR Expense Tracker | RakhoKhaata",
    description:
      "Eliminate manual data entry. Snap physical receipts or upload PDF bills to extract transaction lines in seconds.",
    type: "website",
  },
};

const SIMPLE_BENEFITS = [
  {
    problem:
      "You collect paper receipts in your wallet and dread spending hours manually typing merchant names, dates, and amounts into spreadsheets.",
    solution:
      "Point your phone camera at any physical receipt. Our Gemini AI vision engine extracts the vendor, posting date, and exact total in seconds.",
  },
  {
    problem:
      "Digital invoices and PDF utility bills arrive in different layouts, making copy-pasting numbers prone to costly human typos.",
    solution:
      "Upload PDF documents or images up to 10 MB. The OCR pipeline normalizes messy invoice texts directly into structured ledger records.",
  },
  {
    problem:
      "Most OCR apps misread local currency symbols or force you into rigid expense categories that don't match your workflow.",
    solution:
      "Automatic multi-currency recognition accurately maps PKR, USD, EUR, and GBP while routing items into your custom workspace categories.",
  },
];

const SIMPLE_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Snap or Upload Document",
    description:
      "Use your smartphone camera or drag & drop PDF invoices, JPEGs, PNGs, and WEBP receipts directly into the scanner.",
  },
  {
    step: "02",
    title: "Gemini Vision Parsing",
    description:
      "Multimodal AI reads the image buffer, cleans up noisy merchant headers, detects sales taxes, and identifies the total amount.",
  },
  {
    step: "03",
    title: "Review & Instant Commit",
    description:
      "Extracted fields pre-fill the transaction form automatically. Confirm the category and commit to your ledger in 1 click.",
  },
];

const SIMPLE_GRID_ITEMS = [
  {
    title: "Multimodal Gemini Vision",
    description:
      "State-of-the-art visual AI parses wrinkled, low-light, and faded thermal receipts with precision.",
    iconName: "camera",
  },
  {
    title: "Instant Mobile Camera Capture",
    description:
      "Snap receipts on the go with dedicated mobile camera shutter integration—no app download required.",
    iconName: "smartphone",
  },
  {
    title: "PDF & Document Ingestion",
    description:
      "Upload full PDF invoices, digital payment screenshots, and email receipts up to 10 MB seamlessly.",
    iconName: "file",
  },
  {
    title: "Intelligent Currency Detection",
    description:
      "Auto-detects regional and international symbols (PKR, Rs, $, €, £) and calculates base USD equivalents.",
    iconName: "globe",
  },
  {
    title: "Merchant Noise Reduction",
    description:
      "Cleans messy POS terminal text into recognizable merchant names (e.g., 'MCDONALDS #4102' → 'McDonald\\'s').",
    iconName: "zap",
  },
  {
    title: "Zero-Click Category Pre-fill",
    description:
      "Routes scanned expenses into your active workspace categories or default unassigned queues automatically.",
    iconName: "layers",
  },
];

const SIMPLE_FAQ_ITEMS = [
  {
    question: "What file formats does the AI Receipt Scanner support?",
    answer:
      "The scanner supports JPEG, JPG, PNG, WEBP, HEIC images, and PDF document files up to 10 MB in size.",
  },
  {
    question: "Can I take a photo directly from my phone camera?",
    answer:
      "Yes. Selecting 'Use Camera' opens your smartphone's native camera shutter to snap physical paper receipts on the go.",
  },
  {
    question: "Does the scanner support multi-currency receipts?",
    answer:
      "Yes. The OCR engine identifies international currencies (such as PKR, USD, EUR, GBP, and AED) and converts amounts automatically using your workspace exchange rates.",
  },
  {
    question: "Can I edit the extracted data before saving?",
    answer:
      "Yes. Once scanned, extracted merchant details, dates, amounts, and categories open in an editable form for your final review before committing to your ledger.",
  },
  {
    question: "Is receipt scanning free to use?",
    answer:
      "Yes. The AI receipt scanner is included in RakhoKhaata's free tier with generous daily scanning limits.",
  },
];

export default function ReceiptScannerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RakhoKhaata AI Receipt Scanner",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Multimodal AI OCR receipt scanner that extracts merchant details, dates, and amounts into structured ledger records.",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FeatureHero
        badge="Multimodal AI Receipt OCR"
        title="Turn Paper Receipts and PDF Invoices Into Clean Ledger Entries Instantly"
        description="Snap a photo or upload invoices. Let Gemini AI vision extract vendor names, dates, and amounts without typing a single digit."
        primaryCtaText="Scan Receipts Free"
        primaryCtaLink="/signup"
        secondaryCtaText="Try Live OCR Demo"
        secondaryCtaLink="#preview"
      />

      <FeaturePreview
        id="preview"
        headline="Interactive Receipt Scanner Simulator"
        subheadline="Select a sample receipt below to see how our Gemini Vision engine analyzes image data and auto-fills ledger fields in real time."
      />

      <FeatureBenefits
        sectionTitle="Why Manual Expense Entry Slows You Down"
        sectionSubtitle="Lost paper slips and tedious manual ledger typing waste hours. RakhoKhaata makes expense tracking instant."
        benefits={SIMPLE_BENEFITS}
      />

      <FeatureWorkflow
        sectionTitle="How AI Receipt Scanning Works in 3 Simple Steps"
        sectionSubtitle="Capture, parse, and verify. From paper slip to categorized financial record in seconds."
        steps={SIMPLE_WORKFLOW_STEPS}
      />

      <FeatureGrid
        sectionTitle="Engineered for Fast, Accurate Expense Logging"
        sectionSubtitle="Built with state-of-the-art vision models, multi-format support, and currency conversion."
        items={SIMPLE_GRID_ITEMS}
      />

      <FeatureFaq
        sectionTitle="Frequently Asked Questions"
        sectionSubtitle="Everything you need to know about supported formats, camera integration, and currency detection."
        items={SIMPLE_FAQ_ITEMS}
      />

      <FeatureCta
        title="Ready to Stop Typing Receipts by Hand?"
        description="Upload your first receipt in seconds. Free forever, no credit card required."
        buttonText="Start Scanning Receipts Free"
        buttonLink="/signup"
      />
    </main>
  );
}