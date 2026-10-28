// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type CompareSide, type PublicUser, type TrophyCompare, isApiError } from "@anyplay/api-client";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Failed } from "./pages";
import { GRADES } from "./social";
import { Card, Empty, Notice, smallButton } from "./ui";
import { useDescribeError } from "@/i18n/errors";
import { loadApi } from "@/lib/api";

/**
 * Your trophies next to another player's in one game they both have. The cloud holds trophy numbers,
 * grades and times, no names or art, so this is a summary: the count per grade, points, who is
 * ahead and how many trophies only one of you has. It never lists the numbers themselves, which
 * would be a column of digits that says nothing without the names.
 */

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

/** The compare card of a profile; the page shows it only when the player's trophies are visible. */
export function CompareCard({ user }: { user: PublicUser }) {
  const t = useTranslations("account.compare");
  const describeError = useDescribeError();
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
  }, [handle, attempt, describeError]);

  const description = shared.status === "ready" && shared.titles.length > 0 ? t("descriptionShared", { handle }) : t("description", { handle });
  let body: ReactNode;
  if (shared.status === "loading") {
    body = (
      <div aria-busy role="status" className="grid gap-3">
        <span className="sr-only">{t("loading")}</span>
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
    body = <Notice>{t("hidden", { handle })}</Notice>;
  } else if (shared.titles.length === 0 || !title) {
    body = <Empty>{t("empty", { handle })}</Empty>;
  } else {
    body = (
      <div className="grid gap-5">
        {shared.titles.length > 1 ? (
          <div className="grid max-w-[18rem] gap-2">
            <label htmlFor={select} className="text-[14px] font-medium text-ink-2">
              {t("game")}
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
            {t.rich("gameNamed", { title, id: (chunks) => <span className="tabular-nums text-ink-2">{chunks}</span> })}
          </p>
        )}
        <CompareResult key={title} handle={handle} titleId={title} />
      </div>
    );
  }

  return (
    <Card id="compare" title={t("title")} description={description}>
      {body}
    </Card>
  );
}

/** For a visitor who is not signed in: the cloud compares only for a session. */
export function CompareSignIn({ handle }: { handle: string }) {
  const t = useTranslations("account.compare");
  return (
    <Card id="compare" title={t("title")} description={t("signInDescription", { handle })}>
      <Link href="/sign-in" className={smallButton}>
        {t("signIn")}
      </Link>
    </Card>
  );
}

function CompareResult({ handle, titleId }: { handle: string; titleId: string }) {
  const t = useTranslations("account.compare");
  const describeError = useDescribeError();
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
  }, [handle, titleId, attempt, describeError]);

  if (result.status === "loading") {
    return (
      <div aria-busy role="status">
        <span className="sr-only">{t("loadingComparison")}</span>
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
  if (result.status === "hidden") return <Notice>{t("hidden", { handle })}</Notice>;
  return <Summary data={result.data} />;
}

const earnedOf = (s: CompareSide) => s.trophies.length;

function verdict(t: ReturnType<typeof useTranslations>, you: CompareSide, them: CompareSide): string {
  const gap = you.title.points - them.title.points;
  const who = them.account.handle;
  if (you.title.points === 0 && them.title.points === 0) return t("verdictNone");
  if (gap === 0) return t("verdictLevel");
  return gap > 0 ? t("verdictAhead", { count: gap }) : t("verdictBehind", { handle: who, count: -gap });
}

function Summary({ data }: { data: TrophyCompare }) {
  const t = useTranslations("account.compare");
  const { number } = useFormatter();
  const num = (n: number) => number(n);
  const { you, them } = data;
  const handle = them.account.handle;
  const mine = new Set(you.trophies.map((t) => t.number));
  const theirs = new Set(them.trophies.map((t) => t.number));
  const both = [...mine].filter((n) => theirs.has(n)).length;
  const onlyYou = mine.size - both;
  const onlyThem = theirs.size - both;

  const rows: { key: string; label: ReactNode; a: number; b: number; format?: (n: number) => string }[] = [
    { key: "earned", label: t("rowTrophies"), a: earnedOf(you), b: earnedOf(them) },
    ...GRADES.map((g) => ({
      key: g.key,
      label: (
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
          {t(`grade.${g.key}`)}
        </span>
      ),
      a: you.title.counts[g.key],
      b: them.title.counts[g.key],
    })),
    { key: "points", label: t("rowPoints"), a: you.title.points, b: them.title.points },
    { key: "level", label: t("rowLevel"), a: you.level.level, b: them.level.level },
  ];

  const cell = (mineValue: number, otherValue: number) =>
    mineValue > otherValue ? "font-semibold text-ink" : "font-medium text-ink-2";

  return (
    <div className="grid gap-5">
      <p className="text-[16px] leading-[1.5] font-medium text-pretty">{verdict(t, you, them)}</p>

      <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
        <table className="w-full table-fixed text-[15px]">
          <caption className="sr-only">
            {t("caption", { titleId: data.titleId, handle })}
          </caption>
          <thead>
            <tr className="text-left text-[13px] text-ink-3">
              <th scope="col" className="py-3 font-medium">
                <span className="sr-only">{t("stat")}</span>
              </th>
              <th scope="col" className="w-[24%] py-3 text-right font-medium">
                {t("you")}
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
              <tr key={r.key} className="min-h-12 border-t border-white/[0.06]">
                <th scope="row" className="py-2 pr-3 text-left text-[14px] font-normal text-ink-2">
                  {r.label}
                </th>
                <td className={`py-2 text-right tabular-nums ${cell(r.a, r.b)}`}>{num(r.a)}{r.a > r.b && <span className="sr-only"> {t("ahead")}</span>}</td>
                <td className={`py-2 pl-3 text-right tabular-nums ${cell(r.b, r.a)}`}>{num(r.b)}{r.b > r.a && <span className="sr-only"> {t("ahead")}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-3">
        <Overlap term={t("both")} value={both} />
        <Overlap term={t("onlyYou")} value={onlyYou} />
        <Overlap term={t("onlyThem", { handle })} value={onlyThem} />
      </dl>
    </div>
  );
}

function Overlap({ term, value }: { term: string; value: number }) {
  const { number } = useFormatter();
  return (
    <div className="flex min-w-0 flex-col-reverse rounded-[16px] bg-white/[0.02] p-3.5 sm:p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <dt className="mt-1.5 text-[13px] leading-[1.35] break-words text-ink-3">
        {term}
      </dt>
      <dd className="text-[28px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{number(value)}</dd>
    </div>
  );
}
