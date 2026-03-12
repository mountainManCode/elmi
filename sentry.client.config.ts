import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Capture 100% of transactions in dev, 10% in prod to control volume
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Only initialize Replay in production
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
  });
}
