// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { Menu } from "@anyplay/ui/menu";
import { useMotionValueEvent, useScroll } from "@anyplay/ui/motion";
import { Bars3Icon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useState } from "react";
import { DownloadMenu } from "./download-button";
import { LINKS } from "./links";
import type { Downloads } from "./release";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display text-[20px] leading-none tracking-[-0.03em] ${className}`}>
      Any<span className="text-brand">Play</span>
    </span>
  );
}

const navLink =
  "inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center rounded-full px-3 text-[14px] text-ink-2 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink";

/**
 * At the top of the page the header is only the wordmark, the links and the button over the hero.
 * Once the page moves, a glass pill fades in under them so they stay readable over whatever scrolls
 * past. Only the pill's opacity and scale change; the links never move.
 */
export function Header({ pill, downloads }: { pill: string; downloads: Downloads }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header className="fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-30 px-[max(0.75rem,env(safe-area-inset-left))] sm:top-[calc(1rem+env(safe-area-inset-top))]">
      <div className="relative mx-auto flex h-14 w-full max-w-[1040px] items-center justify-between pr-2 pl-5">
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full bg-[#141312]/72 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),inset_0_1px_0_rgb(255_255_255/0.08),0_10px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-150 transition-[opacity,scale] duration-[var(--duration-enter)] ease-[var(--ease-out)] ${scrolled ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"}`}
        />
        <Link href="/" aria-label="AnyPlay, home" className="relative -mx-2 inline-flex min-h-11 items-center rounded-full px-2">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="relative hidden items-center md:flex">
          <a href={LINKS.releases} className={navLink}>
            Launcher
          </a>
          <a href={LINKS.selfHost} className={navLink}>
            Self-hosting
          </a>
          <a href={LINKS.github} className={navLink}>
            GitHub
          </a>
          <a href={LINKS.discord} className={navLink}>
            Discord
          </a>
        </nav>
        <div className="relative flex items-center gap-1">
          <a href={LINKS.signIn} className={`${navLink} max-sm:hidden`}>
            Sign in
          </a>
          <DownloadMenu downloads={downloads} size="sm" className={pill} />
          <PhoneMenu />
        </div>
      </div>
    </header>
  );
}

const PHONE_LINKS: [string, string][] = [
  ["Launcher", LINKS.releases],
  ["Self-hosting", LINKS.selfHost],
  ["GitHub", LINKS.github],
  ["Discord", LINKS.discord],
  ["Sign in", LINKS.signIn],
];

/** Below the width where the links fit, they move into a menu behind one button. */
function PhoneMenu() {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label="Menu"
        className="ml-1 grid size-9 [@media(pointer:coarse)]:size-11 place-items-center rounded-full bg-white/[0.06] text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[background-color,scale] duration-[var(--duration-quick)] active:scale-[0.96] md:hidden [@media(hover:hover)]:hover:bg-white/[0.1]"
      >
        <Bars3Icon aria-hidden className="size-[18px]" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={10} className="z-40">
          <Menu.Popup className="night w-[220px] origin-[var(--transform-origin)] rounded-[20px] bg-[#151311]/94 p-1.5 text-[#f6f5f1] shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_24px_60px_-12px_rgb(0_0_0/0.75)] backdrop-blur-2xl transition-[opacity,scale] duration-[180ms] ease-[var(--ease-out)] outline-none data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0">
            {PHONE_LINKS.map(([label, href]) => (
              <Menu.LinkItem
                key={label}
                href={href}
                closeOnClick
                className="flex min-h-11 items-center rounded-[14px] px-3.5 text-[15px] font-medium outline-none select-none data-[highlighted]:bg-white/[0.08]"
              >
                {label}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
