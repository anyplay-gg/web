// SPDX-License-Identifier: AGPL-3.0-only
//
// Error monitoring through the Sentry SDK, OFF by default. A self-hoster who sets
// NEXT_PUBLIC_SENTRY_DSN to a Sentry or GlitchTip (Sentry-compatible, MIT) address gets browser
// errors there; nobody else sends anything anywhere. The SDK is loaded only when a DSN exists, so
// the default bundle does not contain it. No session replay, no tracing, no personal data.

/** Starts monitoring when a DSN is configured. Safe to call more than once. */
export async function initMonitoring(dsn: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN): Promise<boolean> {
  if (!dsn) return false;
  const Sentry = await import("@sentry/browser");
  if (Sentry.getClient()) return true;
  Sentry.init({
    dsn,
    // Sentry 11 sends no personal data unless an integration asks for it; none is added here.
    tracesSampleRate: 0,
    integrations: [],
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "production",
  });
  return true;
}

/** The origin of the DSN, for the CSP's connect-src; null without one. */
export function monitoringOrigin(dsn: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN): string | null {
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    return null;
  }
}
