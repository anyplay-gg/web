// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { m } from "@anyplay/ui/motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "../landing/header";
import { Toast, launcherFont } from "../landing/launcher-ui";
import { LINKS } from "../landing/links";
import { useSite } from "../site-context";
import { LandingProviders, WhenVisible } from "../landing/providers";
import { DitherField } from "../landing/shaders";

/**
 * The frame of the sign-in pages, in the landing's language: on a wide screen the left half is the
 * dithered field with the promise and a few of the launcher's own toasts arriving, the right half
 * holds the form. On a phone only the form shows, under the wordmark. The art is decorative.
 * `toasts={false}` leaves the made-up toasts out, for a page about something real (an invitation
 * must not sit next to a player who is "online" only in the picture).
 */
export function AuthShell({ children, toasts = true }: { children: ReactNode; toasts?: boolean }) {
  const t = useTranslations("auth.shell");
  const legal = useTranslations("common.legal");
  const { discord } = useSite();
  return (
    <LandingProviders>
      <div className="night grid min-h-dvh bg-bg text-ink lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <aside aria-hidden className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block">
          <WhenVisible className="absolute inset-0 opacity-80 [mask-image:radial-gradient(120%_90%_at_30%_100%,black_25%,transparent_75%)]">
            <DitherField className="size-full" />
          </WhenVisible>
          <span className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_15%,rgb(11_10_9/0.85),transparent)]" />
          <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
            <span className="display max-w-[12ch] pt-24 text-[clamp(2.75rem,1.2rem+3vw,4.25rem)] leading-[1.04] [overflow-wrap:anywhere]">
              {t.rich("promise", {
                accent: (chunks) => (
                  <span className="-mb-[0.16em] inline-block bg-linear-to-b from-[#ffb487] to-[#ff7a3d] bg-clip-text pb-[0.16em] text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </span>
            {toasts && (
              <div className={`grid justify-items-start gap-3 text-white ${launcherFont}`}>
                {(
                  [
                    ["userCircle", t("toastOnline")],
                    ["users", t("toastParty")],
                    ["trophyFill", t("toastTrophy")],
                  ] as const
                ).map(([icon, text], i) => (
                  <m.div
                    key={icon}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", duration: 0.6, bounce: 0.2, delay: 0.5 + i * 0.35 }}
                    style={{ marginInlineStart: i * 28 }}
                  >
                    <Toast icon={icon}>{text}</Toast>
                  </m.div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-dvh flex-col px-[max(var(--gutter),env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <header className="mx-auto flex min-h-20 w-full max-w-[400px] items-center justify-between gap-4 lg:max-w-none">
            <Link href="/" aria-label={t("home")} className="-mx-2 inline-flex min-h-11 shrink-0 items-center rounded-full px-2">
              <Wordmark />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center rounded-full px-3 py-1.5 text-end text-[14px] text-ink-2 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
            >
              {t("back")}
            </Link>
          </header>
          <main id="main" className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[400px] pb-8 text-[13px] text-ink-3">
            {discord && (
              <p>
                {t("help")}{" "}
                <a href={discord} className="inline-flex min-h-11 items-center text-ink-2 underline-offset-4 [@media(hover:hover)]:hover:underline">
                  {t("helpLink")}
                </a>
              </p>
            )}
            <nav aria-label={legal("nav")}>
              <ul className="flex flex-wrap gap-x-6">
                {(
                  [
                    ["legal", LINKS.legal],
                    ["privacy", LINKS.privacy],
                    ["terms", LINKS.terms],
                  ] as const
                ).map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="inline-flex min-h-11 items-center py-1 text-ink-2 underline-offset-4 [@media(hover:hover)]:hover:underline">
                      {legal(label)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </footer>
        </div>
      </div>
    </LandingProviders>
  );
}
