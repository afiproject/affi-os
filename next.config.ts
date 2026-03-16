import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pics.dmm.co.jp",
      },
      {
        protocol: "https",
        hostname: "pics.dmm.com",
      },
    ],
  },
  // Vercel deployment optimization
  poweredByHeader: false,
};

export default nextConfig;
