// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type JoinView, isApiError } from "@anyplay/api-client";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDescribeError } from "@/i18n/errors";
import { LINKS } from "@/components/landing/links";
import { loadApi } from "@/lib/api";
import { joinPath, launcherJoinUrl, normalizeJoinCode, withNext } from "@/lib/join";
import { Loading, Step } from "./auth-flow";
import { primaryButton, secondaryButton } from "./fields";

/**
 * The page behind the link on a player's Discord profile (ADR 0022 in anyplaynet/network). It
 * only shows: who invites, to what, and how many play. It starts nothing and joins nobody; the
 * launcher asks the person itself. A visitor with no session is sent through sign-in or sign-up and
 * comes back here. The code is checked here first, so a typo never becomes a request, and the
 * cloud answers one `not_found` for every invitation that is gone.
 */

type State =
  | { at: "loading" }
  | { at: "invite"; view: JoinView; signedIn: boolean }
  | { at: "expired" }
  | { at: "failed"; message: string };

export function JoinFlow({ code: raw }: { code: string }) {
  const code = normalizeJoinCode(raw);
  const [state, setState] = useState<State>(code ? { at: "loading" } : { at: "expired" });
  const [attempt, setAttempt] = useState(0);
  const t = useTranslations("auth");
  const describeError = useDescribeError();

  useEffect(() => {
    if (!code) return;
    let alive = true;
    const show = (next: State) => alive && setState(next);
    loadApi()
      .then(async (api) => {
        try {
          // The invitation is public; the session only decides which buttons follow.
          const [view, session] = await Promise.all([api.join.get(code), api.session()]);
          show({ at: "invite", view, signedIn: session.signedIn });
        } catch (e) {
          if (isApiError(e) && e.code === "not_found") show({ at: "expired" });
          else throw e;
        }
      })
      .catch((e) => show({ at: "failed", message: describeError(e) }));
    return () => {
      alive = false;
    };
  }, [code, attempt, describeError]);

  switch (state.at) {
    case "loading":
      return <Loading />;
    case "invite":
      return code && <Invite code={code} view={state.view} signedIn={state.signedIn} />;
    case "expired":
      return (
        <Step title={t("join.expiredTitle")} lead={t("join.expiredLead")}>
          <div className="grid gap-3">
            <a href={LINKS.download} className={primaryButton}>
              {t("step.getApp")}
            </a>
            <Link href="/" className={secondaryButton}>
              {t("step.backToStart")}
            </Link>
          </div>
        </Step>
      );
    case "failed":
      return (
        <Step title={t("step.unreachable")} lead={state.message}>
          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              setState({ at: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            {t("step.tryAgain")}
          </button>
        </Step>
      );
  }
}

function Invite({ code, view, signedIn }: { code: string; view: JoinView; signedIn: boolean }) {
  const t = useTranslations("auth");
  const party = view.kind === "party";
  return (
    <Step
      title={t("join.title", { handle: view.handle })}
      lead={t(signedIn ? "join.leadSignedIn" : "join.leadSignedOut")}
    >
      <dl className="mb-8 grid gap-4 rounded-[18px] bg-white/[0.04] p-5 text-[15px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <div>
          <dt className="text-[13px] text-ink-3">{t(party ? "join.party" : "join.game")}</dt>
          <dd className="mt-1 text-[18px] leading-[1.3] font-semibold [overflow-wrap:anywhere] text-ink">
            {party ? t("join.partyName") : (view.title ?? t("join.gameFallback"))}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-ink-3">{t("join.joined")}</dt>
          <dd className="mt-1 text-ink tabular-nums">
            {t("join.players", { members: view.members, max: view.maxMembers })}
          </dd>
        </div>
      </dl>
      {signedIn ? (
        <div className="grid gap-3">
          <a href={launcherJoinUrl(code)} className={primaryButton}>
            {t("join.open")} <ArrowRightIcon aria-hidden className="size-4 shrink-0" />
          </a>
          <a href={LINKS.download} className={secondaryButton}>
            {t("step.getApp")}
          </a>
        </div>
      ) : (
        <div className="grid gap-3">
          <Link href={withNext("/create", joinPath(code))} className={primaryButton}>
            {t("step.createAccount")}
          </Link>
          <Link href={withNext("/sign-in", joinPath(code))} className={secondaryButton}>
            {t("step.signIn")}
          </Link>
        </div>
      )}
      {signedIn && <p className="mt-6 text-[14px] text-ink-3">{t("join.noApp")}</p>}
    </Step>
  );
}
