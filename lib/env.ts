/**
 * Centralized environment variable access.
 * Import `env` instead of using `process.env` directly throughout the app.
 *
 * Required vars will throw at startup if missing in production.
 * Optional vars return undefined when not set.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
}

function optional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const env = {
  // ── App ─────────────────────────────────────────────────────────────────────
  /** Public base URL of the app. Used for invite links, CORS, etc. */
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  /** Current deployment environment */
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // ── Database ─────────────────────────────────────────────────────────────────
  DATABASE_URL: required("DATABASE_URL"),

  // ── Auth ─────────────────────────────────────────────────────────────────────
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  /** Same as APP_URL but named per Better-Auth convention */
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // ── AI Models ─────────────────────────────────────────────────────────────────
  /** Gemini model for extraction. Defaults to gemini-2.5-flash. */
  EXTRACTION_MODEL: optional("EXTRACTION_MODEL") ?? "gemini-2.5-flash",
  /** Claude model for cross-validation. When unset, validation step is skipped. */
  VALIDATION_MODEL: optional("VALIDATION_MODEL"),

  // ── Google Cloud Storage ──────────────────────────────────────────────────────
  GCS_BUCKET_NAME: optional("GCS_BUCKET_NAME"),
  GOOGLE_CLOUD_PROJECT: optional("GOOGLE_CLOUD_PROJECT"),

  // ── Email ─────────────────────────────────────────────────────────────────────
  RESEND_API_KEY: optional("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: optional("RESEND_FROM_EMAIL") ?? "noreply@elmi.app",

  // ── Monitoring ────────────────────────────────────────────────────────────────
  /** Sentry DSN. When unset, error tracking is disabled. */
  SENTRY_DSN: optional("NEXT_PUBLIC_SENTRY_DSN"),

  // ── Inngest ───────────────────────────────────────────────────────────────────
  INNGEST_EVENT_KEY: optional("INNGEST_EVENT_KEY"),
  INNGEST_SIGNING_KEY: optional("INNGEST_SIGNING_KEY"),
} as const;
