// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type PublicLink, type PublicUser, isApiError } from "@anyplay/api-client";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { FormError } from "../auth/fields";
import { Wordmark } from "../landing/header";
import { LandingProviders } from "../landing/providers";
import { LegalLinks } from "../legal/links";
import { Failed, useAction } from "./pages";
import { useDescribeError } from "@/i18n/errors";
import { loadApi } from "@/lib/api";
import { BRAND, BrandLogo } from "./brand-logos";
import { CompareCard, CompareSignIn } from "./compare";
import { LevelMeter } from "./level";
import { GradeTiles, totalOf } from "./social";
import { Initial } from "./shell";
import { Badge, Card, Empty, Notice, Row, Rows, smallButton, smallPrimary } from "./ui";

/**
 * A player's public page, for anyone, signed in or not. It shows what the API returns and nothing
 * more: the cloud has already applied the player's privacy choices, so a part that is missing is
 * left out without a word. It has its own frame, the landing's wordmark and no account navigation.
 */

type State =
  | { status: "loading" }
  | { status: "ready"; user: PublicUser; signedIn: boolean }
  | { status: "missing" }
  | { status: "failed"; message: string };

/** "45 min" below an hour, "12 h" above, in the visitor's number format. */
function useHours(): (minutes: number) => string {
  const t = useTranslations("account.publicProfile");
  const { number } = useFormatter();
  return (minutes) => (minutes < 60 ? t("minutes", { n: number(minutes) }) : t("hours", { n: number(Math.round(minutes / 60)) }));
}

export function ProfilePage({ handle }: { handle: string }) {
  const t = useTranslations("account.publicProfile");
  const describeError = useDescribeError();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadApi()
      .then(async (api) => {
        const [user, session] = await Promise.all([api.users.get(handle), api.session().catch(() => null)]);
        if (alive) setState({ status: "ready", user, signedIn: Boolean(session?.signedIn) });
      })
      .catch((e) => {
        if (!alive) return;
        setState(isApiError(e) && e.code === "not_found" ? { status: "missing" } : { status: "failed", message: describeError(e) });
      });
    return () => {
      alive = false;
    };
  }, [handle, attempt, describeError]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return (
    <LandingProviders>
      <div className="night relative min-h-dvh overflow-x-clip bg-bg text-ink">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_90_31/0.14),transparent)]"
        />
        <header className="relative mx-auto flex min-h-20 w-full max-w-[1120px] items-center justify-between px-[max(var(--gutter),env(safe-area-inset-left))] pt-[env(safe-area-inset-top)]">
          <Link href="/" aria-label={t("home")} className="-mx-2 inline-flex min-h-11 items-center rounded-full px-2">
            <Wordmark />
          </Link>
          {state.status === "ready" && (
            <Link
              href={state.signedIn ? "/account" : "/sign-in"}
              className="inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center rounded-full px-3 py-1.5 text-end text-[14px] text-ink-2 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
            >
              {state.signedIn ? t("yourAccount") : t("signIn")}
            </Link>
          )}
        </header>
        <main id="main" className="relative mx-auto w-full max-w-[720px] px-[max(var(--gutter),env(safe-area-inset-left))] pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {state.status === "loading" && (
            <div aria-busy role="status" className="grid gap-4">
              <span className="sr-only">{t("loading")}</span>
              <span className="h-32 animate-pulse rounded-[28px] bg-white/[0.04]" />
              <span className="h-36 animate-pulse rounded-[24px] bg-white/[0.04]" />
            </div>
          )}
          {state.status === "failed" && <Failed message={state.message} retry={retry} />}
          {state.status === "missing" && (
            <div className="grid justify-items-start gap-4">
              <h1 className="display text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05]">{t("missingTitle", { handle })}</h1>
              <p className="max-w-[32rem] text-[16px] leading-[1.6] text-ink-2 text-pretty">{t("missingBody")}</p>
              <Link href="/" className={smallButton}>
                {t("goHome")}
              </Link>
            </div>
          )}
          {state.status === "ready" && <Profile user={state.user} />}
        </main>
        <LegalLinks frame="max-w-[720px] px-[max(var(--gutter),env(safe-area-inset-left))]" />
      </div>
    </LandingProviders>
  );
}

