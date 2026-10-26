// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type CompatList, type CompatTitle, type RunVerdict, describeError, isApiError } from "@anyplay/api-client";
import { CheckCircleIcon, ListBulletIcon, MagnifyingGlassIcon, PlayCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { loadApi } from "@/lib/api";
import { Wordmark } from "./header";
import { LINKS } from "./links";
import { LandingProviders } from "./providers";
import { FILTERS, type Filter, type ModeFacts, type Sort, SORTS, arrange, hasMode, plural } from "./compat";
import modeData from "@/data/title-modes.v1.json";

const FACTS: ModeFacts = modeData.titles;
const FILTER_WORD: Record<Filter, string> = { works: "Works well", issues: "Has issues", online: "Online", lan: "LAN" };
const SORT_WORD: Record<Sort, string> = { reports: "Most reports", best: "Best result first", name: "Name, A to Z" };

/**
 * The public compatibility list: for each game, how it ran for the players who answered "How did it
 * run?". The verdict is a word with an icon and a four-step meter, so colour only adds to it. The
 * page knows title IDs, the game's own name when the reports carried one, and counts. It never shows
 * game art, trophy names or trophy texts: the web does not have them.
 */

const VERDICTS: Record<RunVerdict, { word: string; level: number; icon: ComponentType<{ className?: string }>; chip: string; bar: string }> = {
  playable: { word: "Playable", level: 4, icon: CheckCircleIcon, chip: "bg-[#3fd38a]/12 text-[#7fe3b0]", bar: "bg-[#3fd38a]" },
  in_game: { word: "In game", level: 3, icon: PlayCircleIcon, chip: "bg-[#ff5a1f]/15 text-[#ffb487]", bar: "bg-[#ff7a3d]" },
  menus: { word: "Reaches menus", level: 2, icon: ListBulletIcon, chip: "bg-[#f0c75e]/12 text-[#f0d28a]", bar: "bg-[#f0c75e]" },
  no_start: { word: "Doesn’t start", level: 1, icon: XCircleIcon, chip: "bg-[#ff5a3d]/10 text-[#ffb3a6]", bar: "bg-[#ff8c80]" },
};

const PAGE = 40;

type State = { status: "loading" } | { status: "ready"; list: CompatList } | { status: "failed"; message: string };

export function CompatibilityPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [chosen, setChosen] = useState<ReadonlySet<Filter>>(new Set());
  const [sort, setSort] = useState<Sort>("reports");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadApi()
      .then((api) => api.compatibility.list())
      .then(
        (list) => alive && setState({ status: "ready", list }),
        (e) =>
          alive &&
          setState({
            status: "failed",
            message: isApiError(e) && e.code === "not_found" ? "The list is not ready yet. Check back soon." : describeError(e),
          }),
      );
    return () => {
      alive = false;
    };
  }, [attempt]);
  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  const search = (q: string) => {
    setQuery(q);
    setShown(PAGE);
  };

  const titles = useMemo(() => (state.status === "ready" ? state.list.titles : []), [state]);
  const found = useMemo(() => arrange(titles, query, chosen, sort, FACTS), [titles, query, chosen, sort]);
  // A mode with no game in the data would be a filter that always comes back empty: leave it out.
  const offered = useMemo(() => FILTERS.filter((f) => (f !== "lan" && f !== "online") || titles.some((t) => hasMode(FACTS, t.titleId, f))), [titles]);
  const narrowed = query.trim() !== "" || chosen.size > 0;
  const toggle = (f: Filter) => {
    const next = new Set(chosen);
    // Works well and Has issues exclude each other; picking one drops the other.
    if (next.has(f)) next.delete(f);
    else {
      next.add(f);
      if (f === "works") next.delete("issues");
      if (f === "issues") next.delete("works");
    }
    setChosen(next);
    setShown(PAGE);
  };
  const clearAll = () => {
    setChosen(new Set());
    search("");
  };

  return (
    <LandingProviders>
      <div className="night min-h-dvh overflow-x-clip bg-bg text-ink">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_90_31/0.14),transparent)]" />
        <header className="relative mx-auto flex min-h-20 w-full max-w-[880px] items-center justify-between px-[max(var(--gutter),env(safe-area-inset-left))] pt-[env(safe-area-inset-top)]">
          <Link href="/" aria-label="AnyPlay, home" className="-mx-2 inline-flex min-h-11 items-center rounded-full px-2">
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center rounded-full px-3 text-[14px] text-ink-2 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink [@media(pointer:coarse)]:min-h-11"
          >
            Back to the start
          </Link>
        </header>

        <main id="main" className="relative mx-auto w-full max-w-[880px] px-[max(var(--gutter),env(safe-area-inset-left))] pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <h1 className="display text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05]">Compatibility</h1>
          <p className="mt-3 max-w-[36rem] text-[16px] leading-[1.6] text-ink-2 text-pretty">
            How games run with AnyPS5, as told by players who answered “How did it run?” after a session. A game is listed once three players have answered.
          </p>

          <div className="mt-8">
            <label htmlFor="find" className="text-[14px] font-medium text-ink-2">
              Find a game
            </label>
            <div className="relative mt-2">
              <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" />
              <input
                id="find"
                type="search"
                name="q"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Title ID or name"
                value={query}
                onChange={(e) => search(e.target.value)}
                className="h-12 w-full rounded-[14px] bg-white/[0.04] pr-4 pl-11 text-[16px] text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] outline-none transition-[background-color,box-shadow] duration-[var(--duration-quick)] placeholder:text-ink-3 focus:bg-white/[0.06] focus:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22),0_0_0_3px_rgb(255_122_61/0.35)] [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>

          {state.status === "ready" && titles.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div role="group" aria-label="Show only" className="flex flex-wrap gap-3">
                {offered.map((f) => (
                  <button key={f} type="button" aria-pressed={chosen.has(f)} onClick={() => toggle(f)} className={chip}>
                    {FILTER_WORD[f]}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-[14px] text-ink-2">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as Sort);
                    setShown(PAGE);
                  }}
                  className="h-11 rounded-full bg-white/[0.06] px-4 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] outline-none focus-visible:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22),0_0_0_3px_rgb(255_122_61/0.35)]"
                >
                  {SORTS.map((o) => (
                    <option key={o} value={o}>
                      {SORT_WORD[o]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <p role="status" className="mt-6 min-h-6 text-[14px] text-ink-3 tabular-nums">
            {state.status === "ready" && titles.length > 0 && (narrowed ? `${plural(found.length, "game")} match` : plural(titles.length, "game"))}
          </p>

          <div className="mt-2">
            {state.status === "loading" && (
              <div aria-busy role="status" className="grid gap-3">
                <span className="sr-only">Loading</span>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="h-28 animate-pulse rounded-[20px] bg-white/[0.04]" />
                ))}
              </div>
            )}
            {state.status === "failed" && (
              <div role="alert" className="grid justify-items-start gap-3 text-[15px] text-ink-2">
                {state.message}
                <button type="button" onClick={retry} className={button}>
                  Try again
                </button>
              </div>
            )}
            {state.status === "ready" && titles.length === 0 && (
              <p className="rounded-[20px] bg-white/[0.03] px-5 py-6 text-[15px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                No game has three answers yet. Play one in the launcher and answer “How did it run?” to start the list.
              </p>
            )}
            {state.status === "ready" && titles.length > 0 && found.length === 0 && (
              <div className="grid justify-items-start gap-3 rounded-[20px] bg-white/[0.03] px-5 py-6 text-[15px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                <p>{query.trim() ? `No game matches “${query.trim()}”${chosen.size ? " with these filters" : ""}. Check the title ID, or try part of the name.` : "No game fits these filters."}</p>
                <button type="button" onClick={clearAll} className={button}>
                  {chosen.size ? "Clear filters" : "Clear search"}
                </button>
              </div>
            )}
            {found.length > 0 && (
              <ul className="grid gap-3">
                {found.slice(0, shown).map((t) => (
                  <Title key={t.titleId} title={t} />
                ))}
              </ul>
            )}
            {found.length > shown && (
              <div className="mt-6">
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className={button}>
                  Show more games
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="relative border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto w-full max-w-[880px] px-[max(var(--gutter),env(safe-area-inset-left))] py-8 text-[14px] leading-[1.6] text-ink-3">
            <p className="max-w-[36rem] text-pretty">Answers are the opinions of players, not a promise. Not affiliated with any console maker.</p>
            <a href={LINKS.github} className="mt-1 inline-flex min-h-11 items-center text-ink-2 underline underline-offset-4 [@media(hover:hover)]:hover:text-ink">
              Open source on GitHub
            </a>
          </div>
        </footer>
      </div>
    </LandingProviders>
  );
}

const button =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] px-5 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.1]";

const chip =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] px-5 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color,box-shadow,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] aria-pressed:bg-[#ff5a1f]/15 aria-pressed:shadow-[inset_0_0_0_1px_rgb(255_122_61/0.6)] [@media(hover:hover)]:hover:bg-white/[0.1]";

function Title({ title: t }: { title: CompatTitle }) {
  const v = VERDICTS[t.verdict];
  const Icon = v.icon;
  const rows: [RunVerdict, number][] = [
    ["playable", t.counts.playable],
    ["in_game", t.counts.inGame],
    ["menus", t.counts.menus],
    ["no_start", t.counts.noStart],
  ];
  return (
    <li className="rounded-[20px] bg-[#141312] px-4 pt-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),inset_0_1px_0_rgb(255_255_255/0.05)] sm:px-6 sm:pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className={`text-[17px] leading-[1.3] font-semibold tracking-[-0.01em] break-words ${t.title ? "" : "font-mono text-[16px]"}`}>{t.title ?? t.titleId}</h2>
          {t.title && <p className="mt-0.5 font-mono text-[13px] text-ink-3">{t.titleId}</p>}
        </div>
        <span className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full pr-3 pl-2 text-[13px] font-semibold ${v.chip}`}>
          <Icon aria-hidden className="size-[18px]" />
          {v.word}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span aria-hidden className="flex w-24 gap-1">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= v.level ? v.bar : "bg-white/[0.1]"}`} />
          ))}
        </span>
        <span className="text-[13px] text-ink-3 tabular-nums">{plural(t.reports, "report")}</span>
        {(["online", "lan"] as const).map((m) => hasMode(FACTS, t.titleId, m) && (
          <span key={m} className="inline-flex h-6 items-center rounded-full bg-white/[0.06] px-2.5 text-[12px] font-medium text-ink-2">
            {FILTER_WORD[m]}
          </span>
        ))}
      </div>
      <details className="group mt-3 border-t border-white/[0.06]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[14px] font-medium text-ink-2 select-none [&::-webkit-details-marker]:hidden">
          Breakdown
          <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-ink-3 transition-transform duration-[var(--duration-quick)] group-open:rotate-180">
            <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="grid gap-5 pb-4 sm:grid-cols-2">
          <dl className="grid gap-1.5 text-[14px]">
            {rows.map(([k, n]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-ink-2">{VERDICTS[k].word}</dt>
                <dd className="text-ink tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
          {t.versions.length > 0 && (
            <dl className="grid gap-1.5 text-[14px]">
              {t.versions.map((x) => (
                <div key={x.version} className="flex justify-between gap-4">
                  <dt className="text-ink-2">
                    Version <span className="font-mono">{x.version}</span>
                  </dt>
                  <dd className="text-ink tabular-nums">
                    {VERDICTS[x.verdict].word}, {plural(x.reports, "report")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </details>
    </li>
  );
}
