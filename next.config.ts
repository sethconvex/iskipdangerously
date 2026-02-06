import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Convex file storage
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        // fal.ai generated images
        protocol: "https",
        hostname: "fal.media",
      },
      {
        protocol: "https",
        hostname: "*.fal.media",
      },
      {
        // WorkOS avatars
        protocol: "https",
        hostname: "*.workos.com",
      },
    ],
  },
};

export default nextConfig;
