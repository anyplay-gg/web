// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type BanStatement, type PortalApi, type SessionView, type SignInIntent, isApiError } from "@anyplay/api-client";
import { AnimatePresence, m } from "@anyplay/ui/motion";
import { ArrowRightIcon, ComputerDesktopIcon, KeyIcon } from "@heroicons/react/20/solid";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useDescribeError } from "@/i18n/errors";
import { loadApi } from "@/lib/api";
import { withNext } from "@/lib/join";
import { CheckField, CodeField, FormError, TextField, primaryButton, secondaryButton, textButton } from "./fields";

/**
 * Sign-in and sign-up, one screen per step of the cloud's flow. The cloud decides the step: every
 * answer is the whole session, and this shows `flow.step`. Nothing here checks who may do what;
 * the API does (see the (app) layout). In development the mock stands in for the cloud, so the
 * screens run without one (`?mock=handoff`, `?mock=banned` show those paths).
 */

const ACCOUNT = "/account";

/** A word the cloud wrote for one field (English) wins; every other failure is worded here. */
function fieldError(e: unknown, field: string, describe: (e: unknown) => string): string {
  return (isApiError(e) && e.fields[field]) || describe(e);
}

const bold = (chunks: ReactNode) => <strong className="font-semibold text-ink">{chunks}</strong>;

const legalLink = "font-medium text-brand-text underline underline-offset-4";

/** A link to one of the cloud's own texts: it opens in a new tab, and says so to a screen reader. */
function NewTabLink({ href, children }: { href: string; children: ReactNode }) {
  const t = useTranslations("auth.step");
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={legalLink}>
      {children}
      <span className="sr-only"> {t("newTab")}</span>
    </a>
  );
}

/** The links inside "I accept the terms ... privacy notice", for `t.rich`. */
function legalTags(termsUrl: string | null | undefined, privacyUrl?: string | null) {
  return {
    terms: (chunks: ReactNode) => <NewTabLink href={termsUrl || "/terms"}>{chunks}</NewTabLink>,
    privacy: (chunks: ReactNode) => <NewTabLink href={privacyUrl || "/privacy"}>{chunks}</NewTabLink>,
  };
}

/**
 * `next` is where the person goes when they are signed in: a join page, already checked by
 * `safeNext` (it is null for anything else). Without it they land on their account.
 */
