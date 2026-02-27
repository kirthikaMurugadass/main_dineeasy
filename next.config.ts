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
      // Support subdomain images in production
      { protocol: "https", hostname: "*.dineeasy.app" },
    ],
    // Allow images from localhost/127.0.0.1 (local Supabase)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization for localhost to avoid private IP errors
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  transpilePackages: ["@appletosolutions/reactbits"],
  // Enable strict mode for better error detection
  reactStrictMode: true,
  // Optimize for production
  compress: true,
  // Support subdomain routing
  async headers() {
    return [
      // Preview routes must come FIRST to allow iframe embedding
      {
        source: "/preview/:restaurant/:menuId",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // Allow iframe embedding for preview pages
          },
        ],
      },
      {
        source: "/preview/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // Allow iframe embedding for preview pages
          },
        ],
      },
      // All other routes
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
