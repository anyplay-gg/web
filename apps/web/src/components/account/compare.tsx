// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type CompareSide, type PublicUser, type TrophyCompare, describeError, isApiError } from "@anyplay/api-client";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Failed } from "./pages";
import { GRADES } from "./social";
import { Card, Empty, Notice, smallButton } from "./ui";
import { loadApi } from "@/lib/api";

/**
 * Your trophies next to another player's in one game they both have. The cloud holds trophy numbers,
 * grades and times, no names or art, so this is a summary: the count per grade, points, who is
 * ahead and how many trophies only one of you has. It never lists the numbers themselves, which
 * would be a column of digits that says nothing without the names.
 */

const num = (n: number) => n.toLocaleString("en");

type Shared =
  | { status: "loading" }
  | { status: "ready"; titles: string[] }
  | { status: "hidden" }
  | { status: "failed"; message: string };

type Result =
  | { status: "loading" }
  | { status: "ready"; data: TrophyCompare }
  | { status: "hidden" }
  | { status: "failed"; message: string };

const HIDDEN = (handle: string) => `${handle}’s trophies aren’t available to compare.`;

/** The compare card of a profile; the page shows it only when the player's trophies are visible. */
export function CompareCard({ user }: { user: PublicUser }) {
  const { handle } = user.account;
  const [shared, setShared] = useState<Shared>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [title, setTitle] = useState<string | null>(null);
  const select = useId();

  useEffect(() => {
    let alive = true;
    loadApi()
      .then(async (api) => {
        const [mine, theirs] = await Promise.all([api.trophies.mine(), api.users.trophies(handle)]);
        const theirIds = new Set(theirs.titles.filter((t) => t.earned > 0).map((t) => t.titleId));
        const titles = [...mine.titles]
          .filter((t) => t.earned > 0 && theirIds.has(t.titleId))
          .sort((a, b) => (b.lastEarned ?? 0) - (a.lastEarned ?? 0))
          .map((t) => t.titleId);
        if (!alive) return;
        setShared({ status: "ready", titles });
        setTitle((current) => (current && titles.includes(current) ? current : (titles[0] ?? null)));
      })
      .catch((e) => {
        if (!alive) return;
        setShared(isApiError(e) && e.code === "not_found" ? { status: "hidden" } : { status: "failed", message: describeError(e) });
      });
    return () => {
      alive = false;
    };
  }, [handle, attempt]);

  const description = shared.status === "ready" && shared.titles.length > 0 ? `You and ${handle}, in a game you both have.` : `Your trophies next to ${handle}’s.`;
  let body: ReactNode;
  if (shared.status === "loading") {
    body = (
      <div aria-busy role="status" className="grid gap-3">
        <span className="sr-only">Loading</span>
        <span className="h-11 animate-pulse rounded-[14px] bg-white/[0.04]" />
        <span className="h-56 animate-pulse rounded-[16px] bg-white/[0.04]" />
      </div>
    );
  } else if (shared.status === "failed") {
    body = (
      <Failed
        message={shared.message}
        retry={() => {
          setShared({ status: "loading" });
          setAttempt((n) => n + 1);
        }}
      />
    );
  } else if (shared.status === "hidden") {
    body = <Notice>{HIDDEN(handle)}</Notice>;
  } else if (shared.titles.length === 0 || !title) {
    body = <Empty>You and {handle} have no game in common yet. Play a game {handle} has played and it shows up here.</Empty>;
  } else {
    body = (
      <div className="grid gap-5">
        {shared.titles.length > 1 ? (
          <div className="grid max-w-[18rem] gap-2">
            <label htmlFor={select} className="text-[14px] font-medium text-ink-2">
              Game
            </label>
            <select
              id={select}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-[14px] bg-white/[0.04] px-3 text-[16px] text-ink tabular-nums shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ap-focus)] sm:text-[15px]"
            >
              {shared.titles.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-[14px] text-ink-3">
            Game <span className="tabular-nums text-ink-2">{title}</span>
          </p>
        )}
        <CompareResult key={title} handle={handle} titleId={title} />
      </div>
    );
  }

  return (
    <Card id="compare" title="Compare trophies" description={description}>
      {body}
    </Card>
  );
}

/** For a visitor who is not signed in: the cloud compares only for a session. */
export function CompareSignIn({ handle }: { handle: string }) {
  return (
    <Card id="compare" title="Compare trophies" description={`See how your trophies stack up against ${handle}.`}>
      <Link href="/sign-in" className={smallButton}>
        Sign in to compare trophies
      </Link>
    </Card>
  );
}

