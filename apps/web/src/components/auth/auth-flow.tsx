// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type BanStatement, type PortalApi, type SessionView, type SignInIntent, describeError, isApiError } from "@anyplay/api-client";
import { AnimatePresence, m } from "@anyplay/ui/motion";
import { ArrowRightIcon, ComputerDesktopIcon, KeyIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
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

function fieldError(e: unknown, field: string): string {
  return (isApiError(e) && e.fields[field]) || describeError(e);
}

/**
 * `next` is where the person goes when they are signed in: a join page, already checked by
 * `safeNext` (it is null for anything else). Without it they land on their account.
 */
export function AuthFlow({ intent, next = null }: { intent: SignInIntent; next?: string | null }) {
  const [api, setApi] = useState<PortalApi | null>(null);
  const [view, setView] = useState<SessionView | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

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
  }, []);

  if (failed) {
    return (
      <Step title="Can’t reach AnyPlay" lead={failed}>
        <button type="button" className={primaryButton} onClick={() => window.location.reload()}>
          Try again
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
          <span>
            AnyPlay on <strong className="font-semibold text-ink">{view.authorize.device}</strong> is waiting for this sign-in.
          </span>
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
      <h1 ref={ref} tabIndex={-1} className="display text-[clamp(2rem,1.6rem+1.6vw,2.6rem)] leading-[1.05] outline-none">
        {title}
      </h1>
      {lead && <p className="mt-4 text-[16px] leading-[1.6] text-ink-2 text-pretty">{lead}</p>}
      <div className="mt-9">{children}</div>
    </div>
  );
}

export function Loading() {
  return (
    <div aria-busy className="grid gap-4" role="status">
      <span className="sr-only">Loading</span>
      <span className="h-11 w-2/3 animate-pulse rounded-[12px] bg-white/[0.06]" />
      <span className="h-5 w-full animate-pulse rounded-[8px] bg-white/[0.04]" />
      <span className="mt-6 h-12 w-full animate-pulse rounded-[14px] bg-white/[0.04]" />
      <span className="h-12 w-full animate-pulse rounded-full bg-white/[0.06]" />
    </div>
  );
}

type StepProps = { api: PortalApi; view: SessionView; onView: (v: SessionView) => void };

function EmailStep({ api, view, intent, next, onView }: StepProps & { intent: SignInIntent; next: string | null }) {
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
      setError("Enter your e-mail address, like name@example.com.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onView(await api.auth.start({ email: value, intent }));
    } catch (err) {
      setError(fieldError(err, "email"));
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
      title={create ? "Create your account" : "Sign in"}
      lead={create ? "Start with your e-mail address. We send a code to confirm it." : "Use your passkey, or get a code by e-mail."}
    >
      {passkey?.available && (
        <div className="mb-7 grid gap-3">
          <button type="button" className={secondaryButton} onClick={withPasskey}>
            <KeyIcon aria-hidden className="size-[18px]" /> Sign in with a passkey
          </button>
          {passkeyError && <FormError>{passkeyError}</FormError>}
          <p aria-hidden className="flex items-center gap-4 text-[13px] text-ink-3 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            or
          </p>
        </div>
      )}
      <form onSubmit={submit} noValidate className="grid gap-5">
        <TextField
          label="E-mail address"
          type="email"
          name="email"
          autoComplete={passkey?.conditional ? "email webauthn" : "email"}
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoFocus
        />
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? "Sending…" : "Send code"}
        </button>
      </form>
      <p className="mt-8 text-[14px] text-ink-3">
        {create ? "Already have an account?" : "New to AnyPlay?"}{" "}
        <Link href={withNext(create ? "/sign-in" : "/create", next)} className="font-medium text-brand-text underline-offset-4 [@media(hover:hover)]:hover:underline">
          {create ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </Step>
  );
}

