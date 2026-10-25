// SPDX-License-Identifier: AGPL-3.0-only
//
// Error monitoring through the Sentry SDK, OFF by default. A self-hoster who sets
// NEXT_PUBLIC_SENTRY_DSN to a Sentry or GlitchTip (Sentry-compatible, MIT) address gets browser
// errors there; nobody else sends anything anywhere. The SDK is loaded only when a DSN exists, so
// the default bundle does not contain it. No session replay, no tracing; the page URL is removed from every event.

/**
 * The browser SDK's default integrations attach the page URL (which can hold a /u/<handle>), the
 * referrer and the user agent as event.request. None of that is needed to fix a crash, so it is
 * dropped before sending, along with any user and breadcrumbs.
 */
export function scrubEvent<T extends { request?: unknown; user?: unknown; breadcrumbs?: unknown }>(event: T): T {
  delete event.request;
  delete event.user;
  delete event.breadcrumbs;
  return event;
}

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
    beforeSend: scrubEvent,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "production",
  });
  return true;
}

/** Where a caught error came from: a route's error.tsx or the root global-error.tsx. */
export type Boundary = "route" | "global";

/**
 * Reports an error that an error boundary caught. Boundary-caught render errors do not reach
 * Sentry's global handlers, so they have to be sent on purpose. Fire and forget: it never throws,
 * does nothing without a DSN (and then loads nothing). The event carries the error's message and
 * stack, the boundary and Next's digest (a hash that ties it to the server log). Page URL, referrer,
 * user and breadcrumbs are scrubbed in beforeSend; Next replaces the message of a server-side error
 * with a generic one in production.
 */
export async function captureError(
  error: unknown,
  context: { digest?: string; boundary?: Boundary } = {},
  dsn: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN,
): Promise<void> {
  if (!dsn) return;
  try {
    if (!(await initMonitoring(dsn))) return;
    const Sentry = await import("@sentry/browser");
    Sentry.captureException(error, {
      tags: { boundary: context.boundary ?? "route" },
      extra: { digest: context.digest },
    });
  } catch {
    // Reporting must never be the reason a second error appears on the error screen.
  }
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
