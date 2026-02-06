import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Convex files are type-checked separately by `npx convex dev`
    ignoreBuildErrors: true,
  },
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
