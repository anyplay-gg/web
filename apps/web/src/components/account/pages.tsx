// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import {
  type AccountView,
  type Audience,
  type LinkedAccount,
  type LinkProvider,
  type Privacy,
  type Profile,
  type PrivacyKey,
} from "@anyplay/api-client";
import { ArrowDownTrayIcon, ArrowRightIcon, ComputerDesktopIcon, GlobeAltIcon, KeyIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useDescribeError } from "@/i18n/errors";
import { CodeField, FormError, TextField } from "../auth/fields";
import { DownloadMenu } from "../landing/download-button";
import { FALLBACK } from "../landing/release";
import { DitherField } from "../landing/shaders";
import { useSite } from "../site-context";
import { LevelMeter } from "./level";
import { BRAND, BrandLogo } from "./brand-logos";
import { Initial, useAccount } from "./shell";
import {
  AudiencePicker,
  Badge,
  Card,
  Confirm,
  Empty,
  Notice,
  PageTitle,
  Row,
  Rows,
  isCancelled,
  smallButton,
  smallDanger,
  smallPrimary,
  Switch,
  useAgo,
  useDate,
  useStepUp,
} from "./ui";

/** Loads once and on demand; the page shows a skeleton until the first answer. */
export function useLoad<T>(load: () => Promise<T>) {
  const describeError = useDescribeError();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
    } catch (e) {
      setError(describeError(e));
    }
  }, [load, describeError]);
  useEffect(() => {
    let alive = true;
    load().then(
      (d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      },
      (e) => alive && setError(describeError(e)),
    );
    return () => {
      alive = false;
    };
    // describeError only words an error; a change of language must not reload the data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);
  return { data, error, reload, setData };
}

export function Loading() {
  const t = useTranslations("account.state");
  return (
    <div aria-busy role="status" className="grid gap-4">
      <span className="sr-only">{t("loading")}</span>
      <span className="h-36 animate-pulse rounded-[24px] bg-white/[0.04]" />
      <span className="h-36 animate-pulse rounded-[24px] bg-white/[0.04]" />
    </div>
  );
}

export function Failed({ message, retry }: { message: string; retry: () => void }) {
  const t = useTranslations("account.state");
  return (
    <div role="alert" className="grid justify-items-start gap-3 text-[15px] text-ink-2">
      {message}
      <button type="button" className={smallButton} onClick={retry}>
        {t("tryAgain")}
      </button>
    </div>
  );
}

/** A write that shows its own problem under the control, and none when the person closed the step-up. */
export function useAction() {
  const stepUp = useStepUp();
  const describeError = useDescribeError();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await stepUp(action);
    } catch (e) {
      if (!isCancelled(e)) setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

/* ───────────────────────────── Overview ───────────────────────────── */

export function OverviewPage() {
  const t = useTranslations("account.overview");
  const tNav = useTranslations("account.shell");
  const date = useDate();
  const { api, session } = useAccount();
  const load = useCallback(
    // The level is a nicety: if the trophies fail to load, the overview still opens without it
    () => Promise.all([api.account.get(), api.links.list(), api.account.privacy(), api.trophies.mine().catch(() => null)]),
    [api],
  );
  const { data, error, reload } = useLoad(load);
  const me = session.account!;
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  const [view, links, privacy, trophies] = data;
  const linked = links.filter((l) => l.linked).length;

  return (
    <div className="grid gap-6">
      <section aria-label={t("label")} className="relative overflow-hidden rounded-[28px] bg-[#120f0d] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <DitherField className="absolute inset-y-0 right-0 h-full w-[70%] opacity-60 [mask-image:linear-gradient(to_left,black_10%,transparent_80%)]" />
        <div className="relative flex flex-wrap items-center gap-5 p-7 sm:p-9">
          <Initial handle={me.handle} size={72} />
          <div className="min-w-0">
            <h1 className="display truncate text-[clamp(1.9rem,1.4rem+1.6vw,2.6rem)] leading-[1.05]">{me.handle}</h1>
            <p className="mt-1.5 truncate text-[15px] text-ink-2">{me.email}</p>
            <p className="mt-1 text-[13px] text-ink-3">{t("memberSince", { date: date(me.created) })}</p>
            {view.account.appearOffline && (
              <p className="mt-3">
                <Badge>{t("appearingOffline")}</Badge>
              </p>
            )}
            {trophies?.level && <LevelMeter level={trophies.level} className="mt-5 -mx-3 w-[min(19rem,calc(100vw-6rem))] rounded-[16px] bg-[#120f0d]/90 p-3" />}
          </div>
        </div>
      </section>

      {view.deletion && (
        <Notice tone="warn">
          {t.rich("deletion", {
            date: date(view.deletion.at),
            keep: (chunks) => (
              <Link href="/account/data" className="font-semibold underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
        </Notice>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        <Tile
          href="/account/security"
          title={tNav("nav_security")}
          value={view.passkeys.length ? t("passkeys", { count: view.passkeys.length }) : t("noPasskey")}
          detail={t("launchersBrowsers", { launchers: view.devices.length, browsers: view.sessions.length })}
          tone={view.passkeys.length ? undefined : "brand"}
        />
        <Tile
          href="/account/privacy"
          title={tNav("nav_privacy")}
          value={t("trophiesAudience", { audience: t(`audience.${privacy.trophies}`) })}
          detail={t("pictureAudience", { audience: t(`audienceInline.${privacy.avatar}`) })}
        />
        <Tile href="/account/connections" title={tNav("nav_connections")} value={linked ? t("linked", { count: linked }) : t("nothingLinked")} detail={t("connectionsDetail")} />
        <Tile href="/account/data" title={tNav("nav_data")} value={t("dataValue")} detail={t("dataDetail")} />
      </ul>

      {view.devices.length === 0 && (
        <Card title={t("launcher.title")} description={t("launcher.description")}>
          <DownloadMenu
            downloads={DOWNLOADS}
            size="sm"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#f6f5f1] px-4 py-1.5 text-[14px] font-semibold text-[#161513]"
          />
        </Card>
      )}
    </div>
  );
}

const DOWNLOADS = FALLBACK;

function Tile({ href, title, value, detail, tone }: { href: string; title: string; value: string; detail: string; tone?: "brand" }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full items-center justify-between gap-4 rounded-[22px] bg-[#141312] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)] transition-[background-color,box-shadow] duration-[var(--duration-quick)] [@media(hover:hover)]:hover:bg-[#191715] [@media(hover:hover)]:hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
      >
        <span className="min-w-0">
          <span className="block text-[13px] text-ink-3">{title}</span>
          <span className={`mt-1 block text-[17px] font-semibold break-words ${tone === "brand" ? "text-brand-text" : ""}`}>{value}</span>
          <span className="mt-0.5 block text-[13px] text-ink-3 break-words">{detail}</span>
        </span>
        <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-ink-3 transition-transform duration-[var(--duration-quick)] [@media(hover:hover)]:group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/* ───────────────────────────── Profile ───────────────────────────── */

/** The cloud keeps 160 characters of it (cloud README, Profiles). */
const ABOUT_MAX = 160;

export function ProfilePage() {
  const t = useTranslations("account.profile");
  const tNav = useTranslations("account.shell");
  const { api, session } = useAccount();
  const load = useCallback(() => api.account.profile(), [api]);
  const { data, error, reload, setData } = useLoad<Profile>(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title={tNav("nav_profile")} lead={t("lead")} />
      <div className="grid gap-6">
        <AvatarCard profile={data} handle={session.account!.handle} onChange={setData} />
        <AboutCard profile={data} onChange={setData} />
        <FavouritesCard profile={data} onChange={setData} />
      </div>
    </div>
  );
}

function AvatarCard({ profile, handle, onChange }: { profile: Profile; handle: string; onChange: (p: Profile) => void }) {
  const t = useTranslations("account.profile.avatar");
  const { api } = useAccount();
  const { busy, error, run } = useAction();
  const input = useRef<HTMLInputElement>(null);
  return (
    <Card title={t("title")} description={t("description")}>
      <div className="flex flex-wrap items-center gap-5">
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- the image optimizer is off on purpose
          <img src={`/v1/avatars/${profile.avatar}`} alt="" width={72} height={72} className="size-[72px] rounded-full object-cover shadow-[0_0_0_1px_rgb(255_255_255/0.1)]" />
        ) : (
          <Initial handle={handle} size={72} />
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void run(async () => onChange({ ...profile, avatar: await api.account.setAvatar(file) }));
            }}
          />
          <button type="button" className={smallPrimary} disabled={busy} onClick={() => input.current?.click()}>
            {busy ? t("uploading") : profile.avatar ? t("change") : t("upload")}
          </button>
          {profile.avatar && (
            <button
              type="button"
              className={smallButton}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api.account.removeAvatar();
                  onChange({ ...profile, avatar: null });
                })
              }
            >
              {t("remove")}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}
    </Card>
  );
}

function AboutCard({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const t = useTranslations("account.profile.about");
  const { api } = useAccount();
  const { busy, error, run } = useAction();
  const [about, setAbout] = useState(profile.about ?? "");
  const [saved, setSaved] = useState(false);
  const dirty = about !== (profile.about ?? "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    void run(async () => {
      onChange(await api.account.updateProfile({ about: about.trim() }));
      setSaved(true);
    });
  };
  return (
    <Card id="profile-about" title={t("title")} description={t("description")}>
      <form onSubmit={submit} className="grid gap-3">
        <label htmlFor="about" className="sr-only">
          {t("title")}
        </label>
        <textarea
          id="about"
          value={about}
          maxLength={ABOUT_MAX}
          rows={3}
          onChange={(e) => {
            setAbout(e.target.value);
            setSaved(false);
          }}
          className="w-full resize-none rounded-[14px] bg-white/[0.04] px-4 py-3 text-[16px] leading-[1.5] text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] outline-none placeholder:text-ink-3 focus:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22),0_0_0_3px_rgb(255_122_61/0.35)]"
          placeholder={t("placeholder")}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-ink-3 tabular-nums">
            {about.length}/{ABOUT_MAX}
          </span>
          <span className="flex items-center gap-3">
            {saved && !dirty && (
              <span role="status" className="text-[13px] text-[#7fe3b0]">
                {t("saved")}
              </span>
            )}
            <button type="submit" className={smallPrimary} disabled={busy || !dirty}>
              {busy ? t("saving") : t("save")}
            </button>
          </span>
        </div>
        {error && <FormError>{error}</FormError>}
      </form>
    </Card>
  );
}

/** The cloud keeps at most three favourite titles (network spec/cloud-api.md, Profiles). */
const FAVOURITES_MAX = 3;
const TITLE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function FavouritesCard({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const t = useTranslations("account.profile.favourites");
  const { api } = useAccount();
  const { busy, error, run } = useAction();
  const saved = profile.favourites ?? [];
  const [list, setList] = useState<string[]>(saved);
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const dirty = list.length !== saved.length || list.some((id, i) => id !== saved[i]);
  const full = list.length >= FAVOURITES_MAX;

  const add = (e: FormEvent) => {
    e.preventDefault();
    const id = draft.trim();
    if (!id) return;
    if (!TITLE_ID.test(id)) return setProblem(t("badId"));
    if (list.includes(id)) return setProblem(t("duplicate", { id }));
    setList([...list, id]);
    setDraft("");
    setProblem(null);
    setDone(false);
  };
  const save = () => {
    setDone(false);
    void run(async () => {
      onChange(await api.account.updateProfile({ favourites: list }));
      setDone(true);
    });
  };

  return (
    <Card
      id="profile-favourites"
      title={t("title")}
      description={t("description", { max: FAVOURITES_MAX })}
    >
      <div className="grid gap-4">
        {list.length === 0 ? (
          <Empty>{t("empty")}</Empty>
        ) : (
          <ul aria-label={t("listLabel")} className="flex flex-wrap gap-3">
            {list.map((id) => (
              <li
                key={id}
                className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/[0.05] pr-1 pl-4 text-[14px] font-medium tabular-nums shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] [@media(pointer:coarse)]:min-h-11"
              >
                {id}
                <button
                  type="button"
                  aria-label={t("remove", { id })}
                  onClick={() => {
                    setList(list.filter((x) => x !== id));
                    setDone(false);
                  }}
                  className="grid size-8 place-items-center rounded-full text-ink-3 transition-[background-color,color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.08] [@media(hover:hover)]:hover:text-ink [@media(pointer:coarse)]:size-10"
                >
                  <XMarkIcon aria-hidden className="size-4" strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <TextField
            label={t("fieldLabel")}
            className="min-w-[12rem] flex-1"
            value={draft}
            disabled={full}
            placeholder="GAME00001"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
            error={problem}
            hint={full ? t("full", { max: FAVOURITES_MAX }) : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              setProblem(null);
            }}
          />
          <button type="submit" className={smallButton} disabled={full || !draft.trim()}>
            {t("add")}
          </button>
        </form>
        <div className="flex items-center justify-end gap-3">
          {done && !dirty && (
            <span role="status" className="text-[13px] text-[#7fe3b0]">
              {t("saved")}
            </span>
          )}
          <button type="button" className={smallPrimary} disabled={busy || !dirty} onClick={save}>
            {busy ? t("saving") : t("save")}
          </button>
        </div>
        {error && <FormError>{error}</FormError>}
      </div>
    </Card>
  );
}

/* ───────────────────────────── Security ───────────────────────────── */

export function SecurityPage() {
  const t = useTranslations("account.security");
  const tNav = useTranslations("account.shell");
  const { api } = useAccount();
  const load = useCallback(() => api.account.get(), [api]);
  const { data, error, reload, setData } = useLoad<AccountView>(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title={tNav("nav_security")} lead={t("lead")} />
      <div className="grid gap-6">
        <EmailCard view={data} onChange={reload} />
        <PasskeysCard view={data} onChange={setData} />
        <DevicesCard view={data} onChange={setData} />
        <SessionsCard view={data} onChange={setData} />
        <EverywhereCard />
      </div>
    </div>
  );
}

function EmailCard({ view, onChange }: { view: AccountView; onChange: () => Promise<void> }) {
  const t = useTranslations("account.security.email");
  const { api } = useAccount();
  const { busy, error, run, setError } = useAction();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(view.pendingEmail);
  const [code, setCode] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(t("invalid"));
      return;
    }
    void run(async () => {
      await api.account.changeEmail(value);
      setSentTo(value);
      setEditing(false);
    });
  };
  const confirm = (value: string) => {
    if (value.length !== 6) return;
    void run(async () => {
      const now = await api.account.confirmEmail(value);
      setDone(now);
      setSentTo(null);
      setCode("");
      await onChange();
    });
  };

  return (
    <Card
      id="email"
      title={t("title")}
      description={t("description")}
      action={
        !editing && !sentTo ? (
          <button type="button" className={smallButton} onClick={() => setEditing(true)}>
            {t("change")}
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        <p className="text-[16px] font-medium">{view.account.email}</p>
        {done && <Notice tone="ok">{t("done", { email: done })}</Notice>}
        {editing && (
          <form onSubmit={send} noValidate className="grid gap-3">
            <TextField label={t("newAddress")} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="send" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoFocus />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={smallPrimary} disabled={busy}>
                {busy ? t("sending") : t("send")}
              </button>
              <button type="button" className={smallButton} onClick={() => setEditing(false)}>
                {t("cancel")}
              </button>
            </div>
          </form>
        )}
        {sentTo && (
          <div className="grid gap-3">
            <p className="text-[14px] text-ink-2">
              {t.rich("sentTo", { email: sentTo, b: (chunks) => <strong className="font-semibold text-ink break-all">{chunks}</strong> })}
            </p>
            <CodeField
              value={code}
              disabled={busy}
              error={editing ? null : error}
              onChange={(v) => {
                setCode(v);
                confirm(v);
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function PasskeysCard({ view, onChange }: { view: AccountView; onChange: (v: AccountView) => void }) {
  const t = useTranslations("account.security.passkeys");
  const ago = useAgo();
  const { api } = useAccount();
  const stepUp = useStepUp();
  const { busy, error, run } = useAction();
  const [removing, setRemoving] = useState<string | null>(null);
  const full = view.passkeys.length >= view.maxPasskeys;
  const add = () =>
    void run(async () => {
      const key = await api.security.addPasskey(defaultPasskeyName(t));
      onChange({ ...view, passkeys: [...view.passkeys, key] });
    });
  return (
    <Card
      id="passkeys"
      title={t("title")}
      description={t("description")}
      action={
        <button type="button" className={smallPrimary} onClick={add} disabled={busy || full}>
          <KeyIcon aria-hidden className="size-4" /> {busy ? t("waiting") : t("add")}
        </button>
      }
    >
      {view.passkeys.length ? (
        <Rows>
          {view.passkeys.map((p) => (
            <Row
              key={p.id}
              icon={<KeyIcon className="size-5" strokeWidth={1.6} />}
              title={p.name}
              detail={t("detail", { added: ago(p.created), used: ago(p.lastUsed) })}
              trailing={
                <button type="button" className={smallButton} onClick={() => setRemoving(p.id)}>
                  {t("remove")}
                </button>
              }
            />
          ))}
        </Rows>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
      {full && <p className="mt-3 text-[13px] text-ink-3">{t("full", { max: view.maxPasskeys })}</p>}
      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}
      <Confirm
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("confirmLabel")}
        danger
        onConfirm={async () => {
          const id = removing!;
          await stepUp(() => api.security.removePasskey(id));
          onChange({ ...view, passkeys: view.passkeys.filter((p) => p.id !== id) });
        }}
      />
    </Card>
  );
}

const PLATFORM: Record<string, string> = { windows: "Windows", linux: "Linux", macos: "macOS", mac: "macOS" };

/** The name a new passkey gets, in the visitor's language: "Passkey on Windows". */
function defaultPasskeyName(t: (key: "defaultName" | "thisDevice", values?: { system: string }) => string): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const system = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Linux/.test(ua) ? "Linux" : t("thisDevice");
  return t("defaultName", { system });
}

function DevicesCard({ view, onChange }: { view: AccountView; onChange: (v: AccountView) => void }) {
  const t = useTranslations("account.security.devices");
  const ago = useAgo();
  const { api } = useAccount();
  const stepUp = useStepUp();
  const [removing, setRemoving] = useState<number | null>(null);
  return (
    <Card id="devices" title={t("title")} description={t("description")}>
      {view.devices.length ? (
        <Rows>
          {view.devices.map((d) => (
            <Row
              key={d.id}
              icon={<ComputerDesktopIcon className="size-5" strokeWidth={1.6} />}
              title={d.name}
              detail={t("detail", { platform: PLATFORM[d.platform] ?? d.platform, used: ago(d.lastUsed) })}
              trailing={
                <button type="button" className={smallButton} onClick={() => setRemoving(d.id)}>
                  {t("signOut")}
                </button>
              }
            />
          ))}
        </Rows>
      ) : (
        <Empty>{t("empty")}</Empty>
      )}
      <Confirm
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("confirmLabel")}
        onConfirm={async () => {
          const id = removing!;
          await stepUp(() => api.security.removeDevice(id));
          onChange({ ...view, devices: view.devices.filter((d) => d.id !== id) });
        }}
      />
    </Card>
  );
}

function SessionsCard({ view, onChange }: { view: AccountView; onChange: (v: AccountView) => void }) {
  const t = useTranslations("account.security.browsers");
  const ago = useAgo();
  const { api } = useAccount();
  const router = useRouter();
  const stepUp = useStepUp();
  const [ending, setEnding] = useState<number | null>(null);
  const current = view.sessions.find((s) => s.id === ending)?.current ?? false;
  return (
    <Card id="browsers" title={t("title")} description={t("description")}>
      <Rows>
        {view.sessions.map((s) => (
          <Row
            key={s.id}
            icon={<GlobeAltIcon className="size-5" strokeWidth={1.6} />}
            title={s.current ? <>{t("thisBrowser")} <Badge tone="ok">{t("here")}</Badge></> : t("other")}
            detail={t("detail", { created: ago(s.created), used: ago(s.lastUsed) })}
            trailing={
              <button type="button" className={smallButton} onClick={() => setEnding(s.id)}>
                {t("signOut")}
              </button>
            }
          />
        ))}
      </Rows>
      <Confirm
        open={ending !== null}
        onOpenChange={(o) => !o && setEnding(null)}
        title={current ? t("confirmThisTitle") : t("confirmOtherTitle")}
        description={current ? t("confirmThisDescription") : t("confirmOtherDescription")}
        confirmLabel={t("confirmLabel")}
        onConfirm={async () => {
          const id = ending!;
          let signedOut = false;
          await stepUp(async () => {
            signedOut = (await api.security.revokeSession(id)).signedOut;
          });
          if (signedOut) router.replace("/");
          else onChange({ ...view, sessions: view.sessions.filter((s) => s.id !== id) });
        }}
      />
    </Card>
  );
}

function EverywhereCard() {
  const t = useTranslations("account.security.everywhere");
  const { api } = useAccount();
  const router = useRouter();
  const stepUp = useStepUp();
  const [open, setOpen] = useState(false);
  return (
    <Card
      title={t("title")}
      description={t("description")}
      action={
        <button type="button" className={smallDanger} onClick={() => setOpen(true)}>
          {t("button")}
        </button>
      }
    >
      <Confirm
        open={open}
        onOpenChange={setOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("confirmLabel")}
        danger
        onConfirm={async () => {
          await stepUp(() => api.security.signOutEverywhere());
          router.replace("/");
        }}
      />
    </Card>
  );
}

/* ───────────────────────────── Privacy ───────────────────────────── */

const PARTS: PrivacyKey[] = ["trophies", "playtime", "about", "favourites", "avatar"];

/**
 * Appear offline: friends see the player as offline while the player keeps playing, chatting and
 * joining (ADR 0028). It is a setting of its own, not a part of Privacy. The switch moves at once
 * and goes back, with the reason, when the cloud says no.
 */
function AppearOfflineCard() {
  const t = useTranslations("account.privacy.appearOffline");
  const tState = useTranslations("account.state");
  const describeError = useDescribeError();
  const { api } = useAccount();
  const load = useCallback(() => api.account.appearOffline(), [api]);
  const { data, error, reload, setData } = useLoad<boolean>(load);
  const [problem, setProblem] = useState<string | null>(null);
  const latest = useRef(0);
  let body: ReactNode;
  if (error) body = <Failed message={error} retry={reload} />;
  else if (data === null) body = <span aria-busy role="status" className="block h-14 animate-pulse rounded-[16px] bg-white/[0.04]"><span className="sr-only">{tState("loading")}</span></span>;
  else {
    const set = async (value: boolean) => {
      const before = data;
      const mine = ++latest.current;
      setData(value);
      setProblem(null);
      try {
        const saved = await api.account.setAppearOffline(value);
        if (mine === latest.current) setData(saved);
      } catch (e) {
        if (mine !== latest.current) return;
        setData(before);
        setProblem(describeError(e));
      }
    };
    body = (
      <>
        <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <Switch label={t("label")} detail={t("detail")} checked={data} onChange={(on) => void set(on)} />
        </div>
        {problem && (
          <div className="mt-4">
            <FormError>{problem}</FormError>
          </div>
        )}
      </>
    );
  }
  return (
    <Card title={t("title")} description={t("description")}>
      {body}
    </Card>
  );
}

/**
 * The public profile: off for a new account. On, anyone with the link sees the player's level,
 * trophy counts and games played at /u/<handle>; nothing else changes. Same optimistic switch as
 * appearing offline.
 */
function PublicProfileCard() {
  const t = useTranslations("account.privacy.publicProfile");
  const tState = useTranslations("account.state");
  const describeError = useDescribeError();
  const { api, session } = useAccount();
  const { host } = useSite();
  const load = useCallback(() => api.account.publicProfile(), [api]);
  const { data, error, reload, setData } = useLoad<boolean>(load);
  const [problem, setProblem] = useState<string | null>(null);
  const latest = useRef(0);
  const handle = session.account?.handle;
  let body: ReactNode;
  if (error) body = <Failed message={error} retry={reload} />;
  else if (data === null) body = <span aria-busy role="status" className="block h-14 animate-pulse rounded-[16px] bg-white/[0.04]"><span className="sr-only">{tState("loading")}</span></span>;
  else {
    const set = async (value: boolean) => {
      const before = data;
      const mine = ++latest.current;
      setData(value);
      setProblem(null);
      try {
        const saved = await api.account.setPublicProfile(value);
        if (mine === latest.current) setData(saved);
      } catch (e) {
        if (mine !== latest.current) return;
        setData(before);
        setProblem(describeError(e));
      }
    };
    body = (
      <>
        <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <Switch label={t("label")} detail={t("detail")} checked={data} onChange={(on) => void set(on)} />
        </div>
        {data && handle && (
          <p className="mt-4 text-[14px] text-ink-2">
            {t.rich("page", {
              url: `${host ?? ""}/u/${handle}`,
              link: (chunks) => (
                <a href={`/u/${encodeURIComponent(handle)}`} className="font-medium text-ink underline underline-offset-4 break-all">
                  {chunks}
                </a>
              ),
            })}
          </p>
        )}
        {problem && (
          <div className="mt-4">
            <FormError>{problem}</FormError>
          </div>
        )}
      </>
    );
  }
  return (
    <Card title={t("title")} description={t("description")}>
      {body}
    </Card>
  );
}

/**
 * Played with recently: the cloud keeps a private list of the people the player shared a party or
 * session with (ADR 0038). The list is read in the launcher; here the player decides whether it
 * is kept and can empty it. Same optimistic switch as the others; clearing asks first.
 */
function PlayedWithCard() {
  const t = useTranslations("account.privacy.playedWith");
  const tState = useTranslations("account.state");
  const describeError = useDescribeError();
  const { api } = useAccount();
  const load = useCallback(() => api.account.playedWithRemember(), [api]);
  const { data, error, reload, setData } = useLoad<boolean>(load);
  const [problem, setProblem] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const latest = useRef(0);
  let body: ReactNode;
  if (error) body = <Failed message={error} retry={reload} />;
  else if (data === null) body = <span aria-busy role="status" className="block h-14 animate-pulse rounded-[16px] bg-white/[0.04]"><span className="sr-only">{tState("loading")}</span></span>;
  else {
    const set = async (value: boolean) => {
      const before = data;
      const mine = ++latest.current;
      setData(value);
      setProblem(null);
      try {
        const saved = await api.account.setPlayedWithRemember(value);
        if (mine === latest.current) setData(saved);
      } catch (e) {
        if (mine !== latest.current) return;
        setData(before);
        setProblem(describeError(e));
      }
    };
    body = (
      <>
        <div className="rounded-[16px] bg-white/[0.02] px-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <Switch label={t("label")} detail={t("detail")} checked={data} onChange={(on) => void set(on)} />
        </div>
        {problem && (
          <div className="mt-4">
            <FormError>{problem}</FormError>
          </div>
        )}
      </>
    );
  }
  return (
    <Card
      title={t("title")}
      description={t("description")}
      action={
        <button type="button" className={smallDanger} onClick={() => { setCleared(false); setClearing(true); }}>
          {t("clear")}
        </button>
      }
    >
      {body}
      <p role="status" className="mt-4 text-[14px] text-ink-2 empty:hidden">{cleared ? t("cleared") : ""}</p>
      <Confirm
        open={clearing}
        onOpenChange={setClearing}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("clear")}
        danger
        onConfirm={async () => {
          await api.account.clearPlayedWith();
          setCleared(true);
        }}
      />
    </Card>
  );
}

export function PrivacyPage() {
  const t = useTranslations("account.privacy");
  const tNav = useTranslations("account.shell");
  const tAudience = useTranslations("account.ui.audience");
  const describeError = useDescribeError();
  const { api } = useAccount();
  const load = useCallback(() => api.account.privacy(), [api]);
  const { data, error, reload, setData } = useLoad<Privacy>(load);
  const [saving, setSaving] = useState<PrivacyKey | null>(null);
  const [problem, setProblem] = useState<{ part: PrivacyKey; text: string } | null>(null);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  const set = async (part: PrivacyKey, audience: Audience) => {
    const before = data;
    const next = { ...data, [part]: audience };
    setData(next);
    setSaving(part);
    setProblem(null);
    try {
      setData(await api.account.updatePrivacy(next));
    } catch (e) {
      setData(before);
      setProblem({ part, text: describeError(e) });
    } finally {
      setSaving(null);
    }
  };
  return (
    <div>
      <PageTitle title={tNav("nav_privacy")} lead={t("lead")} />
      <div className="grid gap-6">
        <Card title={t("profile.title")} description={t("profile.description")}>
          <Rows>
            {PARTS.map((part) => (
              <Row key={part} title={t(`parts.${part}.title`)} detail={t(`parts.${part}.detail`)} trailing={<AudiencePicker label={t("whoSees", { part: t(`parts.${part}.title`) })} value={data[part]} disabled={saving === part} onChange={(a) => void set(part, a)} />} />
            ))}
          </Rows>
          {problem && problem.part !== "feed" && (
            <div className="mt-4">
              <FormError>{problem.text}</FormError>
            </div>
          )}
        </Card>
        <Card title={t("activity.title")} description={t("activity.description")}>
          <Rows>
            <Row
              title={t("activity.row")}
              detail={t("activity.detail", { nobody: tAudience("nobody") })}
              trailing={<AudiencePicker label={t("whoSees", { part: t("activity.row") })} value={data.feed === "everyone" ? "friends" : data.feed} only={["friends", "nobody"]} disabled={saving === "feed"} onChange={(a) => void set("feed", a)} />}
            />
          </Rows>
          {problem?.part === "feed" && (
            <div className="mt-4">
              <FormError>{problem.text}</FormError>
          </div>
        )}
        </Card>
        <PublicProfileCard />
        <AppearOfflineCard />
        <PlayedWithCard />
      </div>
    </div>
  );
}

/* ───────────────────────────── Connections ───────────────────────────── */

/** The outcomes the cloud can send back in `?result=`, and the tone of each; the words are in the messages. */
const RESULT = {
  linked: "ok",
  denied: "warn",
  expired: "warn",
  fresh: "warn",
  taken: "warn",
  exists: "warn",
  failed: "warn",
} as const;
const isResult = (value: string | null): value is keyof typeof RESULT => value !== null && Object.hasOwn(RESULT, value);

export function ConnectionsPage() {
  const t = useTranslations("account.connections");
  const tNav = useTranslations("account.shell");
  const { api } = useAccount();
  const params = useSearchParams();
  const load = useCallback(() => api.links.list(), [api]);
  const { data, error, reload, setData } = useLoad<LinkedAccount[]>(load);
  const provider = params.get("link") as LinkProvider | null;
  const result = params.get("result");
  const notice = provider && isResult(result) && BRAND[provider] ? { tone: RESULT[result], text: t(`result.${result}`, { name: BRAND[provider].name }) } : null;
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title={tNav("nav_connections")} lead={t("lead")} />
      <div className="grid gap-4">
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        {data.map((l) => (
          <ConnectionCard key={l.provider} link={l} onChange={(next) => setData(data.map((x) => (x.provider === next.provider ? next : x)))} />
        ))}
      </div>
    </div>
  );
}

/**
 * The services a player can link today. Steam is built (cloud#38) but switched off until AnyPlay's
 * Steam key is set up; until then it shows as coming soon.
 */
const LINKING_OPEN = new Set<LinkProvider>(["discord"]);

function ConnectionCard({ link, onChange }: { link: LinkedAccount; onChange: (l: LinkedAccount) => void }) {
  const t = useTranslations("account.connections");
  const ago = useAgo();
  const { api } = useAccount();
  const stepUp = useStepUp();
  const { busy, error, run } = useAction();
  const [unlinking, setUnlinking] = useState(false);
  const brand = BRAND[link.provider];
  let body: ReactNode;
  if (link.linked) {
    body = (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium">{link.name ?? link.externalId}</span>
          <span className="block text-[13px] text-ink-3">{t("linkedAgo", { ago: ago(link.linkedAt) })}</span>
        </span>
        <span className="flex flex-wrap items-center gap-3">
          <AudiencePicker
            label={t("whoSees", { name: brand.name })}
            value={link.audience}
            disabled={busy}
            onChange={(a) =>
              void run(async () => {
                await api.links.setAudience(link.provider, a);
                onChange({ ...link, audience: a });
              })
            }
          />
          <button type="button" className={smallButton} onClick={() => setUnlinking(true)}>
            {t("unlink")}
          </button>
        </span>
      </div>
    );
  } else if (link.available && LINKING_OPEN.has(link.provider)) {
    body = (
      <button
        type="button"
        className={smallPrimary}
        disabled={busy}
        onClick={() =>
          void run(async () => {
            window.location.assign(await api.links.start(link.provider));
          })
        }
      >
        {busy ? t("opening") : t("link", { name: brand.name })}
      </button>
    );
  } else {
    body = <Badge>{t("soon")}</Badge>;
  }
  return (
    <section aria-label={brand.name} className="flex flex-wrap items-center gap-5 rounded-[22px] bg-[#141312] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white/[0.05]" style={{ color: brand.color }}>
        <BrandLogo provider={link.provider} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] font-semibold">{brand.name}</h2>
        {!link.linked && <p className="text-[13px] text-ink-3">{LINKING_OPEN.has(link.provider) && link.available ? t("notLinked") : t("arrivesSoon")}</p>}
        {link.linked && <div className="mt-3">{body}</div>}
        {error && (
          <div className="mt-3">
            <FormError>{error}</FormError>
          </div>
        )}
      </div>
      {!link.linked && body}
      <Confirm
        open={unlinking}
        onOpenChange={setUnlinking}
        title={t("confirmTitle", { name: brand.name })}
        description={t("confirmDescription", { name: brand.name })}
        confirmLabel={t("confirmLabel", { name: brand.name })}
        onConfirm={async () => {
          await stepUp(() => api.links.unlink(link.provider));
          onChange({ ...link, linked: false, name: null, externalId: null, avatarUrl: null, linkedAt: null });
        }}
      />
    </section>
  );
}

/* ───────────────────────────── Your data ───────────────────────────── */

export function DataPage() {
  const t = useTranslations("account.data");
  const tNav = useTranslations("account.shell");
  const date = useDate();
  const { api, session } = useAccount();
  const load = useCallback(() => api.account.get(), [api]);
  const { data, error, reload, setData } = useLoad<AccountView>(load);
  const exporting = useAction();
  const { run } = useAction();
  const stepUp = useStepUp();
  const [deleting, setDeleting] = useState(false);
  const handle = session.account!.handle;
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;

  const download = () =>
    void exporting.run(async () => {
      const file = await api.data.exportData();
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    });

  return (
    <div>
      <PageTitle title={tNav("nav_data")} lead={t("lead")} />
      <div className="grid gap-6">
        <Card
          title={t("export.title")}
          description={t("export.description")}
          action={
            <button type="button" className={smallPrimary} onClick={download} disabled={exporting.busy}>
              <ArrowDownTrayIcon aria-hidden className="size-4" /> {exporting.busy ? t("export.preparing") : t("export.button")}
            </button>
          }
        >
          {exporting.error && <FormError>{exporting.error}</FormError>}
        </Card>

        {data.deletion ? (
          <Card title={t("scheduled.title")} description={t("scheduled.description", { date: date(data.deletion.at) })}>
            <button
              type="button"
              className={smallPrimary}
              onClick={() =>
                void run(async () => {
                  await api.data.cancelDeletion();
                  setData({ ...data, deletion: null });
                })
              }
            >
              {t("scheduled.keep")}
            </button>
          </Card>
        ) : (
          <Card
            title={t("delete.title")}
            description={t("delete.description")}
            action={
              <button type="button" className={smallDanger} onClick={() => setDeleting(true)}>
                {t("delete.button")}
              </button>
            }
          />
        )}
      </div>
      <Confirm
        open={deleting}
        onOpenChange={setDeleting}
        title={t("confirm.title")}
        description={t("confirm.description")}
        confirmLabel={t("delete.button")}
        danger
        typed={handle}
        onConfirm={async () => {
          let at = 0;
          await stepUp(async () => {
            at = (await api.data.requestDeletion(handle)).at;
          });
          setData({ ...data, deletion: { at } });
        }}
      />
    </div>
  );
}
