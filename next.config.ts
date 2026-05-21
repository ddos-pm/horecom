import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.tildacdn.pro" },
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "thb.tildacdn.pro" },
      { protocol: "https", hostname: "thb.tildacdn.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.horecom.kz" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
