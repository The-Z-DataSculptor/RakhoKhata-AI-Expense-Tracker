import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | RakhoKhaata",
  description:
    "Review RakhoKhaata's Privacy Policy. Understand our data protection standards, multi-currency ledger security, zero AI model training policy, and user privacy rights.",
  keywords: [
    "RakhoKhaata privacy policy",
    "expense tracker security",
    "financial data privacy",
    "AI ledger confidentiality",
  ],
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | RakhoKhaata",
    description:
      "Enterprise security, zero AI model-training, and transparent financial privacy practices.",
    url: "/privacy",
    siteName: "RakhoKhaata",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | RakhoKhaata",
    description:
      "Enterprise security, zero AI model-training, and transparent financial privacy practices.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}