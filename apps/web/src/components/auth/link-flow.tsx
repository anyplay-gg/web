// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type PortalApi, isApiError } from "@anyplay/api-client";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDescribeError } from "@/i18n/errors";
import { loadApi } from "@/lib/api";
import { BannedStep, Loading, Step } from "./auth-flow";
import { FormError, primaryButton } from "./fields";

/**
 * The page behind the launcher's account button. Opening the address only asks (a preview or a
 * link scanner may fetch it, and must not sign anybody in); the button uses the one-time code up
 * and signs this browser in as the account that asked. The cloud decides everything: whose
 * account it is, whether the link still counts, and whether the account is banned.
 */

type State =
  | { at: "loading" }
  | { at: "ask"; api: PortalApi; handle: string }
  | { at: "expired" }
  | { at: "banned"; api: PortalApi }
  | { at: "failed"; message: string };

export function LinkFlow({ code }: { code: string }) {
  const [state, setState] = useState<State>({ at: "loading" });
  const t = useTranslations("auth");
  const describeError = useDescribeError();

  useEffect(() => {
    let alive = true;
    const show = (next: State) => alive && setState(next);
    if (!code) {
      show({ at: "expired" });
      return;
    }
    loadApi()
      .then(async (api) => {
        try {
          const { handle } = await api.link.peek(code);
          show({ at: "ask", api, handle });
        } catch (e) {
          if (isApiError(e) && e.code === "not_found") show({ at: "expired" });
          else throw e;
        }
      })
      .catch((e) => show({ at: "failed", message: describeError(e) }));
    return () => {
      alive = false;
    };
  }, [code, describeError]);

  switch (state.at) {
    case "loading":
      return <Loading />;
    case "ask":
      return <Ask api={state.api} code={code} handle={state.handle} onState={setState} />;
    case "expired":
      return (
        <Step title={t("link.expiredTitle")} lead={t("link.expiredLead")}>
          <p className="text-[14px] text-ink-3">{t("link.close")}</p>
        </Step>
      );
    case "banned":
      return <BannedStep api={state.api} />;
    case "failed":
      return (
        <Step title={t("step.unreachable")} lead={state.message}>
          <button type="button" className={primaryButton} onClick={() => window.location.reload()}>
            {t("step.tryAgain")}
          </button>
        </Step>
      );
  }
}

function Ask({ api, code, handle, onState }: { api: PortalApi; code: string; handle: string; onState: (s: State) => void }) {
  const t = useTranslations("auth.link");
  const describeError = useDescribeError();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.link.open(code);
      router.push("/account");
    } catch (e) {
      if (isApiError(e) && e.code === "not_found") onState({ at: "expired" });
      else if (isApiError(e) && e.code === "banned") onState({ at: "banned", api });
      else {
        setError(describeError(e));
        setBusy(false);
      }
    }
  };

  return (
    <Step
      title={t("title")}
      lead={t.rich("lead", { handle, b: (chunks) => <strong className="font-semibold text-ink">{chunks}</strong> })}
    >
      <div className="grid gap-4">
        <button type="button" className={primaryButton} disabled={busy} onClick={open}>
          {busy ? (
            t("opening")
          ) : (
            <>
              {t("open")} <ArrowRightIcon aria-hidden className="size-4 shrink-0" />
            </>
          )}
        </button>
        {error && <FormError>{error}</FormError>}
      </div>
      <p className="mt-6 text-[14px] text-ink-3">{t("notYou")}</p>
    </Step>
  );
}