function CompareResult({ handle, titleId }: { handle: string; titleId: string }) {
  const [result, setResult] = useState<Result>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadApi()
      .then((api) => api.users.compare(handle, titleId))
      .then((data) => alive && setResult({ status: "ready", data }))
      .catch((e) => {
        if (!alive) return;
        setResult(isApiError(e) && e.code === "not_found" ? { status: "hidden" } : { status: "failed", message: describeError(e) });
      });
    return () => {
      alive = false;
    };
  }, [handle, titleId, attempt]);

  if (result.status === "loading") {
    return (
      <div aria-busy role="status">
        <span className="sr-only">Loading the comparison</span>
        <span className="block h-[22.5rem] animate-pulse rounded-[16px] bg-white/[0.04]" />
      </div>
    );
  }
  if (result.status === "failed") {
    return (
      <Failed
        message={result.message}
        retry={() => {
          setResult({ status: "loading" });
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  if (result.status === "hidden") return <Notice>{HIDDEN(handle)}</Notice>;
  return <Summary data={result.data} />;
}

const earnedOf = (s: CompareSide) => s.trophies.length;

function verdict(you: CompareSide, them: CompareSide): string {
  const gap = you.title.points - them.title.points;
  const who = them.account.handle;
  if (you.title.points === 0 && them.title.points === 0) return "Neither of you has earned a trophy in this game.";
  if (gap === 0) return "You are level on points in this game.";
  return gap > 0
    ? `You are ahead by ${num(gap)} ${gap === 1 ? "point" : "points"} in this game.`
    : `${who} is ahead by ${num(-gap)} ${gap === -1 ? "point" : "points"} in this game.`;
}

function Summary({ data }: { data: TrophyCompare }) {
  const { you, them } = data;
  const handle = them.account.handle;
  const mine = new Set(you.trophies.map((t) => t.number));
  const theirs = new Set(them.trophies.map((t) => t.number));
  const both = [...mine].filter((n) => theirs.has(n)).length;
  const onlyYou = mine.size - both;
  const onlyThem = theirs.size - both;

  const rows: { key: string; label: ReactNode; a: number; b: number; format?: (n: number) => string }[] = [
    { key: "earned", label: "Trophies", a: earnedOf(you), b: earnedOf(them) },
    ...GRADES.map((g) => ({
      key: g.key,
      label: (
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
          {g.label}
        </span>
      ),
      a: you.title.counts[g.key],
      b: them.title.counts[g.key],
    })),
    { key: "points", label: "Points in this game", a: you.title.points, b: them.title.points },
    { key: "level", label: "Level overall", a: you.level.level, b: them.level.level },
  ];

  const cell = (mineValue: number, otherValue: number) =>
    mineValue > otherValue ? "font-semibold text-ink" : "font-medium text-ink-2";

  return (
    <div className="grid gap-5">
      <p className="text-[16px] leading-[1.5] font-medium text-pretty">{verdict(you, them)}</p>

      <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
        <table className="w-full table-fixed text-[15px]">
          <caption className="sr-only">
            Trophies in {data.titleId}, you next to {handle}
          </caption>
          <thead>
            <tr className="text-left text-[13px] text-ink-3">
              <th scope="col" className="py-3 font-medium">
                <span className="sr-only">Stat</span>
              </th>
              <th scope="col" className="w-[24%] py-3 text-right font-medium">
                You
              </th>
              <th scope="col" className="w-[24%] py-3 pl-3 text-right font-medium">
                <span className="block truncate" title={handle}>
                  {handle}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="h-12 border-t border-white/[0.06]">
                <th scope="row" className="py-2 pr-3 text-left text-[14px] font-normal text-ink-2">
                  {r.label}
                </th>
                <td className={`py-2 text-right tabular-nums ${cell(r.a, r.b)}`}>{num(r.a)}{r.a > r.b && <span className="sr-only"> (ahead)</span>}</td>
                <td className={`py-2 pl-3 text-right tabular-nums ${cell(r.b, r.a)}`}>{num(r.b)}{r.b > r.a && <span className="sr-only"> (ahead)</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Overlap term="Earned by both" value={both} />
        <Overlap term="Only you" value={onlyYou} />
        <Overlap term={`Only ${handle}`} value={onlyThem} />
      </dl>
    </div>
  );
}

function Overlap({ term, value }: { term: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col-reverse rounded-[16px] bg-white/[0.02] p-3.5 sm:p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <dt className="mt-1.5 text-[13px] leading-[1.35] break-words text-ink-3">
        {term}
      </dt>
      <dd className="text-[28px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{num(value)}</dd>
    </div>
  );
}
