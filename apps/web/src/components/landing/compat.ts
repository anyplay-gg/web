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

/** What a game offers beyond the single-player run. Per-title facts are data, never code. */
export type Mode = "lan" | "online";

/** Facts by title ID, from `data/title-modes.v1.json` (a copy of the launcher's `lan-titles.v1.json`). */
export type ModeFacts = Record<string, { mode?: string }>;

/** `works`: players got it to `playable`. `issues`: the best answer is less than that. */
export type Filter = "works" | "issues" | Mode;
export const FILTERS: Filter[] = ["works", "issues", "online", "lan"];

export type Sort = "reports" | "best" | "name";
export const SORTS: Sort[] = ["reports", "best", "name"];

const LEVEL = { no_start: 1, menus: 2, in_game: 3, playable: 4 } as const;

/** Whether the data lists the title for this mode. */
export const hasMode = (facts: ModeFacts, titleId: string, mode: Mode): boolean => facts[titleId]?.mode === mode;

/** True when a title passes every chosen filter (they narrow each other). */
export function passes(t: CompatTitle, chosen: ReadonlySet<Filter>, facts: ModeFacts): boolean {
  for (const f of chosen) {
    if (f === "works" && t.verdict !== "playable") return false;
    if (f === "issues" && t.verdict === "playable") return false;
    if ((f === "lan" || f === "online") && !hasMode(facts, t.titleId, f)) return false;
  }
  return true;
}

/** Search, filters and sort in one pass; the input list is left alone. */
export function arrange(titles: CompatTitle[], query: string, chosen: ReadonlySet<Filter>, sort: Sort, facts: ModeFacts): CompatTitle[] {
  const name = (t: CompatTitle) => (t.title ?? t.titleId).toLowerCase();
  const byReports = (a: CompatTitle, b: CompatTitle) => b.reports - a.reports || a.titleId.localeCompare(b.titleId);
  const order: Record<Sort, (a: CompatTitle, b: CompatTitle) => number> = {
    reports: byReports,
    best: (a, b) => LEVEL[b.verdict] - LEVEL[a.verdict] || byReports(a, b),
    name: (a, b) => name(a).localeCompare(name(b)) || a.titleId.localeCompare(b.titleId),
  };
  return filterTitles(titles, query)
    .filter((t) => passes(t, chosen, facts))
    .toSorted(order[sort]);
}
