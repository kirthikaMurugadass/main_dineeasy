import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "http",  hostname: "127.0.0.1", port: "54321" },
      { protocol: "http",  hostname: "127.0.0.1" },
      { protocol: "http",  hostname: "localhost", port: "54321" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
