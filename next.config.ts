import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // No browser source maps in production: smaller bundles, no source leakage.
  productionBrowserSourceMaps: false,
  // Don't advertise the framework in response headers (fingerprinting).
  poweredByHeader: false,
  // Gzip/brotli compression at the server level (Vercel also does this at
  // the edge, but local/self-hosted runs benefit).
  compress: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "idb-keyval", "goey-toast"],
  },
};

export default nextConfig;
