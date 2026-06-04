import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins:
    process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",").map((origin) =>
      origin.trim(),
    ) ?? [],
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
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (i.e. in CI/Vercel).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Tunnel Sentry requests through the Next.js server to avoid ad blockers.
  tunnelRoute: "/monitoring",
});
