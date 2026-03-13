import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Capture 100% of traces in dev, 10% in production to control volume
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session replay — capture all sessions where an error occurred
    replaysOnErrorSampleRate: 1.0,
    // Sample 1% of normal sessions (no error) in production
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,

    integrations: [
      Sentry.replayIntegration({
        // Mask all text and block all media by default for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
