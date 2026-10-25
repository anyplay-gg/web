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
  describeError,
} from "@anyplay/api-client";
import { ArrowDownTrayIcon, ArrowRightIcon, ComputerDesktopIcon, GlobeAltIcon, KeyIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { CodeField, FormError, TextField } from "../auth/fields";
import { DownloadMenu } from "../landing/download-button";
import { DitherField } from "../landing/shaders";
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
  ago,
  date,
  isCancelled,
  smallButton,
  smallDanger,
  smallPrimary,
  useStepUp,
} from "./ui";

/** Loads once and on demand; the page shows a skeleton until the first answer. */
export function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
    } catch (e) {
      setError(describeError(e));
    }
  }, [load]);
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
  }, [load]);
  return { data, error, reload, setData };
}

export function Loading() {
  return (
    <div aria-busy role="status" className="grid gap-4">
      <span className="sr-only">Loading</span>
      <span className="h-36 animate-pulse rounded-[24px] bg-white/[0.04]" />
      <span className="h-36 animate-pulse rounded-[24px] bg-white/[0.04]" />
    </div>
  );
}

export function Failed({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-start gap-3 text-[15px] text-ink-2">
      {message}
      <button type="button" className={smallButton} onClick={retry}>
        Try again
      </button>
    </div>
  );
}

