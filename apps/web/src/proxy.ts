// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_HEADER, parseLocale, resolveLocale } from "@/i18n/config";
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
/**
 * The one style element a library writes at run time: Paper Shaders' layout block for its canvas
 * (@paper-design/shaders 0.0.81, shader-mount.js). It cannot take our nonce, so it is allowed by its
 * hash. A new version of the library may change the text; then the shaders lose their sizing and
 * this hash has to be computed again from the new block.
 */
const PAPER_SHADERS_STYLE = "'sha256-bcX2M6hOeEgeI9Ttj3KtXWZuoRsKenyQAlXswSnLakA='";

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const sentry = monitoringOrigin();
  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced bootstrap load the chunks it needs and nothing else.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Inline style ATTRIBUTES are allowed (React `style=` props); style ELEMENTS need the nonce,
    // or, for the shaders' own block, its hash.
    `style-src 'self' ${dev ? "'unsafe-inline'" : `'nonce-${nonce}' ${PAPER_SHADERS_STYLE}`}`,
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
  // The language: an explicit ?lang= (the launcher passes its own), else the cookie, else the browser.
  const param = request.nextUrl.searchParams.get("lang");
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = resolveLocale({ param, cookie, acceptLanguage: request.headers.get("accept-language") });
  headers.set(LOCALE_HEADER, locale);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", csp);
  // An explicit choice is remembered, so the next page opened without it keeps the language.
  if (parseLocale(param) && parseLocale(cookie) !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  return response;
}

export const config = {
  // Documents only: not the build's static files, not the poster images.
  matcher: [{ source: "/((?!_next/static|_next/image|map/|icons/|sw\\.js|favicon.ico).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
