// SPDX-License-Identifier: AGPL-3.0-only
import type { CompatTitle } from "@anyplay/api-client";

/** "1 report", "3 reports". */
export const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? "" : "s"}`;

/**
 * The titles a search matches: every word typed must be in the title ID or in the game's name,
 * in any order, ignoring case. The best-reported games come first.
 */
export function filterTitles(titles: CompatTitle[], query: string): CompatTitle[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = (t: CompatTitle) => `${t.titleId} ${t.title ?? ""}`.toLowerCase();
  return titles
    .filter((t) => words.every((w) => hay(t).includes(w)))
    .toSorted((a, b) => b.reports - a.reports || a.titleId.localeCompare(b.titleId));
}
