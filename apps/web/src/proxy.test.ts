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
  it("does not read cookies or sessions: authentication belongs to the API", () => {
    expect(proxy.toString()).not.toMatch(/cookies|session|redirect|rewrite/i);
  });
});
