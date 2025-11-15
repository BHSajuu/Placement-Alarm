import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'img.clerk.com',
      'images.clerk.dev'
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "descriptive-elephant-467.convex.cloud",
        port: "",
        pathname: "/api/storage/**",
      },
    ],
  },
};

export default nextConfig;
