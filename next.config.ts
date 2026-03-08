import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Vercel deployment optimization
  poweredByHeader: false,
};

export default nextConfig;