export function AuthFlow({ intent, next = null }: { intent: SignInIntent; next?: string | null }) {
  const [api, setApi] = useState<PortalApi | null>(null);
  const [view, setView] = useState<SessionView | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const t = useTranslations("auth");
  const describeError = useDescribeError();

  useEffect(() => {
    let alive = true;
    loadApi()
      .then(async (a) => {
        const v = await a.session();
        if (!alive) return;
        setApi(a);
        setView(v);
      })
      .catch((e) => alive && setFailed(describeError(e)));
    return () => {
      alive = false;
    };
  }, [describeError]);

  if (failed) {
    return (
      <Step title={t("step.unreachable")} lead={failed}>
        <button type="button" className={primaryButton} onClick={() => window.location.reload()}>
          {t("step.tryAgain")}
        </button>
      </Step>
    );
  }
  if (!api || !view) return <Loading />;

  const step = view.flow.step;
  return (
    <div>
      {view.authorize && (
        <p className="mb-8 flex items-center gap-3 rounded-[16px] bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.45] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
          <ComputerDesktopIcon aria-hidden className="size-5 shrink-0 text-brand-text" />
          <span>{t.rich("flow.authorize", { device: view.authorize.device, b: bold })}</span>
        </p>
      )}
      <AnimatePresence initial={false} mode="wait">
        <m.div
          key={step}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(2px)", transition: { duration: 0.14 } }}
          transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
        >
          {step === "email" && <EmailStep api={api} view={view} intent={view.authorize?.create ? "create" : intent} next={next} onView={setView} />}
          {step === "code" && <CodeStep api={api} view={view} onView={setView} />}
          {step === "details" && <DetailsStep api={api} view={view} onView={setView} />}
          {step === "terms" && <TermsStep api={api} view={view} onView={setView} />}
          {step === "banned" && <BannedStep api={api} />}
          {step === "handoff" && <HandoffStep url={view.flow.redirect ?? ""} />}
          {step === "done" && <DoneStep view={view} next={next} />}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

/** The heading of a step takes the focus when the step changes, so a screen reader hears where it is. */
export function Step({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (document.activeElement === document.body || document.activeElement === null) return;
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div>
      <h1 ref={ref} tabIndex={-1} className="display text-[clamp(2rem,1.6rem+1.6vw,2.6rem)] leading-[1.05] [overflow-wrap:anywhere] outline-none">
        {title}
      </h1>
      {lead && <p className="mt-4 text-[16px] leading-[1.6] text-ink-2 text-pretty">{lead}</p>}
      <div className="mt-9">{children}</div>
    </div>
  );
}

export function Loading() {
  const t = useTranslations("auth.step");
  return (
    <div aria-busy className="grid gap-4" role="status">
      <span className="sr-only">{t("loading")}</span>
      <span className="h-11 w-2/3 animate-pulse rounded-[12px] bg-white/[0.06]" />
      <span className="h-5 w-full animate-pulse rounded-[8px] bg-white/[0.04]" />
      <span className="mt-6 h-12 w-full animate-pulse rounded-[14px] bg-white/[0.04]" />
      <span className="h-12 w-full animate-pulse rounded-full bg-white/[0.06]" />
    </div>
  );
}

type StepProps = { api: PortalApi; view: SessionView; onView: (v: SessionView) => void };

function EmailStep({ api, view, intent, next, onView }: StepProps & { intent: SignInIntent; next: string | null }) {
  const t = useTranslations("auth.email");
  const describeError = useDescribeError();
  const create = intent === "create";
  const [email, setEmail] = useState(view.flow.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [passkey, setPasskey] = useState<{ available: boolean; conditional: boolean } | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  useEffect(() => {
    if (create) return;
    let alive = true;
    const autofill = new AbortController();
    api.auth
      .passkeySupport()
      .then((s) => {
        if (!alive) return;
        setPasskey(s);
        // With autofill, the browser offers the passkey right in the e-mail field.
        if (s.conditional) api.auth.signInWithPasskey({ conditional: true, signal: autofill.signal }).then(onView, () => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
      autofill.abort();
    };
  }, [api, create, onView]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(t("invalid"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onView(await api.auth.start({ email: value, intent }));
    } catch (err) {
      setError(fieldError(err, "email", describeError));
    } finally {
      setBusy(false);
    }
  };

  const withPasskey = async () => {
    setPasskeyError(null);
    try {
      onView(await api.auth.signInWithPasskey({ conditional: false }));
    } catch (err) {
      if (!(isApiError(err) && err.code === "passkey_cancelled")) setPasskeyError(describeError(err));
    }
  };

  return (
    <Step
      title={t(create ? "create.title" : "signIn.title")}
      lead={t(create ? "create.lead" : "signIn.lead")}
    >
      {passkey?.available && (
        <div className="mb-7 grid gap-3">
          <button type="button" className={secondaryButton} onClick={withPasskey}>
            <KeyIcon aria-hidden className="size-[18px] shrink-0" /> {t("passkey")}
          </button>
          {passkeyError && <FormError>{passkeyError}</FormError>}
          <p aria-hidden className="flex items-center gap-4 text-[13px] text-ink-3 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            {t("or")}
          </p>
        </div>
      )}
      <form onSubmit={submit} noValidate className="grid gap-5">
        <TextField
          label={t("label")}
          type="email"
          name="email"
          autoComplete={passkey?.conditional ? "email webauthn" : "email"}
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder={t("placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoFocus
        />
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? t("sending") : t("send")}
        </button>
      </form>
      <p className="mt-8 text-[14px] text-ink-3">
        {t.rich(create ? "haveAccount" : "newHere", {
          link: (chunks) => (
            <Link href={withNext(create ? "/sign-in" : "/create", next)} className="font-medium text-brand-text underline-offset-4 [@media(hover:hover)]:hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </Step>
  );
}

function CodeStep({ api, view, onView }: StepProps) {
  const t = useTranslations("auth.code");
  const tStep = useTranslations("auth.step");
  const describeError = useDescribeError();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (value: string) => {
    if (busy) return;
    if (value.length !== 6) {
      setError(t("incomplete"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onView(await api.auth.verifyCode(value));
    } catch (err) {
      setError(fieldError(err, "code", describeError));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      onView(await api.auth.resendCode());
      setSent(true);
      setWait(30);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <Step
      title={t("title")}
      lead={t.rich("lead", { email: view.flow.email ?? "", b: bold })}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verify(code);
        }}
        noValidate
        className="grid gap-5"
      >
        <CodeField
          value={code}
          disabled={busy}
          error={error}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) void verify(v);
          }}
        />
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? t("checking") : tStep("continue")}
        </button>
      </form>
      <p role="status" className="mt-6 flex flex-wrap items-center gap-x-1 text-[14px] text-ink-3">
        {sent && wait > 0 ? t("resent") : t("noMail")}
        <button type="button" className={textButton} onClick={resend} disabled={wait > 0}>
          {wait > 0 ? t("resendIn", { seconds: wait }) : t("resend")}
        </button>
      </p>
    </Step>
  );
}

function DetailsStep({ api, view, onView }: StepProps) {
  const t = useTranslations("auth.details");
  const describeError = useDescribeError();
  const [handle, setHandle] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const termsView = view.flow.terms;
  const legal = legalTags(termsView?.url, view.cloud?.privacyUrl);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      onView(await api.auth.submitDetails({ handle: handle.trim(), ageConfirmed: age, termsAccepted: termsView ? terms : true }));
    } catch (err) {
      const fields = isApiError(err) ? err.fields : {};
      setErrors(Object.keys(fields).length ? fields : { form: describeError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Step
      title={t("title")}
      lead={t.rich("lead", { email: view.flow.email ?? "", b: bold })}
    >
      <form onSubmit={submit} noValidate className="grid gap-6">
        <TextField
          label={t("handle")}
          name="handle"
          autoComplete="nickname"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          error={errors.handle}
          hint={t("handleHint")}
          autoFocus
        />
        <CheckField
          name="age"
          checked={age}
          onChange={setAge}
          error={errors.age_confirmed}
          hint={t("ageHint")}
        >
          {t("age")}
        </CheckField>
        {termsView && (
          <CheckField name="terms" checked={terms} onChange={setTerms} error={errors.terms_accepted}>
            {t.rich("terms", { ...legal, version: termsView.version })}
          </CheckField>
        )}
        {errors.form && <FormError>{errors.form}</FormError>}
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? t("creating") : t("submit")}
        </button>
      </form>
    </Step>
  );
}

function TermsStep({ api, view, onView }: StepProps) {
  const t = useTranslations("auth.terms");
  const describeError = useDescribeError();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const termsView = view.flow.terms;
  const legal = legalTags(termsView?.url);
  const version = termsView?.version ?? "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onView(await api.auth.acceptTerms());
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Step
      title={t("title")}
      lead={t.rich("lead", { terms: legal.terms, version })}
    >
      <form onSubmit={submit} noValidate className="grid gap-6">
        <CheckField name="accept" checked={accepted} onChange={setAccepted} error={error}>
          {t("accept", { version })}
        </CheckField>
        <button type="submit" className={primaryButton} disabled={busy}>
          {t("submit")}
        </button>
      </form>
    </Step>
  );
}

export function BannedStep({ api }: { api: PortalApi }) {
  const t = useTranslations("auth.banned");
  const format = useFormatter();
  const [ban, setBan] = useState<BanStatement | null>(null);
  useEffect(() => {
    api.auth.ban().then(setBan, () => {});
  }, [api]);
  const until = ban?.until ? format.dateTime(new Date(ban.until * 1000), { dateStyle: "long" }) : null;
  return (
    <Step title={t("title")} lead={ban ? (until ? t("leadUntil", { date: until }) : t("leadForever")) : undefined}>
      {ban && (
        <dl className="grid gap-4 rounded-[18px] bg-white/[0.04] p-5 text-[15px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
          <div>
            <dt className="text-[13px] text-ink-3">{t("rule")}</dt>
            <dd className="mt-1 text-ink">{ban.rule}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-3">{t("reason")}</dt>
            <dd className="mt-1 text-ink">{ban.reason}</dd>
          </div>
        </dl>
      )}
      <a href="/web/ban" className={`${secondaryButton} mt-6`}>
        {t("appeal")}
      </a>
    </Step>
  );
}

/** Back to the launcher: the browser opens the address the launcher listens on, once, by itself. */
function HandoffStep({ url }: { url: string }) {
  const t = useTranslations("auth.handoff");
  useEffect(() => {
    if (!url) return;
    const t = window.setTimeout(() => window.location.assign(url), 700);
    return () => clearTimeout(t);
  }, [url]);
  return (
    <Step title={t("title")} lead={t("lead")}>
      <a href={url} className={primaryButton}>
        {t("open")} <ArrowRightIcon aria-hidden className="size-4 shrink-0" />
      </a>
      <p className="mt-6 text-[14px] text-ink-3">{t("note")}</p>
    </Step>
  );
}

function DoneStep({ view, next }: { view: SessionView; next: string | null }) {
  const t = useTranslations("auth.done");
  const tStep = useTranslations("auth.step");
  const router = useRouter();
  useEffect(() => {
    if (next) router.replace(next);
  }, [next, router]);
  if (next) {
    return (
      <Step title={t("title")} lead={t("inviteLead")}>
        <Link href={next} replace className={primaryButton}>
          {tStep("continue")} <ArrowRightIcon aria-hidden className="size-4 shrink-0" />
        </Link>
      </Step>
    );
  }
  return (
    <Step
      title={t("title")}
      lead={view.account ? t.rich("welcome", { handle: view.account.handle, b: bold }) : undefined}
    >
      <div className="grid gap-3">
        <a href={ACCOUNT} className={primaryButton}>
          {t("account")} <ArrowRightIcon aria-hidden className="size-4 shrink-0" />
        </a>
        <Link href="/" className={secondaryButton}>
          {tStep("backToStart")}
        </Link>
      </div>
    </Step>
  );
}
