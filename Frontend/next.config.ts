// next.config.ts

/* ==========================================================================
   === SECTION 1: IMPORTS & TYPES ===
   ========================================================================== */
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: ENVIRONMENT PARSING & CONSTANTS ===
   ========================================================================== */
// Helper function to dynamically derive allowed remote image domains from environment variables
const getBackendRemotePattern = (): RemotePattern[] => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const patterns: RemotePattern[] = [
    // Fallback development local upload pattern
    {
      protocol: "http",
      hostname: "localhost",
      port: "5000",
      pathname: "/uploads/**",
    },
  ];

  if (apiUrl) {
    try {
      const parsedUrl = new URL(apiUrl);
      patterns.push({
        protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || "",
        pathname: "/uploads/**",
      });
    } catch {
      // Fallback cleanly if the environment variable URL string is malformed
    }
  }

  return patterns;
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: CONFIGURATION DEFINITION ===
   ========================================================================== */
const nextConfig: NextConfig = {
  // WHY THIS FIX WAS MADE: Enables standalone output for optimized containerized deployments (Docker),
  // bundling only the required node_modules to keep image sizes small.
  output: "standalone",

  // WHY THIS FIX WAS MADE: Explicitly enables Strict Mode to catch unexpected side-effects,
  // double-rendered components, and deprecated React lifecycle usages early in development.
  reactStrictMode: true,

  // WHY THIS FIX WAS MADE: Disables 'X-Powered-By: Next.js' HTTP header to prevent attackers
  // from fingerprinting the tech stack and targeting framework-specific exploits.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Allowed pattern for Google OAuth profile pictures
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // WHY THIS FIX WAS MADE: Merges static development fallbacks with dynamic production API URL patterns.
      ...getBackendRemotePattern(),
    ],
  },

  // WHY THIS FIX WAS MADE: Injects fundamental HTTP security headers into all application routes
  // to harden against Clickjacking, Cross-Site Scripting (XSS), and MIME-type sniffing.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: EXPORT ===
   ========================================================================== */
export default nextConfig;
/* === SECTION 4 END === */