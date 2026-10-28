// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type Audience, type PortalApi, isApiError, isStepUp } from "@anyplay/api-client";
import { Dialog } from "@anyplay/ui/dialog";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDescribeError } from "@/i18n/errors";
import { CodeField, FormError, TextField, primaryButton, secondaryButton } from "../auth/fields";

/**
 * The parts every account page is made of, in the landing's night palette: cards with a title and a
 * line on what they hold, rows inside them, small buttons, the who-sees-it choice, a confirmation
 * dialog and the step-up that asks for a recent sign-in before a sensitive change.
 */

export const smallButton =
  "inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 shrink-0 items-center justify-center gap-1.5 py-1.5 text-center rounded-full bg-white/[0.06] px-3.5 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] disabled:opacity-50 [@media(hover:hover)]:hover:bg-white/[0.1]";
export const smallPrimary =
  "inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 shrink-0 items-center justify-center gap-1.5 py-1.5 text-center rounded-full bg-[#f6f5f1] px-4 text-[14px] font-semibold text-[#161513] transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] disabled:opacity-50 [@media(hover:hover)]:hover:bg-white";
export const smallDanger =
  "inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 shrink-0 items-center justify-center gap-1.5 py-1.5 text-center rounded-full bg-[#ff5a3d]/10 px-3.5 text-[14px] font-medium text-[#ffb3a6] shadow-[inset_0_0_0_1px_rgb(255_140_128/0.25)] transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] disabled:opacity-50 [@media(hover:hover)]:hover:bg-[#ff5a3d]/16";

