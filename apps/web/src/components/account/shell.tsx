// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { PortalApi, SessionView } from "@anyplay/api-client";
import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  CircleStackIcon,
  EyeIcon,
  HomeIcon,
  LinkIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadApi } from "@/lib/api";
import { Wordmark } from "../landing/header";
import { LandingProviders } from "../landing/providers";
import { LegalLinks } from "../legal/links";
import { StepUpProvider } from "./ui";

/**
 * The frame of the account pages: it checks the session once, sends a signed-out visitor to the
 * sign-in page, and holds the client and the session for the pages. Navigation is a column on a
 * wide screen and a row of tabs on a phone; the current page is marked with aria-current.
 */

type Account = { api: PortalApi; session: SessionView; refresh: () => Promise<void> };
const AccountContext = createContext<Account | null>(null);

export function useAccount(): Account {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount outside the account shell");
  return value;
}

const NAV = [
  { href: "/account", label: "Overview", icon: HomeIcon },
  { href: "/account/profile", label: "Profile", icon: UserCircleIcon },
  { href: "/account/friends", label: "Friends", icon: UsersIcon },
  { href: "/account/trophies", label: "Trophies", icon: TrophyIcon },
  { href: "/account/security", label: "Security", icon: ShieldCheckIcon },
  { href: "/account/notifications", label: "Notifications", icon: BellIcon },
  { href: "/account/privacy", label: "Privacy", icon: EyeIcon },
  { href: "/account/connections", label: "Connections", icon: LinkIcon },
  { href: "/account/data", label: "Your data", icon: CircleStackIcon },
] as const;

export function AccountShell({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<PortalApi | null>(null);
  const [session, setSession] = useState<SessionView | null>(null);
  const [failed, setFailed] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const strip = useRef<HTMLUListElement>(null);

  // On a phone the tabs scroll sideways: bring the current one into view, so the person never has to
  // hunt for where they are. It centres without animating, because it happens on every navigation.
  useEffect(() => {
    const current = strip.current?.querySelector<HTMLElement>("[aria-current=page]");
    if (!current || !strip.current) return;
    const list = strip.current;
    list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
  }, [path, api]);

  useEffect(() => {
    let alive = true;
    loadApi()
      .then(async (a) => {
        const s = await a.session();
        if (!alive) return;
        if (!s.signedIn) {
          window.location.replace("/sign-in");
          return;
        }
        setApi(a);
        setSession(s);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (api) setSession(await api.session());
  }, [api]);

  const signOut = async () => {
    try {
      await api?.auth.signOut();
    } finally {
      router.replace("/");
    }
  };

  return (
    <LandingProviders>
      <div className="night relative min-h-dvh overflow-x-clip bg-bg text-ink">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_90_31/0.14),transparent)]"
        />
        <header className="relative mx-auto flex min-h-20 w-full max-w-[1120px] items-center justify-between px-[max(var(--gutter),env(safe-area-inset-left))] pt-[env(safe-area-inset-top)]">
          <Link href="/" aria-label="AnyPlay, home" className="-mx-2 inline-flex min-h-11 items-center rounded-full px-2">
            <Wordmark />
          </Link>
          {session?.account && (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2.5 rounded-full bg-white/[0.05] py-1 pr-3.5 pl-1 text-[14px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] sm:flex">
                <Initial handle={session.account.handle} size={28} />
                {session.account.handle}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] text-ink-2 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
              >
                <ArrowRightStartOnRectangleIcon aria-hidden className="size-[18px]" />
                Sign out
              </button>
            </div>
          )}
        </header>

        <div className="relative mx-auto w-full max-w-[1120px] pb-[calc(6rem+env(safe-area-inset-bottom))] lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 lg:px-[var(--gutter)] lg:pt-6">
          {/* A phone gets one row of tabs that sticks under the notch while the page scrolls; the
              edges fade out, which is the hint that more tabs wait past them. */}
          <nav
            aria-label="Account"
            className="sticky top-0 z-20 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:static lg:bg-transparent lg:pt-0 lg:backdrop-blur-none"
          >
            <ul
              ref={strip}
              className="flex gap-1 overflow-x-auto overscroll-x-contain px-[max(var(--gutter),env(safe-area-inset-left))] py-1.5 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,transparent,black_var(--gutter),black_calc(100%-var(--gutter)),transparent)] lg:sticky lg:top-8 lg:flex-col lg:overflow-visible lg:px-0 lg:py-0 [&::-webkit-scrollbar]:hidden"
            >
              {NAV.map(({ href, label, icon: Icon }) => {
                const current = href === "/account" ? path === href : path.startsWith(href);
                return (
                  <li key={href} className="shrink-0">
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`relative flex h-11 items-center gap-3 rounded-[12px] px-3.5 text-[14px] lg:h-10 lg:px-3 font-medium whitespace-nowrap transition-colors duration-[var(--duration-quick)] ${
                        current ? "bg-white/[0.07] text-ink" : "text-ink-3 [@media(hover:hover)]:hover:bg-white/[0.04] [@media(hover:hover)]:hover:text-ink"
                      }`}
                    >
                      {current && <span aria-hidden className="absolute top-2.5 bottom-2.5 -left-px hidden w-[3px] rounded-full bg-brand lg:block" />}
                      <Icon aria-hidden className="size-[18px]" strokeWidth={1.6} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main id="main" className="min-w-0 px-[max(var(--gutter),env(safe-area-inset-left))] pt-6 lg:px-0 lg:pt-0">
            {failed ? (
              <div role="alert" className="text-ink-2">
                Can’t reach AnyPlay. Check your connection and{" "}
                <button type="button" className="text-brand-text underline" onClick={() => window.location.reload()}>
                  try again
                </button>
                .
              </div>
            ) : api && session ? (
              <AccountContext.Provider value={{ api, session, refresh }}>
                <StepUpProvider api={api}>{children}</StepUpProvider>
              </AccountContext.Provider>
            ) : (
              <div aria-busy role="status" className="grid gap-4">
                <span className="sr-only">Loading</span>
                <span className="h-10 w-1/2 animate-pulse rounded-[12px] bg-white/[0.06]" />
                <span className="h-40 w-full animate-pulse rounded-[24px] bg-white/[0.04]" />
                <span className="h-40 w-full animate-pulse rounded-[24px] bg-white/[0.04]" />
              </div>
            )}
            <LegalLinks frame="max-w-none px-0" className="mt-16" />
          </main>
        </div>
      </div>
    </LandingProviders>
  );
}

/** The player's initial on the launcher's accent, as the launcher draws the avatar. */
export function Initial({ handle, size = 40 }: { handle: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44), background: "linear-gradient(135deg, #ff8066, rgb(255 128 102 / 0.55))" }}
    >
      {handle[0]?.toUpperCase()}
    </span>
  );
}
