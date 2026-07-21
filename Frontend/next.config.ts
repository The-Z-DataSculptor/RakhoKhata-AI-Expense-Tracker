import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Enable standalone build for lightweight Docker image */
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;