function Profile({ user }: { user: PublicUser }) {
  const t = useTranslations("account.publicProfile");
  const hours = useHours();
  const { handle } = user.account;
  const links = user.links ?? [];
  const hasAny = user.about || user.trophies || user.favourites?.length || user.playtime?.length || links.length;
  const trophies = user.trophies;

  return (
    <div className="grid gap-6">
      <section aria-label={t("player")} className="rounded-[28px] bg-[#120f0d] p-7 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] sm:p-9">
        <div className="flex flex-wrap items-center gap-5">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- the cloud serves the picture, there is nothing to optimise
            <img src={`/v1/avatars/${user.avatar}`} alt="" width={88} height={88} className="size-[88px] rounded-full object-cover shadow-[0_0_0_1px_rgb(255_255_255/0.1)]" />
          ) : (
            <Initial handle={handle} size={88} />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="display truncate text-[clamp(1.9rem,1.4rem+1.6vw,2.6rem)] leading-[1.05]">{handle}</h1>
            {user.about && <p className="mt-2 max-w-[34rem] text-[16px] leading-[1.6] text-ink-2 text-pretty">{user.about}</p>}
          </div>
        </div>
        <Relation user={user} />
      </section>

      {trophies && (
        <Card id="trophies" title={t("trophies")} description={totalOf(trophies) === 0 ? undefined : t("trophiesEarned", { count: totalOf(trophies) })}>
          {totalOf(trophies) === 0 ? (
            <Empty>{t("noTrophies", { handle })}</Empty>
          ) : (
            <div className="grid gap-5">
              {user.level && <LevelMeter level={user.level} />}
              <GradeTiles counts={trophies} />
            </div>
          )}
        </Card>
      )}

      {trophies && totalOf(trophies) > 0 && !user.viewer && <CompareSignIn handle={handle} />}
      {trophies && totalOf(trophies) > 0 && user.viewer && user.viewer.relation !== "self" && !user.viewer.blocked && <CompareCard user={user} />}

      {user.favourites && user.favourites.length > 0 && (
        <Card id="favourites" title={t("favourites")} description={t("favouritesNote")}>
          <ul className="flex flex-wrap gap-3">
            {user.favourites.map((id) => (
              <li key={id} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/[0.05] px-4 py-1.5 text-[14px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
                <span className="text-ink-3">{t("game")}</span>
                <span className="tabular-nums">{id}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {links.length > 0 && (
        <Card id="connections" title={t("connections")}>
          <Links links={links} />
        </Card>
      )}

      {user.playtime && user.playtime.length > 0 && (
        <Card id="playtime" title={t("playtime")} description={t("playtimeNote", { count: user.playtime.length, total: hours(user.playtime.reduce((n, p) => n + p.minutes, 0)) })}>
          <Rows>
            {user.playtime.map((p) => (
              <Row key={p.titleId} title={<span className="tabular-nums">{p.titleId}</span>} trailing={<span className="text-[15px] font-medium tabular-nums">{hours(p.minutes)}</span>} />
            ))}
          </Rows>
        </Card>
      )}

      {!hasAny && <Notice>{t("nothing", { handle })}</Notice>}
    </div>
  );
}

/** The player's linked accounts: the name on the other service, and a link where it has a profile page. */
function Links({ links }: { links: PublicLink[] }) {
  const t = useTranslations("account.publicProfile");
  return (
    <Rows>
      {links.map((l) => {
        const brand = BRAND[l.provider];
        return (
          <Row
            key={l.provider}
            icon={<BrandLogo provider={l.provider} className="size-5" />}
            title={brand.name}
            detail={l.displayName ?? undefined}
            trailing={
              l.profileUrl ? (
                <a href={l.profileUrl} target="_blank" rel="noopener noreferrer" className={smallButton}>
                  {t("openProfile")}
                  <span className="sr-only"> {t("openProfileOn", { brand: brand.name })}</span>
                </a>
              ) : undefined
            }
          />
        );
      })}
    </Rows>
  );
}

/** What the visitor can do with this player, from the viewer the API reports. */
function Relation({ user }: { user: PublicUser }) {
  const t = useTranslations("account.publicProfile");
  const { viewer } = user;
  const { handle, id } = user.account;
  const { busy, error, run } = useAction();
  const [done, setDone] = useState<"requested" | "friends" | null>(null);

  let body: ReactNode = null;
  if (!viewer) {
    body = (
      <Link href="/sign-in" className={smallPrimary}>
        {t("signInToAdd", { handle })}
      </Link>
    );
  } else if (viewer.relation === "self") {
    body = (
      <Link href="/account/profile" className={smallButton}>
        {t("editProfile")}
      </Link>
    );
  } else if (viewer.blocked) {
    body = <Badge>{t("blocked")}</Badge>;
  } else if (viewer.relation === "friend" || done === "friends") {
    body = <Badge tone="ok">{t("friends")}</Badge>;
  } else if (viewer.requested === "outgoing" || done === "requested") {
    body = <Badge>{t("requestSent")}</Badge>;
  } else if (viewer.requested === "incoming") {
    body = (
      <button
        type="button"
        className={smallPrimary}
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const api = await loadApi();
            await api.friends.accept(id);
            setDone("friends");
          })
        }
      >
        {busy ? t("accepting") : t("accept")}
      </button>
    );
  } else {
    body = (
      <button
        type="button"
        className={smallPrimary}
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const api = await loadApi();
            setDone(await api.friends.sendRequest(handle));
          })
        }
      >
        {busy ? t("sending") : t("addFriend")}
      </button>
    );
  }

  // The launcher answers anyps5:// links (friend/<handle> opens the request there). Not for yourself,
  // a friend or a player you blocked.
  const inLauncher = viewer?.relation !== "self" && viewer?.relation !== "friend" && !viewer?.blocked;
  return (
    <div className="mt-6 grid justify-items-start gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {body}
        {inLauncher && (
          <a href={`anyps5://v1/friend/${encodeURIComponent(handle)}`} className={smallButton}>
            {t("addInAnyPlay")}
          </a>
        )}
      </div>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
