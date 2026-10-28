import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

afterEach(() => vi.unstubAllEnvs());

describe("proxy", () => {
  it("sets a strict policy with a fresh nonce on every response", () => {
    const a = proxy(new NextRequest("http://127.0.0.1:4400/"));
    const b = proxy(new NextRequest("http://127.0.0.1:4400/"));
    const cspA = a.headers.get("content-security-policy") ?? "";
    const cspB = b.headers.get("content-security-policy") ?? "";
    expect(cspA).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(cspA).toContain("object-src 'none'");
    expect(cspA).toContain("frame-ancestors 'none'");
    expect(cspA).toContain("base-uri 'self'");
    expect(cspA).not.toBe(cspB);
  });
  it("lets the page report errors to the DSN origin and to nobody else", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public@sentry.test/1");
    const csp = proxy(new NextRequest("http://127.0.0.1:4400/")).headers.get("content-security-policy") ?? "";
    expect(csp).toContain("connect-src 'self' https://sentry.test");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const without = proxy(new NextRequest("http://127.0.0.1:4400/")).headers.get("content-security-policy") ?? "";
    expect(without).not.toContain("sentry");
  });
  it("does not read sessions or decide who may see what: authentication belongs to the API", () => {
    // The one cookie it touches is the language (`lang`), and only to remember an explicit ?lang=.
    const source = proxy.toString().replaceAll(/\.cookies\.(?:get|set)\((?:\(0,)?\w+\.LOCALE_COOKIE/g, "");
    expect(source).not.toMatch(/cookies|session|redirect|rewrite/i);
  });
  it("hands the render the language: ?lang= first, then the cookie, then Accept-Language", () => {
    const lang = (url: string, headers: Record<string, string> = {}) =>
      proxy(new NextRequest(url, { headers })).headers.get("x-middleware-request-x-locale");
    expect(lang("http://127.0.0.1:4400/sign-in?lang=tr", { cookie: "lang=de", "accept-language": "fr" })).toBe("tr");
    expect(lang("http://127.0.0.1:4400/sign-in", { cookie: "lang=de", "accept-language": "fr" })).toBe("de");
    expect(lang("http://127.0.0.1:4400/sign-in", { "accept-language": "pt-BR,pt;q=0.9" })).toBe("pt");
    expect(lang("http://127.0.0.1:4400/sign-in", { "accept-language": "ja" })).toBe("en");
  });
  it("keeps the pages that are not translated yet in English, so <html lang> tells the truth", () => {
    const lang = (url: string) => proxy(new NextRequest(url)).headers.get("x-middleware-request-x-locale");
    expect(lang("http://127.0.0.1:4400/?lang=de")).toBe("en");
    expect(lang("http://127.0.0.1:4400/download?lang=tr")).toBe("en");
    expect(lang("http://127.0.0.1:4400/account/privacy?lang=tr")).toBe("tr");
    expect(lang("http://127.0.0.1:4400/u/mira?lang=fr")).toBe("fr");
    expect(lang("http://127.0.0.1:4400/join/ABCD?lang=es")).toBe("es");
  });
  it("remembers an explicit language in a cookie, and only an explicit one", () => {
    const remembered = proxy(new NextRequest("http://127.0.0.1:4400/sign-in?lang=es")).headers.get("set-cookie") ?? "";
    expect(remembered).toMatch(/lang=es/);
    expect(remembered).toMatch(/SameSite=lax/i);
    expect(proxy(new NextRequest("http://127.0.0.1:4400/sign-in", { headers: { "accept-language": "es" } })).headers.get("set-cookie")).toBeNull();
    expect(proxy(new NextRequest("http://127.0.0.1:4400/sign-in?lang=xx")).headers.get("set-cookie")).toBeNull();
  });
});
