// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type BoardLine, type BoardPage, type BoardView, describeError, isApiError } from "@anyplay/api-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadApi } from "@/lib/api";
import { Wordmark } from "../landing/header";
import { LandingProviders } from "../landing/providers";

/**
 * A board of best scores, read-only. The page knows a title ID, the board ID the game passed, handles,
 * scores and ranks, and nothing else: names, units and art of a game stay in the game's files. A
 * visitor sees the entries whose owners show their scores to everyone; a signed-in player also sees
 * their friends and their own line (network ADR 0041).
 */

const VIEWS: { view: BoardView; word: string }[] = [
  { view: "top", word: "Top" },
  { view: "around", word: "Around you" },
  { view: "friends", word: "Friends" },
];
const STEP = 25;

type State =
  | { status: "loading" }
  | { status: "ready"; page: BoardPage; more: boolean }
  | { status: "needs-session" }
  | { status: "missing" }
  | { status: "failed"; message: string };

const number = new Intl.NumberFormat("en");
const day = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export function BoardScreen({ titleId, board }: { titleId: string; board: string }) {
  const [view, setView] = useState<BoardView>("top");
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let alive = true;
    loadApi()
      .then((api) => api.boards.page(titleId, board, { view, count: STEP }))
      .then(
        (page) => alive && setState({ status: "ready", page, more: view !== "around" && page.entries.length < page.total }),
        (e) => {
          if (!alive) return;
          if (isApiError(e) && e.code === "not_found") setState({ status: "missing" });
          else if (isApiError(e) && e.code === "unauthorized") setState({ status: "needs-session" });
          else setState({ status: "failed", message: describeError(e) });
        },
      );
    return () => {
      alive = false;
    };
  }, [titleId, board, view, attempt]);

  const choose = (next: BoardView) => {
    if (next === view) return;
    setState({ status: "loading" });
    setView(next);
  };
  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  const more = async () => {
    if (state.status !== "ready") return;
    const { page } = state;
    setLoadingMore(true);
    try {
      const api = await loadApi();
      const next = await api.boards.page(titleId, board, { view, start: page.start + page.entries.length, count: STEP });
      const entries = [...page.entries, ...next.entries];
      setState({ status: "ready", page: { ...next, start: page.start, entries }, more: entries.length < next.total && next.entries.length > 0 });
    } catch (e) {
      setState({ status: "failed", message: describeError(e) });
    } finally {
      setLoadingMore(false);
    }
  };

  const page = state.status === "ready" ? state.page : null;

  return (
    <LandingProviders>
      <div className="night min-h-dvh overflow-x-clip bg-bg text-ink">
        <header className="relative mx-auto flex min-h-20 w-full max-w-[880px] items-center justify-between px-[max(var(--gutter),env(safe-area-inset-left))] pt-[env(safe-area-inset-top)]">
          <Link href="/" aria-label="AnyPlay, home" className="-mx-2 inline-flex min-h-11 items-center rounded-full px-2">
            <Wordmark />
          </Link>
          <Link
            href="/compatibility"
            className="inline-flex min-h-9 items-center rounded-full px-3 text-[14px] text-ink-2 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink [@media(pointer:coarse)]:min-h-11"
          >
            Compatibility list
          </Link>
        </header>

        <main id="main" className="relative mx-auto w-full max-w-[880px] px-[max(var(--gutter),env(safe-area-inset-left))] pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <h1 className="display text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05] break-words">Board {board}</h1>
          <p className="mt-2 font-mono text-[13px] break-all text-ink-3">{titleId}</p>
          {page && (
            <p className="mt-3 max-w-[36rem] text-[16px] leading-[1.6] text-ink-2 text-pretty">
              {page.order === "high" ? "Higher scores rank first." : "Lower scores rank first."} Equal scores share a rank.
              {page.status === "closed" && " This board takes no new scores."}
            </p>
          )}

          <div role="group" aria-label="Show" className="mt-8 flex flex-wrap gap-3">
            {VIEWS.map((v) => (
              <button key={v.view} type="button" aria-pressed={view === v.view} onClick={() => choose(v.view)} className={chip}>
                {v.word}
              </button>
            ))}
          </div>

          <p role="status" className="mt-6 min-h-6 text-[14px] text-ink-3 tabular-nums">
            {page && page.total > 0 && `${number.format(page.total)} ${page.total === 1 ? "player" : "players"}`}
          </p>

          <div className="mt-2">
            {state.status === "loading" && (
              <div aria-busy role="status" className="grid gap-2">
                <span className="sr-only">Loading</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-14 animate-pulse rounded-[16px] bg-white/[0.04]" />
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
            {state.status === "missing" && (
              <p className="rounded-[20px] bg-white/[0.03] px-5 py-6 text-[15px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                There is no board {board} for this game. A board appears once a player has a score on it, and only where leaderboards are on.
              </p>
            )}
            {state.status === "needs-session" && (
              <div className="grid justify-items-start gap-3 rounded-[20px] bg-white/[0.03] px-5 py-6 text-[15px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                <p>Sign in to see your friends and the lines around your own score.</p>
                <Link href="/sign-in" className={button}>
                  Sign in
                </Link>
              </div>
            )}
            {page && page.entries.length === 0 && (
              <p className="rounded-[20px] bg-white/[0.03] px-5 py-6 text-[15px] leading-[1.6] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                {view === "around"
                  ? "You have no score on this board yet. Play the game in the launcher and your line shows up here."
                  : "No scores to show yet. Players choose who sees their scores, so scores shared with friends only do not appear here."}
              </p>
            )}
            {page && page.entries.length > 0 && <Lines page={page} />}
            {state.status === "ready" && state.more && (
              <div className="mt-6">
                <button type="button" onClick={more} disabled={loadingMore} className={button}>
                  {loadingMore ? "Loading" : "Show more players"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </LandingProviders>
  );
}

function Lines({ page }: { page: BoardPage }) {
  return (
    <table className="w-full border-separate border-spacing-y-2 text-start">
      <caption className="sr-only">
        Board {page.board}, {page.view === "top" ? "best scores" : page.view === "around" ? "scores around you" : "you and your friends"}
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Player</th>
          <th scope="col">Score</th>
          <th scope="col">Reached</th>
        </tr>
      </thead>
      <tbody>
        {page.entries.map((line) => (
          <Row key={`${line.rank}-${line.handle}`} line={line} mine={page.me?.handle === line.handle} />
        ))}
      </tbody>
    </table>
  );
}

function Row({ line, mine }: { line: BoardLine; mine: boolean }) {
  const cell = "bg-[#141312] py-3.5 first:rounded-s-[16px] last:rounded-e-[16px]";
  return (
    <tr className={mine ? "[&>*]:shadow-[inset_0_1px_0_rgb(255_122_61/0.6),inset_0_-1px_0_rgb(255_122_61/0.6)]" : ""}>
      <th scope="row" className={`${cell} w-14 ps-4 pe-2 text-start text-[15px] font-semibold tabular-nums text-ink-2 sm:w-20 sm:ps-6`}>
        {line.rank}
      </th>
      <td className={`${cell} min-w-0 px-2 text-[16px] break-words`}>
        <Link href={`/u/${encodeURIComponent(line.handle)}`} className="rounded-sm underline-offset-4 [@media(hover:hover)]:hover:underline">
          {line.handle}
        </Link>
        {mine && <span className="ms-2 inline-flex h-6 items-center rounded-full bg-[#ff5a1f]/15 px-2.5 align-middle text-[12px] font-medium text-[#ffb487]">You</span>}
      </td>
      <td className={`${cell} px-2 text-end text-[16px] font-semibold tabular-nums sm:px-4`}>{number.format(line.score)}</td>
      <td className={`${cell} hidden pe-4 ps-2 text-end text-[13px] tabular-nums text-ink-3 sm:table-cell sm:pe-6`}>
        {day.format(new Date(line.achieved * 1000))}
      </td>
    </tr>
  );
}

const button =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] px-5 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] disabled:opacity-60 [@media(hover:hover)]:hover:bg-white/[0.1]";

const chip =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] px-5 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color,box-shadow,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] aria-pressed:bg-[#ff5a1f]/15 aria-pressed:shadow-[inset_0_0_0_1px_rgb(255_122_61/0.6)] [@media(hover:hover)]:hover:bg-white/[0.1]";
