// src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://rakhokhaata.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Blocks /dashboard and EVERYTHING under /dashboard/*
          "/dashboard",
          // Auth flows
          "/login",
          "/signup",
          "/onboarding",
          "/reset-password",
          "/reset-vault-pin",
          "/verify-email",
          // Other private pages
          "/beta",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}