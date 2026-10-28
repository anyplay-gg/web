// SPDX-License-Identifier: AGPL-3.0-only
import type { Locale } from "./config";

/**
 * The words, one JSON file per area and language under `messages/<language>/`. English is the
 * source: every other language must have exactly the same keys (messages.test.ts), and the ICU
 * placeholders must match, so a missing or mistyped string fails a test, not a visitor.
 */
export const AREAS = ["common", "auth", "account"] as const;
export type Area = (typeof AREAS)[number];
export type Messages = Record<string, unknown>;

export async function loadMessages(locale: Locale, areas: readonly Area[] = AREAS): Promise<Messages> {
  const entries = await Promise.all(areas.map(async (area) => [area, (await import(`../../messages/${locale}/${area}.json`)).default] as const));
  return Object.fromEntries(entries);
}
