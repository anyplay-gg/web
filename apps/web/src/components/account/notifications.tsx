// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type PortalApi, type PushDevice, type PushKind, type PushState, isApiError } from "@anyplay/api-client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useDescribeError } from "@/i18n/errors";
import { deviceLabel, keyBytes, pushSupport } from "@/lib/push";
import { FormError } from "../auth/fields";
import { Failed, Loading, useLoad } from "./pages";
import { useAccount } from "./shell";
import { Card, CheckRow, Notice, PageTitle, Switch } from "./ui";

/**
 * Notifications on this device. The browser asks once, the service worker (public/sw.js) shows the
 * push, and the cloud sends it on a friend request, a party invitation or a new message. Each
 * device is its own subscription, so the switch here only ever concerns the browser in the hand.
 */

const ALL: PushKind[] = ["friend_request", "party_invite", "message"];

/** What this browser can do right now, apart from what the person chose. */
type Here =
  | { status: "checking" }
  | { status: "unsupported" }
  | { status: "needs-install" }
  | { status: "blocked" }
  | { status: "off" }
  | { status: "on"; endpoint: string; kinds: PushKind[] };

const storedId = (): number | null => {
  try {
    const v = Number(window.localStorage.getItem("anyplay.push.device"));
    return Number.isInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
};
const storeId = (id: number | null) => {
  try {
    if (id === null) window.localStorage.removeItem("anyplay.push.device");
    else window.localStorage.setItem("anyplay.push.device", String(id));
  } catch {
    // private mode: the device is found by its endpoint on the next visit instead
  }
};

function standalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

function toInput(sub: PushSubscription, kinds?: PushKind[]) {
  const json = sub.toJSON();
  return { endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "", label: deviceLabel(navigator.userAgent), kinds };
}

/** The browser's push service can hang when it cannot be reached; say so instead of waiting for ever. */
function withTimeout<T>(work: Promise<T>, message: string, ms = 20_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    work.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** An API error says what happened in its own words; anything else here is a browser error. */
function useSay(): (e: unknown) => string {
  const t = useTranslations("account.notifications.errors");
  const describeError = useDescribeError();
  return (e) => {
    if (isApiError(e)) return describeError(e);
    // The browser says no without a reason; a private window is the usual one.
    if (e instanceof DOMException && e.name === "NotAllowedError") return t("notAllowed");
    return e instanceof Error ? e.message : describeError(e);
  };
}

export function NotificationsPage() {
  const t = useTranslations("account.notifications");
  const { api } = useAccount();
  const load = useCallback(() => api.push.get(), [api]);
  const { data, error, reload, setData } = useLoad<PushState>(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")} />
      <Device api={api} state={data} onState={setData} />
    </div>
  );
}

function Device({ api, state, onState }: { api: PortalApi; state: PushState; onState: (s: PushState) => void }) {
  const t = useTranslations("account.notifications");
  const say = useSay();
  const [here, setHere] = useState<Here>({ status: "checking" });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const replace = useCallback(
    (device: PushDevice) => onState({ ...state, subscriptions: [...state.subscriptions.filter((d) => d.id !== device.id), device] }),
    [state, onState],
  );

  // What this browser has: is it allowed, and does it hold a subscription the cloud knows?
  useEffect(() => {
    let alive = true;
    (async () => {
      const support = pushSupport({
        userAgent: navigator.userAgent,
        standalone: standalone(),
        serviceWorker: "serviceWorker" in navigator,
        pushManager: "PushManager" in window,
        notification: "Notification" in window,
      });
      if (support !== "ok") return alive && setHere({ status: support === "needs-install" ? "needs-install" : "unsupported" });
      if (Notification.permission === "denied") return alive && setHere({ status: "blocked" });
      const sub = Notification.permission === "granted" ? await currentSubscription() : null;
      if (!sub) return alive && setHere({ status: "off" });
      let known = state.subscriptions.find((d) => d.id === storedId());
      if (!known && state.enabled) {
        // The browser holds a subscription the cloud lost, or this storage was cleared: say it again.
        known = await api.push.subscribe(toInput(sub));
        storeId(known.id);
        if (alive) replace(known);
      }
      if (alive) setHere({ status: "on", endpoint: sub.endpoint, kinds: known?.kinds ?? ALL });
    })().catch(() => alive && setHere({ status: "off" }));
    return () => {
      alive = false;
    };
    // Once per load of the page: the handlers below keep `here` current after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const turnOn = async () => {
    setBusy(true);
    setProblem(null);
    try {
      // The permission prompt must come from the tap itself: iOS and Safari refuse it later.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setHere({ status: permission === "denied" ? "blocked" : "off" });
        return;
      }
      if (!state.publicKey) throw new Error(t("errors.noKey"));
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await withTimeout(reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(state.publicKey) }), t("errors.timeout")));
      try {
        const device = await api.push.subscribe(toInput(sub));
        storeId(device.id);
        replace(device);
        setHere({ status: "on", endpoint: sub.endpoint, kinds: device.kinds });
      } catch (e) {
        // The cloud said no: do not leave a browser subscription that nothing sends to.
        await sub.unsubscribe().catch(() => false);
        throw e;
      }
    } catch (e) {
      setProblem(say(e));
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    if (here.status !== "on") return;
    setBusy(true);
    setProblem(null);
    try {
      await api.push.unsubscribe(here.endpoint);
      const sub = await currentSubscription();
      await sub?.unsubscribe().catch(() => false);
      const id = storedId();
      storeId(null);
      onState({ ...state, subscriptions: state.subscriptions.filter((d) => d.id !== id) });
      setHere({ status: "off" });
    } catch (e) {
      setProblem(say(e));
    } finally {
      setBusy(false);
    }
  };

  const setKinds = async (kinds: PushKind[]) => {
    if (here.status !== "on") return;
    const before = here;
    setHere({ ...here, kinds });
    setProblem(null);
    try {
      const sub = await currentSubscription();
      if (!sub) throw new Error(t("errors.lostSubscription"));
      replace(await api.push.subscribe(toInput(sub, kinds)));
    } catch (e) {
      setHere(before);
      setProblem(say(e));
    }
  };

  const others = state.subscriptions.length - (here.status === "on" ? 1 : 0);

  return (
    <div className="grid gap-6">
      <Card title={t("device.title")} description={t("device.description")}>
        {!state.enabled ? (
          <Notice>{t("device.notEnabled")}</Notice>
        ) : here.status === "checking" ? (
          <p role="status" className="text-[14px] text-ink-3">
            {t("device.checking")}
          </p>
        ) : here.status === "unsupported" ? (
          <Notice>{t("device.unsupported")}</Notice>
        ) : here.status === "needs-install" ? (
          <Notice>{t("device.needsInstall")}</Notice>
        ) : here.status === "blocked" ? (
          <Notice tone="warn">{t("device.blocked")}</Notice>
        ) : (
          <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <Switch label={t("device.switch")} checked={here.status === "on"} disabled={busy} onChange={(on) => void (on ? turnOn() : turnOff())} />
          </div>
        )}
        {problem && (
          <div className="mt-4">
            <FormError>{problem}</FormError>
          </div>
        )}
        {here.status === "on" && others > 0 && (
          <p className="mt-4 text-[13px] text-ink-3">
            {t("device.others", { count: others })}
          </p>
        )}
      </Card>

      {here.status === "on" && (
        <Card title={t("kinds.title")} description={t("kinds.description")}>
          <ul className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            {ALL.map((kind) => (
              <li key={kind}>
                <CheckRow
                  label={t(`kinds.${kind}.label`)}
                  detail={t(`kinds.${kind}.detail`)}
                  checked={here.kinds.includes(kind)}
                  onChange={(on) => void setKinds(ALL.filter((x) => (x === kind ? on : here.kinds.includes(x))))}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
