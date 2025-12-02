// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Only use this if you run linting in a separate CI step to save build time
    ignoreDuringBuilds: true, 
  },
  // Ensure we can use external images if needed later
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;