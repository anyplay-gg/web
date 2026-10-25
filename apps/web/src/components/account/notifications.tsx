// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type PortalApi, type PushDevice, type PushKind, type PushState, describeError, isApiError } from "@anyplay/api-client";
import { useCallback, useEffect, useState } from "react";
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
const KINDS: { kind: PushKind; label: string; detail: string }[] = [
  { kind: "friend_request", label: "Friend requests", detail: "Someone asks to be your friend." },
  { kind: "party_invite", label: "Party invitations", detail: "A friend invites you to a party." },
  { kind: "message", label: "Messages", detail: "A friend writes to you. The message itself stays out of the notification." },
];

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
function withTimeout<T>(work: Promise<T>, ms = 20_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Your browser’s notification service did not answer. Check your connection and try again.")), ms);
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
const say = (e: unknown) => {
  if (isApiError(e)) return describeError(e);
  // The browser says no without a reason; a private window is the usual one.
  if (e instanceof DOMException && e.name === "NotAllowedError") return "This browser did not allow notifications. They don’t work in a private window; otherwise check the site settings.";
  return e instanceof Error ? e.message : describeError(e);
};

export function NotificationsPage() {
  const { api } = useAccount();
  const load = useCallback(() => api.push.get(), [api]);
  const { data, error, reload, setData } = useLoad<PushState>(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title="Notifications" lead="Get a notification on this device when a friend asks to be your friend, invites you to a party or writes to you." />
      <Device api={api} state={data} onState={setData} />
    </div>
  );
}

function Device({ api, state, onState }: { api: PortalApi; state: PushState; onState: (s: PushState) => void }) {
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
      if (!state.publicKey) throw new Error("This cloud has no key to send notifications with.");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await withTimeout(reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(state.publicKey) })));
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
      if (!sub) throw new Error("This browser lost its subscription. Turn notifications off and on again.");
      replace(await api.push.subscribe(toInput(sub, kinds)));
    } catch (e) {
      setHere(before);
      setProblem(say(e));
    }
  };

  const others = state.subscriptions.length - (here.status === "on" ? 1 : 0);

  return (
    <div className="grid gap-6">
      <Card title="This device" description="Each browser or phone is set up on its own. Turn this on where you want to be notified.">
        {!state.enabled ? (
          <Notice>This cloud does not send notifications.</Notice>
        ) : here.status === "checking" ? (
          <p role="status" className="text-[14px] text-ink-3">
            Checking this device…
          </p>
        ) : here.status === "unsupported" ? (
          <Notice>This browser can’t receive notifications. Use a current Chrome, Edge, Firefox or Safari.</Notice>
        ) : here.status === "needs-install" ? (
          <Notice>On iPhone and iPad, notifications need AnyPlay on your Home Screen. Tap Share, choose Add to Home Screen, then open AnyPlay from there.</Notice>
        ) : here.status === "blocked" ? (
          <Notice tone="warn">Notifications are blocked for this site. Allow them in your browser’s site settings, then come back.</Notice>
        ) : (
          <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <Switch label="Notify this device" checked={here.status === "on"} disabled={busy} onChange={(on) => void (on ? turnOn() : turnOff())} />
          </div>
        )}
        {problem && (
          <div className="mt-4">
            <FormError>{problem}</FormError>
          </div>
        )}
        {here.status === "on" && others > 0 && (
          <p className="mt-4 text-[13px] text-ink-3">
            {others === 1 ? "One other device also gets" : `${others} other devices also get`} notifications. Turn them off on that device.
          </p>
        )}
      </Card>

      {here.status === "on" && (
        <Card title="What to notify about" description="For this device only.">
          <ul className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            {KINDS.map((k) => (
              <li key={k.kind}>
                <CheckRow
                  label={k.label}
                  detail={k.detail}
                  checked={here.kinds.includes(k.kind)}
                  onChange={(on) => void setKinds(ALL.filter((x) => (x === k.kind ? on : here.kinds.includes(x))))}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
