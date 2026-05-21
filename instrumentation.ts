// Next.js instrumentation hook — picks the right Sentry runtime per env.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: "Pages Router" | "App Router"; routePath: string; routeType: string },
) => {
  // Lazy import so non-Sentry runs stay cheap.
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
