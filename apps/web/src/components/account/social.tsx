// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type Account, type GradeCounts, isApiError } from "@anyplay/api-client";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type FormEvent, type ReactNode, useCallback, useState } from "react";
import { isTranslated, useDescribeError } from "@/i18n/errors";
import { FormError, TextField } from "../auth/fields";
import { LevelMeter } from "./level";
import { Failed, Loading, useAction, useLoad } from "./pages";
import { Initial, useAccount } from "./shell";
import { Card, Confirm, Empty, Notice, PageTitle, Row, Rows, smallButton, smallPrimary, useAgo } from "./ui";

/**
 * The social pages of the account: friends with their requests and blocks, and the trophy counts.
 * The cloud holds title ids and counts only, so a game is shown by what the API gives and nothing
 * else: no cover, no trophy names or texts.
 */

/** `label` is the English name, kept for callers that have not moved to the translated one (`useGradeLabel`). */
export const GRADES = [
  { key: "platinum", label: "Platinum", color: "#bdd6f7" },
  { key: "gold", label: "Gold", color: "#f7c757" },
  { key: "silver", label: "Silver", color: "#ccd1db" },
  { key: "bronze", label: "Bronze", color: "#d48c5c" },
] as const satisfies readonly { key: keyof GradeCounts; label: string; color: string }[];

/** The name of a grade in the visitor's language. */
export function useGradeLabel(): (key: keyof GradeCounts) => string {
  const t = useTranslations("account.trophies.grades");
  return (key) => t(key);
}

export const totalOf = (c: GradeCounts) => c.platinum + c.gold + c.silver + c.bronze;

/** The four grades as tiles: the colour of the trophy, the count, the grade in words. */
export function GradeTiles({ counts }: { counts: GradeCounts }) {
  const label = useGradeLabel();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GRADES.map((g) => (
        <li key={g.key} className="rounded-[16px] bg-white/[0.02] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <TrophyIcon aria-hidden className="size-6" style={{ color: g.color }} strokeWidth={1.6} />
          <span className="mt-3 block text-[28px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{counts[g.key]}</span>
          <span className="mt-1.5 block text-[13px] text-ink-3">{label(g.key)}</span>
        </li>
      ))}
    </ul>
  );
}