function CodeStep({ api, view, onView }: StepProps) {
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
    if (value.length !== 6) {
      setError("Enter the 6 digits from the e-mail.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onView(await api.auth.verifyCode(value));
    } catch (err) {
      setError(fieldError(err, "code"));
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
      title="Check your e-mail"
      lead={
        <>
          We sent a 6-digit code to <strong className="font-semibold text-ink">{view.flow.email}</strong>. It works for 10 minutes.
        </>
      }
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
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>
      <p role="status" className="mt-6 flex flex-wrap items-center gap-x-1 text-[14px] text-ink-3">
        {sent && wait > 0 ? "A new code is on its way." : "No e-mail?"}
        <button type="button" className={textButton} onClick={resend} disabled={wait > 0}>
          {wait > 0 ? `Send a new code in ${wait} s` : "Send a new code"}
        </button>
      </p>
    </Step>
  );
}

function DetailsStep({ api, view, onView }: StepProps) {
  const [handle, setHandle] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const termsView = view.flow.terms;

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
      title="Choose a handle"
      lead={
        <>
          Your address <strong className="font-semibold text-ink">{view.flow.email}</strong> is confirmed. Other players see your
          handle.
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-6">
        <TextField
          label="Handle"
          name="handle"
          autoComplete="nickname"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          error={errors.handle}
          hint="Use 3 to 16 letters, digits, hyphens or underscores. Start with a letter."
          autoFocus
        />
        <CheckField
          name="age"
          checked={age}
          onChange={setAge}
          error={errors.age_confirmed}
          hint="That means 16 or older."
        >
          I am old enough to agree to the terms on my own.
        </CheckField>
        {termsView && (
          <CheckField name="terms" checked={terms} onChange={setTerms} error={errors.terms_accepted}>
            I accept the <TermsLink url={termsView.url} /> (version {termsView.version}) and have read the <PrivacyLink />.
          </CheckField>
        )}
        {errors.form && <FormError>{errors.form}</FormError>}
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </Step>
  );
}

const legalLink = "font-medium text-brand-text underline underline-offset-4";

function TermsLink({ url }: { url: string | null | undefined }) {
  return (
    <a href={url || "/terms"} target="_blank" rel="noopener noreferrer" className={legalLink}>
      terms<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function PrivacyLink() {
  return (
    <a href="/privacy" target="_blank" rel="noopener noreferrer" className={legalLink}>
      privacy notice<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function TermsStep({ api, view, onView }: StepProps) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const termsView = view.flow.terms;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Accept the terms to continue.");
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
      title="Review the terms"
      lead={
        <>
          The terms changed. Read the <TermsLink url={termsView?.url} /> and accept version {termsView?.version} to continue.
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-6">
        <CheckField name="accept" checked={accepted} onChange={setAccepted} error={error}>
          I accept the terms (version {termsView?.version}).
        </CheckField>
        <button type="submit" className={primaryButton} disabled={busy}>
          Accept and continue
        </button>
      </form>
    </Step>
  );
}

export function BannedStep({ api }: { api: PortalApi }) {
  const [ban, setBan] = useState<BanStatement | null>(null);
  useEffect(() => {
    api.auth.ban().then(setBan, () => {});
  }, [api]);
  const until = ban?.until ? new Date(ban.until * 1000).toLocaleDateString(undefined, { dateStyle: "long" }) : null;
  return (
    <Step title="This account is banned" lead={ban ? (until ? `The ban ends on ${until}.` : "The ban does not end on its own.") : undefined}>
      {ban && (
        <dl className="grid gap-4 rounded-[18px] bg-white/[0.04] p-5 text-[15px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
          <div>
            <dt className="text-[13px] text-ink-3">Rule</dt>
            <dd className="mt-1 text-ink">{ban.rule}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-3">Reason</dt>
            <dd className="mt-1 text-ink">{ban.reason}</dd>
          </div>
        </dl>
      )}
      <a href="/web/ban" className={`${secondaryButton} mt-6`}>
        Read the statement and appeal
      </a>
    </Step>
  );
}

/** Back to the launcher: the browser opens the address the launcher listens on, once, by itself. */
function HandoffStep({ url }: { url: string }) {
  useEffect(() => {
    if (!url) return;
    const t = window.setTimeout(() => window.location.assign(url), 700);
    return () => clearTimeout(t);
  }, [url]);
  return (
    <Step title="Signed in" lead="Taking you back to AnyPlay. If nothing happens, use the button.">
      <a href={url} className={primaryButton}>
        Open AnyPlay <ArrowRightIcon aria-hidden className="size-4" />
      </a>
      <p className="mt-6 text-[14px] text-ink-3">You can close this tab once AnyPlay shows you as signed in.</p>
    </Step>
  );
}

function DoneStep({ view, next }: { view: SessionView; next: string | null }) {
  const router = useRouter();
  useEffect(() => {
    if (next) router.replace(next);
  }, [next, router]);
  if (next) {
    return (
      <Step title="You’re signed in" lead="Taking you back to the invitation.">
        <Link href={next} replace className={primaryButton}>
          Continue <ArrowRightIcon aria-hidden className="size-4" />
        </Link>
      </Step>
    );
  }
  return (
    <Step
      title="You’re signed in"
      lead={
        view.account ? (
          <>
            Welcome, <strong className="font-semibold text-ink">{view.account.handle}</strong>. Your friends, parties and trophies
            are waiting in the launcher.
          </>
        ) : undefined
      }
    >
      <div className="grid gap-3">
        <a href={ACCOUNT} className={primaryButton}>
          Go to your account <ArrowRightIcon aria-hidden className="size-4" />
        </a>
        <Link href="/" className={secondaryButton}>
          Back to the start
        </Link>
      </div>
    </Step>
  );
}
