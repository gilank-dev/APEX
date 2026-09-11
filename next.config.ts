import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self)",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
];

const nextConfig: NextConfig = {
  // No browser source maps in production: smaller bundles, no source leakage.
  productionBrowserSourceMaps: false,
  // Don't advertise the framework in response headers (fingerprinting).
  poweredByHeader: false,
  // Gzip/brotli compression at the server level (Vercel also does this at
  // the edge, but local/self-hosted runs benefit).
  compress: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "idb-keyval", "goey-toast"],
  },
};

export default nextConfig;
