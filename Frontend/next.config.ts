// Frontend/next.config.ts

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
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      ...getBackendRemotePattern(),
    ],
  },

  // Rewrites /api/* calls to the backend so cookies are set directly on the frontend domain
  async rewrites() {
    const rawBackendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";

    // Clean URL formatting
    const backendBase = rawBackendUrl.replace(/\/+$/, "").replace(/\/api$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },

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