// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type Account, type GradeCounts, describeError, isApiError } from "@anyplay/api-client";
import { TrophyIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { type FormEvent, type ReactNode, useCallback, useState } from "react";
import { FormError, TextField } from "../auth/fields";
import { LevelMeter } from "./level";
import { Failed, Loading, useAction, useLoad } from "./pages";
import { Initial, useAccount } from "./shell";
import { Card, Confirm, Empty, Notice, PageTitle, Row, Rows, ago, smallButton, smallPrimary } from "./ui";

/**
 * The social pages of the account: friends with their requests and blocks, and the trophy counts.
 * The cloud holds title ids and counts only, so a game is shown by what the API gives and nothing
 * else: no cover, no trophy names or texts.
 */

export const GRADES = [
  { key: "platinum", label: "Platinum", color: "#bdd6f7" },
  { key: "gold", label: "Gold", color: "#f7c757" },
  { key: "silver", label: "Silver", color: "#ccd1db" },
  { key: "bronze", label: "Bronze", color: "#d48c5c" },
] as const satisfies readonly { key: keyof GradeCounts; label: string; color: string }[];

export const totalOf = (c: GradeCounts) => c.platinum + c.gold + c.silver + c.bronze;

/** The four grades as tiles: the colour of the trophy, the count, the grade in words. */
export function GradeTiles({ counts }: { counts: GradeCounts }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GRADES.map((g) => (
        <li key={g.key} className="rounded-[16px] bg-white/[0.02] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <TrophyIcon aria-hidden className="size-6" style={{ color: g.color }} strokeWidth={1.6} />
          <span className="mt-3 block text-[28px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{counts[g.key]}</span>
          <span className="mt-1.5 block text-[13px] text-ink-3">{g.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** The four counts in one line, each with the colour of its grade and its name for a screen reader. */
export function GradeInline({ counts }: { counts: GradeCounts }) {
  return (
    <ul className="flex items-center gap-4">
      {GRADES.map((g) => (
        <li key={g.key} className="flex items-center gap-1.5 text-[14px] font-medium tabular-nums">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: g.color }} />
          {counts[g.key]}
          <span className="sr-only">{g.label}</span>
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
        {detail && <span className="mt-0.5 block truncate text-[13px] text-ink-3">{detail}</span>}
      </span>
      {trailing && <span className="ml-auto flex shrink-0 items-center gap-3">{trailing}</span>}
    </li>
  );
}

const sub = "mb-3 text-[13px] font-medium text-ink-3";

type Pending = { kind: "remove" | "block"; account: Account };

export function FriendsPage() {
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
      <PageTitle title="Friends" lead="Add the people you play with, answer requests and decide who stays out." />
      <div className="grid gap-6">
        {act.error && <FormError>{act.error}</FormError>}

        <AddFriend onSent={reload} />

        <Card title="Requests" description="Players who want to be your friend, and the requests you sent.">
          {data.incoming.length === 0 && data.outgoing.length === 0 ? (
            <Empty>No open requests. When someone adds you, the request shows up here.</Empty>
          ) : (
            <div className="grid gap-6">
              {data.incoming.length > 0 && (
                <div>
                  <h3 className={sub}>Received</h3>
                  <Rows>
                    {data.incoming.map((r) => (
                      <Person
                        key={r.account.id}
                        account={r.account}
                        detail={`Received ${ago(r.since)}`}
                        trailing={
                          <>
                            <button type="button" className={smallButton} disabled={act.busy} onClick={() => void change(() => api.friends.dropRequest(r.account.id))}>
                              Decline
                            </button>
                            <button type="button" className={smallPrimary} disabled={act.busy} onClick={() => void change(() => api.friends.accept(r.account.id))}>
                              Accept
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
                  <h3 className={sub}>Sent</h3>
                  <Rows>
                    {data.outgoing.map((r) => (
                      <Person
                        key={r.account.id}
                        account={r.account}
                        detail={`Sent ${ago(r.since)}`}
                        trailing={
                          <button type="button" className={smallButton} disabled={act.busy} onClick={() => void change(() => api.friends.dropRequest(r.account.id))}>
                            Withdraw
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

        <Card title="Your friends" description="See who is online and what they are playing.">
          {data.friends.length === 0 ? (
            <Empty>No friends yet. Add someone by their handle above; they show up here once they accept.</Empty>
          ) : (
            <Rows>
              {data.friends.map((f) => (
                <Person
                  key={f.account.id}
                  account={f.account}
                  online={f.presence.online}
                  detail={f.presence.online ? (f.presence.activity ? `Playing ${f.presence.activity.title}` : "Online") : "Offline"}
                  trailing={
                    <>
                      <button type="button" className={smallButton} onClick={() => setPending({ kind: "block", account: f.account })}>
                        Block
                      </button>
                      <button type="button" className={smallButton} onClick={() => setPending({ kind: "remove", account: f.account })}>
                        Remove
                      </button>
                    </>
                  }
                />
              ))}
            </Rows>
          )}
        </Card>

        <Card title="Blocked" description="Blocked players are removed from your friends and requests.">
          {data.blocked.length === 0 ? (
            <Empty>You have not blocked anyone. Block a player from your friends list when you need to.</Empty>
          ) : (
            <Rows>
              {data.blocked.map((a) => (
                <Person
                  key={a.id}
                  account={a}
                  trailing={
                    <button type="button" className={smallButton} disabled={act.busy} onClick={() => void change(() => api.friends.unblock(a.id))}>
                      Unblock
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
        title={pending?.kind === "block" ? `Block @${pending.account.handle}?` : `Remove @${pending?.account.handle ?? ""} from your friends?`}
        description={
          pending?.kind === "block"
            ? "You are no longer friends and any open request is dropped. You can unblock them any time."
            : "You stop seeing when each other is online. You can send a new request later."
        }
        confirmLabel={pending?.kind === "block" ? "Block player" : "Remove friend"}
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
      setError("Enter the handle of the player you want to add.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.friends.sendRequest(h);
      setDone(result === "friends" ? `You and @${h} are now friends.` : `Request sent to @${h}. You are friends once they accept.`);
      setHandle("");
      await onSent();
    } catch (err) {
      setError((isApiError(err) && err.fields.handle) || describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Add a friend" description="Enter a player’s handle to send them a request.">
      <form onSubmit={submit} noValidate className="grid max-w-[28rem] gap-4">
        <TextField
          label="Handle"
          name="handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          error={error}
          hint="Their handle, with or without the @."
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
        />
        <div>
          <button type="submit" className={smallPrimary} disabled={busy}>
            {busy ? "Sending…" : "Send request"}
          </button>
        </div>
        {done && <Notice tone="ok">{done}</Notice>}
      </form>
    </Card>
  );
}

/* ───────────────────────────── Trophies ───────────────────────────── */

export function TrophiesPage() {
  const { api } = useAccount();
  const load = useCallback(() => api.trophies.mine(), [api]);
  const { data, error, reload } = useLoad(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;

  const total = totalOf(data.counts);
  const titles = [...data.titles].sort((a, b) => (b.lastEarned ?? 0) - (a.lastEarned ?? 0));

  return (
    <div>
      <PageTitle title="Trophies" lead="What you earned in your games. AnyPlay keeps counts per game and grade, never trophy names or art." />
      <div className="grid gap-6">
        <Card title="Totals" description={total === 0 ? undefined : `${total} earned across ${titles.length} ${titles.length === 1 ? "game" : "games"}.`}>
          {total === 0 ? <Empty>No trophies yet. Play a game through AnyPlay and the ones you earn are counted here.</Empty> : (
            <div className="grid gap-5">
              {data.level && <LevelMeter level={data.level} />}
              <GradeTiles counts={data.counts} />
            </div>
          )}
        </Card>

        {titles.length > 0 && (
          <Card title="By game" description="Games are listed by title id, the most recent first.">
            <Rows>
              {titles.map((t) => (
                <Row
                  key={t.titleId}
                  title={<span className="tabular-nums">{t.titleId}</span>}
                  detail={`${t.earned} ${t.earned === 1 ? "trophy" : "trophies"} · last earned ${ago(t.lastEarned)}`}
                  trailing={<GradeInline counts={t.counts} />}
                />
              ))}
            </Rows>
          </Card>
        )}
      </div>
    </div>
  );
}