/** The four counts in one line, each with the colour of its grade and its name for a screen reader. */
export function GradeInline({ counts }: { counts: GradeCounts }) {
  const label = useGradeLabel();
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {GRADES.map((g) => (
        <li key={g.key} className="flex items-center gap-1.5 text-[14px] font-medium tabular-nums">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: g.color }} />
          {counts[g.key]}
          <span className="sr-only">{label(g.key)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────────── Friends ───────────────────────────── */

function Person({ account, detail, online, trailing }: { account: Account; detail?: ReactNode; online?: boolean; trailing?: ReactNode }) {
  return (
    <li className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-3 py-3">
      <span className="relative shrink-0">
        <Initial handle={account.handle} size={40} />
        {online && <span aria-hidden className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-[#3fd38a] ring-2 ring-[#181716]" />}
      </span>
      <span className="min-w-[10rem] flex-1">
        <Link href={`/u/${encodeURIComponent(account.handle)}`} className="-my-3 block truncate rounded-[6px] py-3 text-[15px] font-medium [@media(hover:hover)]:hover:underline">
          {account.handle}
        </Link>
        {detail && <span className="mt-0.5 block text-[13px] text-ink-3 break-words">{detail}</span>}
      </span>
      {trailing && <span className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3">{trailing}</span>}
    </li>
  );
}

const sub = "mb-3 text-[13px] font-medium text-ink-3";

type Pending = { kind: "remove" | "block"; account: Account };

export function FriendsPage() {
  const t = useTranslations("account.friends");
  const ago = useAgo();
  const { api } = useAccount();
  const load = useCallback(() => api.friends.lists(), [api]);
  const { data, error, reload } = useLoad(load);
  const act = useAction();
  const [pending, setPending] = useState<Pending | null>(null);

  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;

  const change = (action: () => Promise<void>) =>
    act.run(async () => {
      await action();
      await reload();
    });

  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")} />
      <div className="grid gap-6">
        {act.error && <FormError>{act.error}</FormError>}

        <AddFriend onSent={reload} />

        <Card title={t("requests.title")} description={t("requests.description")}>
          {data.incoming.length === 0 && data.outgoing.length === 0 ? (
            <Empty>{t("requests.empty")}</Empty>
          ) : (
            <div className="grid gap-6">
              {data.incoming.length > 0 && (
                <div>
                  <h3 className={sub}>{t("requests.received")}</h3>
                  <Rows>
                    {data.incoming.map((r) => (
                      <Person
                        key={r.account.id}
                        account={r.account}
                        detail={t("requests.receivedAgo", { when: ago(r.since) })}
                        trailing={
                          <>
                            <button type="button" className={smallButton} disabled={act.busy} onClick={() => void change(() => api.friends.dropRequest(r.account.id))}>
                              {t("requests.decline")}
                            </button>
                            <button type="button" className={smallPrimary} disabled={act.busy} onClick={() => void change(() => api.friends.accept(r.account.id))}>
                              {t("requests.accept")}
                            </button>
                          </>
                        }
                      />
                    ))}
                  </Rows>
                </div>
              )}
              {data.outgoing.length > 0 && (
                <div>
                  <h3 className={sub}>{t("requests.sent")}</h3>
                  <Rows>
                    {data.outgoing.map((r) => (
                      <Person
                        key={r.account.id}
                        account={r.account}
                        detail={t("requests.sentAgo", { when: ago(r.since) })}
                        trailing={
                          <button type="button" className={smallButton} disabled={act.busy} onClick={() => void change(() => api.friends.dropRequest(r.account.id))}>
                            {t("requests.withdraw")}
                          </button>
                        }
                      />
                    ))}
                  </Rows>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title={t("list.title")} description={t("list.description")}>
          {data.friends.length === 0 ? (
            <Empty>{t("list.empty")}</Empty>
          ) : (
            <Rows>
              {data.friends.map((f) => (
                <Person
                  key={f.account.id}
                  account={f.account}
                  online={f.presence.online}
                  detail={f.presence.online ? (f.presence.activity ? t("list.playing", { title: f.presence.activity.title }) : t("list.online")) : t("list.offline")}
                  trailing={
                    <>
                      <button type="button" className={smallButton} onClick={() => setPending({ kind: "block", account: f.account })}>
                        {t("list.block")}
                      </button>
                      <button type="button" className={smallButton} onClick={() => setPending({ kind: "remove", account: f.account })}>
                        {t("list.remove")}
                      </button>
                    </>
                  }
                />
              ))}
            </Rows>
          )}
        </Card>

        <Card title={t("blocked.title")} description={t("blocked.description")}>
          {data.blocked.length === 0 ? (
            <Empty>{t("blocked.empty")}</Empty>
          ) : (
            <Rows>
              {data.blocked.map((a) => (
                <Person
                  key={a.id}
                  account={a}
                  trailing={
                    <button type="button" className={smallButton} disabled={act.busy} onClick={() => void change(() => api.friends.unblock(a.id))}>
                      {t("blocked.unblock")}
                    </button>
                  }
                />
              ))}
            </Rows>
          )}
        </Card>
      </div>

      <Confirm
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.kind === "block" ? t("confirm.blockTitle", { handle: pending.account.handle }) : t("confirm.removeTitle", { handle: pending?.account.handle ?? "" })}
        description={
          pending?.kind === "block" ? t("confirm.blockText") : t("confirm.removeText")
        }
        confirmLabel={pending?.kind === "block" ? t("confirm.blockLabel") : t("confirm.removeLabel")}
        danger={pending?.kind === "block"}
        onConfirm={async () => {
          if (!pending) return;
          if (pending.kind === "block") await api.friends.block(pending.account.id);
          else await api.friends.remove(pending.account.id);
          await reload();
        }}
      />
    </div>
  );
}

function AddFriend({ onSent }: { onSent: () => Promise<void> }) {
  const t = useTranslations("account.friends.add");
  const describeError = useDescribeError();
  const { api } = useAccount();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const h = handle.trim().replace(/^@/, "");
    setDone(null);
    if (!h) {
      setError(t("enterHandle"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.friends.sendRequest(h);
      setDone(result === "friends" ? t("nowFriends", { handle: h }) : t("sent", { handle: h }));
      setHandle("");
      await onSent();
    } catch (err) {
      setError((isApiError(err) && !isTranslated(err) && err.fields.handle) || describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t("title")} description={t("description")}>
      <form onSubmit={submit} noValidate className="grid max-w-[28rem] gap-4">
        <TextField
          label={t("handle")}
          name="handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          error={error}
          hint={t("hint")}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
        />
        <div>
          <button type="submit" className={smallPrimary} disabled={busy}>
            {busy ? t("sending") : t("send")}
          </button>
        </div>
        {done && <Notice tone="ok">{done}</Notice>}
      </form>
    </Card>
  );
}

/* ───────────────────────────── Trophies ───────────────────────────── */

export function TrophiesPage() {
  const t = useTranslations("account.trophies");
  const ago = useAgo();
  const { api } = useAccount();
  const load = useCallback(() => api.trophies.mine(), [api]);
  const { data, error, reload } = useLoad(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;

  const total = totalOf(data.counts);
  const titles = [...data.titles].sort((a, b) => (b.lastEarned ?? 0) - (a.lastEarned ?? 0));

  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")} />
      <div className="grid gap-6">
        <Card title={t("totals.title")} description={total === 0 ? undefined : t("totals.description", { total, games: titles.length })}>
          {total === 0 ? <Empty>{t("totals.empty")}</Empty> : (
            <div className="grid gap-5">
              {data.level && <LevelMeter level={data.level} />}
              <GradeTiles counts={data.counts} />
            </div>
          )}
        </Card>

        {titles.length > 0 && (
          <Card title={t("byGame.title")} description={t("byGame.description")}>
            <Rows>
              {titles.map((g) => (
                <Row
                  key={g.titleId}
                  title={<span className="tabular-nums">{g.titleId}</span>}
                  detail={t("byGame.detail", { earned: g.earned, when: ago(g.lastEarned) })}
                  trailing={<GradeInline counts={g.counts} />}
                />
              ))}
            </Rows>
          </Card>
        )}
      </div>
    </div>
  );
}
