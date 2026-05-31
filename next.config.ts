import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pdtdpyyzgjrslceuqkje.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (i.e. in CI/Vercel).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Tunnel Sentry requests through the Next.js server to avoid ad blockers.
  tunnelRoute: "/monitoring",
});
