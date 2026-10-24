// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse, type NextRequest } from "next/server";
import { monitoringOrigin } from "@/lib/monitoring";

/**
 * The Content-Security-Policy, and only that. This file does NOT look at cookies, sessions or
 * paths to decide who may see what: the Rust API owns authentication, and a check in the proxy
 * layer is exactly the class of bypass Next.js had advisories for in 2025 and 2026.
 *
 * Why it is a proxy at all: a strict script policy needs a fresh nonce per response, and a nonce
 * can only be made per request. The price is that pages are rendered per request instead of served
 * as static files; for a handful of public pages that is the right trade (ADR 0003).
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const sentry = monitoringOrigin();
  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced bootstrap load the chunks it needs and nothing else.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Inline style ATTRIBUTES are allowed (React `style=` props); style ELEMENTS need the nonce.
    `style-src 'self' ${dev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${sentry ? ` ${sentry}` : ""}${dev ? " ws://127.0.0.1:4400 http://127.0.0.1:4400" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Documents only: not the build's static files, not the poster images.
  matcher: [{ source: "/((?!_next/static|_next/image|map/|favicon.ico).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
