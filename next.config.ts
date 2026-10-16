import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The gateway middleware rewrites requests — allow external image hostnames here if needed.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
