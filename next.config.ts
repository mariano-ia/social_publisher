import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
