import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://rakhokhaata.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/ai-insights/",
          "/budgets/",
          "/categories/",
          "/investment-vault/",
          "/transactions/",
          "/settings/",
          "/login",
          "/signup",
          "/onboarding",
          "/reset-password",
          "/reset-vault-pin",
          "/verify-email",
          "/beta",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}