export function PageTitle({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <header className="mb-10">
      <h1 className="display text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05]">{title}</h1>
      {lead && <p className="mt-3 max-w-[36rem] text-[16px] leading-[1.6] text-ink-2 text-pretty">{lead}</p>}
    </header>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="scroll-mt-28 rounded-[24px] bg-[#141312] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),inset_0_1px_0_rgb(255_255_255/0.05)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-5">
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-[17px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-[34rem] text-[14px] leading-[1.55] text-ink-3 text-pretty">{description}</p>}
        </div>
        {action}
      </div>
      {children && <div className="px-6 pb-6">{children}</div>}
    </section>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">{children}</ul>;
}

export function Row({ icon, title, detail, trailing }: { icon?: ReactNode; title: ReactNode; detail?: ReactNode; trailing?: ReactNode }) {
  return (
    <li className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-3 py-3">
      {icon && <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white/[0.05] text-ink-2">{icon}</span>}
      <span className="min-w-[10rem] flex-1">
        <span className="block text-[15px] font-medium break-words">{title}</span>
        {detail && <span className="mt-0.5 block text-[13px] leading-[1.45] text-ink-3 text-pretty">{detail}</span>}
      </span>
      {trailing && <span className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">{trailing}</span>}
    </li>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[16px] bg-white/[0.02] px-4 py-5 text-[14px] text-ink-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">{children}</p>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "ok" }) {
  const tones = {
    neutral: "bg-white/[0.07] text-ink-2",
    brand: "bg-[#ff5a1f]/15 text-[#ffb487]",
    ok: "bg-[#3fd38a]/12 text-[#7fe3b0]",
  } as const;
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "ok" | "warn" }) {
  const tones = {
    info: "bg-white/[0.04] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
    ok: "bg-[#3fd38a]/8 text-[#a8ecc8] shadow-[inset_0_0_0_1px_rgb(63_211_138/0.25)]",
    warn: "bg-[#ff5a1f]/10 text-[#ffc6a8] shadow-[inset_0_0_0_1px_rgb(255_122_61/0.3)]",
  } as const;
  return (
    <p role="status" className={`rounded-[16px] px-4 py-3 text-[14px] leading-[1.5] ${tones[tone]}`}>
      {children}
    </p>
  );
}

const AUDIENCES: Audience[] = ["everyone", "friends", "nobody"];

/** Who sees something: three choices (or the ones in `only`) as one radio group, keyboard by arrows like any radio group. */
export function AudiencePicker({ value, onChange, label, disabled, only, describedBy }: { value: Audience; onChange: (a: Audience) => void; label: string; disabled?: boolean; only?: Audience[]; describedBy?: string }) {
  const t = useTranslations("account.ui.audience");
  return (
    <fieldset disabled={disabled} aria-describedby={describedBy} className="inline-flex flex-wrap rounded-full bg-white/[0.04] p-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      <legend className="sr-only">{label}</legend>
      {AUDIENCES.filter((a) => !only || only.includes(a)).map((a) => (
        <label
          key={a}
          className="relative inline-flex cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-center [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-4 text-[13px] font-medium text-ink-3 transition-colors duration-[var(--duration-quick)] has-[:checked]:bg-white/[0.1] has-[:checked]:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ap-focus)] [@media(hover:hover)]:hover:text-ink"
        >
          <input type="radio" name={label} value={a} checked={value === a} onChange={() => onChange(a)} className="sr-only" />
          {t(a)}
        </label>
      ))}
    </fieldset>
  );
}

const popup =
  "night fixed top-1/2 left-1/2 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-[#151311] p-6 text-ink shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_30px_80px_-20px_rgb(0_0_0/0.8)] transition-[opacity,scale] duration-[200ms] ease-[var(--ease-out)] outline-none data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0";
const backdrop =
  "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-[200ms] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0";

/**
 * Asks before something that cannot be taken back. With `typed`, the button only works once the
 * person typed that word, for the things that end an account.
 */
export function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger = false,
  typed,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  typed?: string;
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations("account.ui");
  const describeError = useDescribeError();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const ready = !typed || text.trim().toLowerCase() === typed.toLowerCase();
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      if (!isStepUp(e) && !isCancelled(e)) setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setText("");
          setError(null);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={backdrop} />
        <Dialog.Popup className={popup}>
          <Dialog.Title className="text-[20px] font-semibold tracking-[-0.01em]">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-[15px] leading-[1.6] text-ink-2">{description}</Dialog.Description>
          {typed && (
            <div className="mt-5">
              <TextField label={t("typeToConfirm", { word: typed })} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck={false} />
            </div>
          )}
          {error && (
            <div className="mt-4">
              <FormError>{error}</FormError>
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close className={`${secondaryButton} sm:w-auto`}>{t("cancel")}</Dialog.Close>
            <button
              type="button"
              disabled={busy || !ready}
              onClick={run}
              className={danger ? `${primaryButton} bg-[#ff6b52] text-[#1a0905] sm:w-auto [@media(hover:hover)]:hover:bg-[#ff8066]` : `${primaryButton} sm:w-auto`}
            >
              {busy ? t("working") : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type StepUp = (action: () => Promise<void>) => Promise<void>;

/** What a step-up rejects with when the person closes it: nothing went wrong, so nothing to show. */
class Cancelled extends Error {}
export const isCancelled = (e: unknown) => e instanceof Cancelled;
const StepUpContext = createContext<StepUp>(async (action) => action());

/**
 * Runs an action; when the cloud answers that it needs a recent sign-in, asks for one (a passkey or
 * a code by e-mail) and runs the action again. The person never has to start the action twice.
 */
export function StepUpProvider({ api, children }: { api: PortalApi; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pending = useRef<{ action: () => Promise<void>; resolve: () => void; reject: (e: unknown) => void } | null>(null);

  const run: StepUp = useCallback(
    async (action) => {
      try {
        await action();
      } catch (e) {
        if (!isStepUp(e)) throw e;
        await new Promise<void>((resolve, reject) => {
          pending.current = { action, resolve, reject };
          setOpen(true);
        });
      }
    },
    [],
  );

  const finish = async () => {
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    if (!p) return;
    try {
      await p.action();
      p.resolve();
    } catch (e) {
      p.reject(e);
    }
  };

  const cancel = () => {
    pending.current?.reject(new Cancelled("cancelled"));
    pending.current = null;
    setOpen(false);
  };

  return (
    <StepUpContext.Provider value={run}>
      {children}
      <Dialog.Root open={open} onOpenChange={(o) => !o && cancel()}>
        <Dialog.Portal>
          <Dialog.Backdrop className={backdrop} />
          <Dialog.Popup className={popup}>{open && <StepUpForm api={api} onDone={finish} />}</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </StepUpContext.Provider>
  );
}

export const useStepUp = () => useContext(StepUpContext);

function StepUpForm({ api, onDone }: { api: PortalApi; onDone: () => void }) {
  const t = useTranslations("account.ui.stepUp");
  const tc = useTranslations("account.ui");
  const describeError = useDescribeError();
  const [methods, setMethods] = useState<string[] | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.stepUp.methods().then(setMethods, () => setMethods(["email_code"]));
  }, [api]);

  const passkey = async () => {
    setError(null);
    try {
      await api.stepUp.withPasskey();
      onDone();
    } catch (e) {
      if (!(isApiError(e) && e.code === "passkey_cancelled")) setError(describeError(e));
    }
  };
  const send = async () => {
    setError(null);
    setBusy(true);
    try {
      setHint(await api.stepUp.sendEmailCode());
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };
  const verify = async (value: string) => {
    if (value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await api.stepUp.verifyEmailCode(value);
      onDone();
    } catch (e) {
      setError(describeError(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Dialog.Title className="text-[20px] font-semibold tracking-[-0.01em]">{t("title")}</Dialog.Title>
      <Dialog.Description className="mt-2 text-[15px] leading-[1.6] text-ink-2">
        {hint ? t("sent", { hint }) : t("needed")}
      </Dialog.Description>
      <div className="mt-6 grid gap-3">
        {hint ? (
          <CodeField
            value={code}
            disabled={busy}
            error={error}
            onChange={(v) => {
              setCode(v);
              void verify(v);
            }}
          />
        ) : (
          <>
            {methods?.includes("passkey") && (
              <button type="button" className={primaryButton} onClick={passkey}>
                {t("passkey")}
              </button>
            )}
            <button type="button" className={methods?.includes("passkey") ? secondaryButton : primaryButton} onClick={send} disabled={busy || !methods}>
              {busy ? t("sending") : t("sendCode")}
            </button>
            {error && <FormError>{error}</FormError>}
          </>
        )}
        <Dialog.Close className="mt-1 text-[14px] text-ink-3 [@media(hover:hover)]:hover:text-ink">{tc("cancel")}</Dialog.Close>
      </div>
    </div>
  );
}

/** "today", "3 days ago", "last month" in the visitor's language: for when something was last used. */
export function useAgo(): (seconds: number | null | undefined) => string {
  const locale = useLocale();
  const t = useTranslations("account.ui");
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return (seconds) => {
    if (!seconds) return t("never");
    const diff = seconds - Date.now() / 1000;
    const abs = Math.abs(diff);
    if (abs < 3600) return relative.format(Math.round(diff / 60), "minute");
    if (abs < 86_400) return relative.format(Math.round(diff / 3600), "hour");
    if (abs < 30 * 86_400) return relative.format(Math.round(diff / 86_400), "day");
    if (abs < 365 * 86_400) return relative.format(Math.round(diff / (30 * 86_400)), "month");
    return relative.format(Math.round(diff / (365 * 86_400)), "year");
  };
}

/** A long date ("27 October 2026") in the visitor's language; empty when there is none. */
export function useDate(): (seconds: number | null | undefined) => string {
  const locale = useLocale();
  return (seconds) => (seconds ? new Date(seconds * 1000).toLocaleDateString(locale, { dateStyle: "long" }) : "");
}

/**
 * An on/off setting. The state is said three ways, so colour is never the only one: the side the
 * knob is on, the word beside it, and the real checkbox a screen reader announces as a switch. The
 * whole row is the target, 56 px high.
 */
export function Switch({
  label,
  detail,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  detail?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("account.ui");
  return (
    <label className={`flex min-h-14 items-center gap-4 py-2 ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {detail && <span className="mt-0.5 block text-[13px] leading-[1.45] text-ink-3 text-pretty">{detail}</span>}
      </span>
      {/* Both words share one cell, so the longer one sets the width and nothing shifts between states. */}
      <span aria-hidden className="grid shrink-0 text-right text-[13px] font-medium text-ink-3">
        <span className={`col-start-1 row-start-1 ${checked ? "invisible" : ""}`}>{t("off")}</span>
        <span className={`col-start-1 row-start-1 ${checked ? "" : "invisible"}`}>{t("on")}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-8 w-14 shrink-0 rounded-full bg-white/[0.12] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color] duration-[var(--duration-quick)] after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-[#f6f5f1] after:shadow-[0_1px_3px_rgb(0_0_0/0.4)] after:transition-transform after:duration-[var(--duration-quick)] after:ease-[var(--ease-out)] peer-checked:bg-[#ff5a1f] peer-checked:after:translate-x-6 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ap-focus)]"
      />
    </label>
  );
}

/** One choice among several that can all be on: a 48 px row with a real checkbox. */
export function CheckRow({
  label,
  detail,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  detail?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex min-h-12 items-start gap-3.5 py-3 ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#ff7a3d]"
      />
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        {detail && <span className="mt-0.5 block text-[13px] leading-[1.45] text-ink-3 text-pretty">{detail}</span>}
      </span>
    </label>
  );
}
