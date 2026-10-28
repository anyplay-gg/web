// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { fromAcceptLanguage, parseLocale, resolveLocale } from "./config";

describe("locale resolution", () => {
  it("reads region and case variants", () => {
    expect(parseLocale("de-AT")).toBe("de");
    expect(parseLocale(" TR ")).toBe("tr");
    expect(parseLocale("pt_BR")).toBe("pt");
    expect(parseLocale("ja")).toBeNull();
    expect(parseLocale("")).toBeNull();
    expect(parseLocale(undefined)).toBeNull();
  });
  it("takes the best of Accept-Language by weight, then by order", () => {
    expect(fromAcceptLanguage("fr-CH, fr;q=0.9, en;q=0.8")).toBe("fr");
    expect(fromAcceptLanguage("ja, es;q=0.4, de;q=0.7")).toBe("de");
    expect(fromAcceptLanguage("de;q=0, en")).toBe("en");
    expect(fromAcceptLanguage("ja, zh")).toBeNull();
    expect(fromAcceptLanguage("de;q=abc")).toBeNull();
  });
  it("prefers the explicit parameter, then the cookie, then the browser, then English", () => {
    expect(resolveLocale({ param: "tr", cookie: "de", acceptLanguage: "fr" })).toBe("tr");
    expect(resolveLocale({ param: "xx", cookie: "de", acceptLanguage: "fr" })).toBe("de");
    expect(resolveLocale({ cookie: "xx", acceptLanguage: "fr" })).toBe("fr");
    expect(resolveLocale({ acceptLanguage: "ja" })).toBe("en");
    expect(resolveLocale({})).toBe("en");
  });
});
