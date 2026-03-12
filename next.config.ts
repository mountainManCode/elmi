import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

// Only wrap with Sentry when DSN is configured — keeps local dev bundle lean.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Suppress Sentry CLI upload logs unless explicitly debugging
      silent: true,
      // Disable source map upload in dev (no auth token)
      sourcemaps: {
        disable: process.env.NODE_ENV !== "production",
      },
    })
  : nextConfig;
