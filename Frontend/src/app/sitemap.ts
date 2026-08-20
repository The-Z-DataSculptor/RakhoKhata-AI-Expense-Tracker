import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://rakhokhaata.com";

  // All public marketing and static routes derived from your folder structure
  const publicRoutes = [
    "", // Homepage: src/app/(marketing)/page.tsx
    "/about", // src/app/(marketing)/about/page.tsx
    "/blog", // src/app/(marketing)/blog/page.tsx
    "/contact", // src/app/(marketing)/contact/page.tsx
    "/pricing", // src/app/(marketing)/pricing/page.tsx (if applicable)
    "/privacy", // src/app/(marketing)/privacy/page.tsx
    "/terms", // src/app/(marketing)/terms/page.tsx
    
    // Feature landing pages: src/app/(marketing)/features/...
    "/features/ai-financial-companion",
    "/features/budget-planner",
    "/features/investment-vault",
    "/features/multi-currency-tracker",
    "/features/receipt-scanner",
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1.0 : route.startsWith("/features") ? 0.9 : 0.7,
  }));
}