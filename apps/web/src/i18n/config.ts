// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The languages of the account flows: the launcher's six, with the launcher's codes, so the launcher
 * can pass its own language as `?lang=`. English is the fallback for everything else.
 */
export const LOCALES = ["en", "tr", "de", "es", "fr", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** The cookie that remembers the choice, and the header the proxy hands to the render. */
export const LOCALE_COOKIE = "lang";
export const LOCALE_HEADER = "x-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const known = new Set<string>(LOCALES);

/** `de`, `de-AT`, `DE_at` and ` de ` all mean German; anything else is no answer. */
export function parseLocale(value: string | null | undefined): Locale | null {
  const base = value?.trim().toLowerCase().split(/[-_]/)[0];
  return base && known.has(base) ? (base as Locale) : null;
}

/** The best language in an Accept-Language header, honouring q values; null when none is one of ours. */
export function fromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag ?? "", weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((e) => e.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of ranked) {
    const locale = parseLocale(tag);
    if (locale) return locale;
  }
  return null;
}

/** Explicit `?lang=` first, then the cookie, then Accept-Language, then English. */
export function resolveLocale(input: { param?: string | null; cookie?: string | null; acceptLanguage?: string | null }): Locale {
  return parseLocale(input.param) ?? parseLocale(input.cookie) ?? fromAcceptLanguage(input.acceptLanguage) ?? DEFAULT_LOCALE;
}