/** A write that shows its own problem under the control, and none when the person closed the step-up. */
export function useAction() {
  const stepUp = useStepUp();
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
  const { api, session } = useAccount();
  const load = useCallback(() => Promise.all([api.account.get(), api.links.list(), api.account.privacy()]), [api]);
  const { data, error, reload } = useLoad(load);
  const me = session.account!;
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  const [view, links, privacy] = data;
  const linked = links.filter((l) => l.linked).length;

  return (
    <div className="grid gap-6">
      <section aria-label="Your account" className="relative overflow-hidden rounded-[28px] bg-[#120f0d] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <DitherField className="absolute inset-y-0 right-0 h-full w-[70%] opacity-60 [mask-image:linear-gradient(to_left,black_10%,transparent_80%)]" />
        <div className="relative flex flex-wrap items-center gap-5 p-7 sm:p-9">
          <Initial handle={me.handle} size={72} />
          <div className="min-w-0">
            <h1 className="display truncate text-[clamp(1.9rem,1.4rem+1.6vw,2.6rem)] leading-[1.05]">{me.handle}</h1>
            <p className="mt-1.5 truncate text-[15px] text-ink-2">{me.email}</p>
            <p className="mt-1 text-[13px] text-ink-3">Member since {date(me.created)}</p>
          </div>
        </div>
      </section>

      {view.deletion && (
        <Notice tone="warn">
          Your account will be deleted on {date(view.deletion.at)}.{" "}
          <Link href="/account/data" className="font-semibold underline underline-offset-4">
            Keep my account
          </Link>
        </Notice>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        <Tile
          href="/account/security"
          title="Security"
          value={view.passkeys.length ? `${view.passkeys.length} passkey${view.passkeys.length > 1 ? "s" : ""}` : "No passkey yet"}
          detail={`${view.devices.length} launcher${view.devices.length === 1 ? "" : "s"} · ${view.sessions.length} browser${view.sessions.length === 1 ? "" : "s"}`}
          tone={view.passkeys.length ? undefined : "brand"}
        />
        <Tile href="/account/privacy" title="Privacy" value={`Trophies: ${AUDIENCE_WORD[privacy.trophies]}`} detail={`Profile picture: ${AUDIENCE_WORD[privacy.avatar].toLowerCase()}`} />
        <Tile href="/account/connections" title="Connections" value={linked ? `${linked} linked` : "Nothing linked"} detail="Discord, Steam" />
        <Tile href="/account/data" title="Your data" value="Export or delete" detail="Everything we keep about you" />
      </ul>

      {view.devices.length === 0 && (
        <Card title="Get the launcher" description="Sign in to the launcher with this account, and your friends, parties and trophies are there.">
          <DownloadMenu
            downloads={DOWNLOADS}
            size="sm"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#f6f5f1] px-4 text-[14px] font-semibold text-[#161513]"
          />
        </Card>
      )}
    </div>
  );
}

const DOWNLOADS = {
  windows: { href: "https://github.com/anyplay-gg/launcher/releases/latest" },
  appImage: { href: "https://github.com/anyplay-gg/launcher/releases/latest" },
  tarball: { href: "https://github.com/anyplay-gg/launcher/releases/latest" },
  page: "https://github.com/anyplay-gg/launcher/releases/latest",
};

const AUDIENCE_WORD: Record<Audience, string> = { everyone: "Everyone", friends: "Friends", nobody: "Only you" };

function Tile({ href, title, value, detail, tone }: { href: string; title: string; value: string; detail: string; tone?: "brand" }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full items-center justify-between gap-4 rounded-[22px] bg-[#141312] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)] transition-[background-color,box-shadow] duration-[var(--duration-quick)] [@media(hover:hover)]:hover:bg-[#191715] [@media(hover:hover)]:hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
      >
        <span className="min-w-0">
          <span className="block text-[13px] text-ink-3">{title}</span>
          <span className={`mt-1 block truncate text-[17px] font-semibold ${tone === "brand" ? "text-brand-text" : ""}`}>{value}</span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-3">{detail}</span>
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
  const { api, session } = useAccount();
  const load = useCallback(() => api.account.profile(), [api]);
  const { data, error, reload, setData } = useLoad<Profile>(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title="Profile" lead="What your friends see when they open your profile. Who sees each part is up to you on the Privacy page." />
      <div className="grid gap-6">
        <AvatarCard profile={data} handle={session.account!.handle} onChange={setData} />
        <AboutCard profile={data} onChange={setData} />
        <FavouritesCard profile={data} onChange={setData} />
      </div>
    </div>
  );
}

function AvatarCard({ profile, handle, onChange }: { profile: Profile; handle: string; onChange: (p: Profile) => void }) {
  const { api } = useAccount();
  const { busy, error, run } = useAction();
  const input = useRef<HTMLInputElement>(null);
  return (
    <Card title="Picture" description="PNG or JPEG, up to 1 MB. It shows round, so keep the face in the middle.">
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
            {busy ? "Uploading…" : profile.avatar ? "Change picture" : "Upload picture"}
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
              Remove
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
    <Card id="profile-about" title="About" description="A line or two about you: what you play, when you're around.">
      <form onSubmit={submit} className="grid gap-3">
        <label htmlFor="about" className="sr-only">
          About
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
          placeholder="Co-op when I can, solo when I can't."
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-3 tabular-nums">
            {about.length}/{ABOUT_MAX}
          </span>
          <span className="flex items-center gap-3">
            {saved && !dirty && (
              <span role="status" className="text-[13px] text-[#7fe3b0]">
                Saved
              </span>
            )}
            <button type="submit" className={smallPrimary} disabled={busy || !dirty}>
              {busy ? "Saving…" : "Save"}
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
    if (!TITLE_ID.test(id)) return setProblem("Use only letters, numbers, hyphens and underscores.");
    if (list.includes(id)) return setProblem(`${id} is on the list already.`);
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
      title="Favourite games"
      description={`Up to ${FAVOURITES_MAX}, by title ID. This site shows the ID. The launcher shows each game's name from your own copy.`}
    >
      <div className="grid gap-4">
        {list.length === 0 ? (
          <Empty>No favourite games yet. Add a title ID below.</Empty>
        ) : (
          <ul aria-label="Your favourite games" className="flex flex-wrap gap-3">
            {list.map((id) => (
              <li
                key={id}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-white/[0.05] pr-1 pl-4 text-[14px] font-medium tabular-nums shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] [@media(pointer:coarse)]:h-11"
              >
                {id}
                <button
                  type="button"
                  aria-label={`Remove ${id}`}
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
            label="Title ID"
            className="min-w-[12rem] flex-1"
            value={draft}
            disabled={full}
            placeholder="GAME00001"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
            error={problem}
            hint={full ? `You have ${FAVOURITES_MAX} games. Remove one to add another.` : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              setProblem(null);
            }}
          />
          <button type="submit" className={smallButton} disabled={full || !draft.trim()}>
            Add game
          </button>
        </form>
        <div className="flex items-center justify-end gap-3">
          {done && !dirty && (
            <span role="status" className="text-[13px] text-[#7fe3b0]">
              Saved
            </span>
          )}
          <button type="button" className={smallPrimary} disabled={busy || !dirty} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {error && <FormError>{error}</FormError>}
      </div>
    </Card>
  );
}

/* ───────────────────────────── Security ───────────────────────────── */

export function SecurityPage() {
  const { api } = useAccount();
  const load = useCallback(() => api.account.get(), [api]);
  const { data, error, reload, setData } = useLoad<AccountView>(load);
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title="Security" lead="How you sign in, and every launcher and browser that is signed in to your account." />
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
      setError("Enter the new address, like name@example.com.");
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
      title="E-mail"
      description="Where your sign-in codes go. Changing it needs a code sent to the new address."
      action={
        !editing && !sentTo ? (
          <button type="button" className={smallButton} onClick={() => setEditing(true)}>
            Change
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        <p className="text-[16px] font-medium">{view.account.email}</p>
        {done && <Notice tone="ok">Your sign-in address is now {done}.</Notice>}
        {editing && (
          <form onSubmit={send} noValidate className="grid gap-3">
            <TextField label="New address" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="send" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoFocus />
            <div className="flex gap-2">
              <button type="submit" className={smallPrimary} disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </button>
              <button type="button" className={smallButton} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
        {sentTo && (
          <div className="grid gap-3">
            <p className="text-[14px] text-ink-2">
              We sent a 6-digit code to <strong className="font-semibold text-ink">{sentTo}</strong>.
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
  const { api } = useAccount();
  const stepUp = useStepUp();
  const { busy, error, run } = useAction();
  const [removing, setRemoving] = useState<string | null>(null);
  const full = view.passkeys.length >= view.maxPasskeys;
  const add = () =>
    void run(async () => {
      const key = await api.security.addPasskey(defaultPasskeyName());
      onChange({ ...view, passkeys: [...view.passkeys, key] });
    });
  return (
    <Card
      id="passkeys"
      title="Passkeys"
      description="Sign in with your fingerprint, face or device PIN instead of a code. Nobody can phish a passkey."
      action={
        <button type="button" className={smallPrimary} onClick={add} disabled={busy || full}>
          <KeyIcon aria-hidden className="size-4" /> {busy ? "Waiting for your device…" : "Add a passkey"}
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
              detail={`Added ${ago(p.created)} · Last used ${ago(p.lastUsed)}`}
              trailing={
                <button type="button" className={smallButton} onClick={() => setRemoving(p.id)}>
                  Remove
                </button>
              }
            />
          ))}
        </Rows>
      ) : (
        <Empty>No passkey yet. Add one and signing in takes a touch instead of an e-mail code.</Empty>
      )}
      {full && <p className="mt-3 text-[13px] text-ink-3">You have the most passkeys an account can keep ({view.maxPasskeys}). Remove one to add another.</p>}
      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}
      <Confirm
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove this passkey?"
        description="That device can no longer sign you in with it. You can always sign in with a code by e-mail."
        confirmLabel="Remove passkey"
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

function defaultPasskeyName(): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const system = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Linux/.test(ua) ? "Linux" : "this device";
  return `Passkey on ${system}`;
}

function DevicesCard({ view, onChange }: { view: AccountView; onChange: (v: AccountView) => void }) {
  const { api } = useAccount();
  const stepUp = useStepUp();
  const [removing, setRemoving] = useState<number | null>(null);
  return (
    <Card id="devices" title="Launchers" description="Every PC where the launcher is signed in to your account.">
      {view.devices.length ? (
        <Rows>
          {view.devices.map((d) => (
            <Row
              key={d.id}
              icon={<ComputerDesktopIcon className="size-5" strokeWidth={1.6} />}
              title={d.name}
              detail={`${PLATFORM[d.platform] ?? d.platform} · Last used ${ago(d.lastUsed)}`}
              trailing={
                <button type="button" className={smallButton} onClick={() => setRemoving(d.id)}>
                  Sign out
                </button>
              }
            />
          ))}
        </Rows>
      ) : (
        <Empty>No launcher is signed in yet.</Empty>
      )}
      <Confirm
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Sign out this launcher?"
        description="It goes offline until someone signs in on that PC again."
        confirmLabel="Sign out launcher"
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
  const { api } = useAccount();
  const router = useRouter();
  const stepUp = useStepUp();
  const [ending, setEnding] = useState<number | null>(null);
  const current = view.sessions.find((s) => s.id === ending)?.current ?? false;
  return (
    <Card id="browsers" title="Browsers" description="Every browser signed in to this account page. We keep no more about them than when they were used.">
      <Rows>
        {view.sessions.map((s) => (
          <Row
            key={s.id}
            icon={<GlobeAltIcon className="size-5" strokeWidth={1.6} />}
            title={s.current ? <>This browser <Badge tone="ok">You are here</Badge></> : "Other browser"}
            detail={`Signed in ${ago(s.created)} · Last used ${ago(s.lastUsed)}`}
            trailing={
              <button type="button" className={smallButton} onClick={() => setEnding(s.id)}>
                Sign out
              </button>
            }
          />
        ))}
      </Rows>
      <Confirm
        open={ending !== null}
        onOpenChange={(o) => !o && setEnding(null)}
        title={current ? "Sign out of this browser?" : "Sign out that browser?"}
        description={current ? "You go back to the start and sign in again next time." : "It has to sign in again to open your account."}
        confirmLabel="Sign out"
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
  const { api } = useAccount();
  const router = useRouter();
  const stepUp = useStepUp();
  const [open, setOpen] = useState(false);
  return (
    <Card
      title="Sign out everywhere"
      description="Every launcher and every browser, this one too. Use it when a device was lost or someone else might have signed in."
      action={
        <button type="button" className={smallDanger} onClick={() => setOpen(true)}>
          Sign out everywhere
        </button>
      }
    >
      <Confirm
        open={open}
        onOpenChange={setOpen}
        title="Sign out everywhere?"
        description="Every launcher and browser is signed out at once, this one too."
        confirmLabel="Sign out everywhere"
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

const PARTS: { part: PrivacyKey; title: string; detail: string }[] = [
  { part: "trophies", title: "Trophies", detail: "Your trophy counts and what you earned" },
  { part: "playtime", title: "Playtime", detail: "How long you played, per game" },
  { part: "about", title: "About", detail: "The line on your profile" },
  { part: "favourites", title: "Favourite games", detail: "Up to three games you pin" },
  { part: "avatar", title: "Picture", detail: "Your profile picture" },
];

export function PrivacyPage() {
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
      <PageTitle title="Privacy" lead="Who sees your profile and your activity. Your handle is always visible, so friends can find you." />
      <div className="grid gap-6">
        <Card title="Your profile" description="Changes count at once, in the launcher too.">
          <Rows>
            {PARTS.map((p) => (
              <Row key={p.part} title={p.title} detail={p.detail} trailing={<AudiencePicker label={`Who sees: ${p.title}`} value={data[p.part]} disabled={saving === p.part} onChange={(a) => void set(p.part, a)} />} />
            ))}
          </Rows>
          {problem && problem.part !== "feed" && (
            <div className="mt-4">
              <FormError>{problem.text}</FormError>
            </div>
          )}
        </Card>
        <Card title="Your activity" description="What you do on AnyPlay, as your friends see it in their feed.">
          <Rows>
            <Row
              title="Activity"
              detail="Friends see it in their feed. Strangers see no feed. Only me hides what is there and stops new items."
              trailing={<AudiencePicker label="Who sees: Activity" value={data.feed === "everyone" ? "friends" : data.feed} only={["friends", "nobody"]} disabled={saving === "feed"} onChange={(a) => void set("feed", a)} />}
            />
          </Rows>
          {problem?.part === "feed" && (
            <div className="mt-4">
              <FormError>{problem.text}</FormError>
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}

/* ───────────────────────────── Connections ───────────────────────────── */

const RESULT: Record<string, { tone: "ok" | "warn"; text: (name: string) => string }> = {
  linked: { tone: "ok", text: (n) => `${n} is linked to your account.` },
  denied: { tone: "warn", text: (n) => `${n} was not linked: the request was declined there.` },
  expired: { tone: "warn", text: (n) => `Linking ${n} took too long. Start again.` },
  fresh: { tone: "warn", text: (n) => `Linking ${n} needs a recent sign-in. Start again and confirm it's you.` },
  taken: { tone: "warn", text: (n) => `That ${n} account is already linked to another AnyPlay account.` },
  exists: { tone: "warn", text: (n) => `You already have a ${n} account linked. Unlink it first.` },
  failed: { tone: "warn", text: (n) => `Linking ${n} failed. Try again in a minute.` },
};

export function ConnectionsPage() {
  const { api } = useAccount();
  const params = useSearchParams();
  const load = useCallback(() => api.links.list(), [api]);
  const { data, error, reload, setData } = useLoad<LinkedAccount[]>(load);
  const provider = params.get("link") as LinkProvider | null;
  const result = params.get("result");
  const notice = provider && result && RESULT[result] && BRAND[provider] ? { tone: RESULT[result].tone, text: RESULT[result].text(BRAND[provider].name) } : null;
  if (error) return <Failed message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div>
      <PageTitle title="Connections" lead="Link the accounts you already play with, so friends can find you and see where else you are." />
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
          <span className="block text-[13px] text-ink-3">Linked {ago(link.linkedAt)}</span>
        </span>
        <span className="flex flex-wrap items-center gap-3">
          <AudiencePicker
            label={`Who sees your ${brand.name} account`}
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
            Unlink
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
        {busy ? "Opening…" : `Link ${brand.name}`}
      </button>
    );
  } else {
    body = <Badge>Soon</Badge>;
  }
  return (
    <section aria-label={brand.name} className="flex flex-wrap items-center gap-5 rounded-[22px] bg-[#141312] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white/[0.05]" style={{ color: brand.color }}>
        <BrandLogo provider={link.provider} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] font-semibold">{brand.name}</h2>
        {!link.linked && <p className="text-[13px] text-ink-3">{LINKING_OPEN.has(link.provider) && link.available ? "Not linked" : "Linking arrives soon"}</p>}
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
        title={`Unlink ${brand.name}?`}
        description={`Your ${brand.name} account no longer shows on your profile. You can link it again any time.`}
        confirmLabel={`Unlink ${brand.name}`}
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
      <PageTitle title="Your data" lead="Everything AnyPlay keeps about you is yours: take a copy, or delete the account." />
      <div className="grid gap-6">
        <Card
          title="Download your data"
          description="Your account, profile, friends, trophies, playtime and linked accounts, as one JSON file."
          action={
            <button type="button" className={smallPrimary} onClick={download} disabled={exporting.busy}>
              <ArrowDownTrayIcon aria-hidden className="size-4" /> {exporting.busy ? "Preparing…" : "Download"}
            </button>
          }
        >
          {exporting.error && <FormError>{exporting.error}</FormError>}
        </Card>

        {data.deletion ? (
          <Card title="Deletion scheduled" description={`Your account and everything in it will be deleted on ${date(data.deletion.at)}. Until then you can keep it.`}>
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
              Keep my account
            </button>
          </Card>
        ) : (
          <Card
            title="Delete your account"
            description="Your account is deleted after 30 days; until then you can change your mind. After that it is gone, with your friends, trophies and playtime."
            action={
              <button type="button" className={smallDanger} onClick={() => setDeleting(true)}>
                Delete account
              </button>
            }
          />
        )}
      </div>
      <Confirm
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete your account?"
        description={<>It is deleted in 30 days. Every launcher and browser is signed out now.</>}
        confirmLabel="Delete account"
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
