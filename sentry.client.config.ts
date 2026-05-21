import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Conservative sample rates — Horecom is low-traffic in V0, we want
    // every signal but not 100% of trivial events.
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Don't ship Sentry events during local dev (still inits so we can verify
    // setup is correct, but errors stay in console).
    enabled: process.env.NODE_ENV === "production",
  });
}
