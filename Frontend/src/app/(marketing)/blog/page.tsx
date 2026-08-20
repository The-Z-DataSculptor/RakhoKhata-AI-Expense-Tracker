import { Metadata } from "next";
import BlogClient from "@/components/marketing/features/blog/BlogClient";

export const metadata: Metadata = {
  title: "Blog & Knowledge Hub | RakhoKhaata",
  description:
    "Explore insightful articles, engineering guides, and expert perspectives across technology, finance, productivity, and modern lifestyle.",
  keywords: [
    "personal finance blog",
    "expense tracking guides",
    "fintech insights",
    "productivity tips",
    "multimodal ai technology",
    "rakhokhaata journal",
  ],
  alternates: {
    canonical: "https://rakhokhaata.com/blog",
  },
  openGraph: {
    title: "Blog & Knowledge Hub | RakhoKhaata",
    description:
      "Explore insightful articles, engineering guides, and expert perspectives across technology, finance, productivity, and modern lifestyle.",
    url: "https://rakhokhaata.com/blog",
    siteName: "RakhoKhaata",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Knowledge Hub | RakhoKhaata",
    description:
      "Fresh perspectives on technology, personal finance, productivity, and modern lifestyle.",
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

export default function BlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": "https://rakhokhaata.com/blog/#blog",
        name: "RakhoKhaata Knowledge Hub",
        url: "https://rakhokhaata.com/blog",
        description:
          "Articles, engineering guides, and tutorials across technology, lifestyle, and wealth management.",
        publisher: {
          "@type": "Organization",
          name: "RakhoKhaata",
          url: "https://rakhokhaata.com",
        },
      },
      {
        "@type": "CollectionPage",
        "@id": "https://rakhokhaata.com/blog/#webpage",
        url: "https://rakhokhaata.com/blog",
        name: "Blog & Knowledge Hub | RakhoKhaata",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://rakhokhaata.com/#website",
          name: "RakhoKhaata",
          url: "https://rakhokhaata.com",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogClient />
    </>
  );
}