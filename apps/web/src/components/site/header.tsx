// SPDX-License-Identifier: AGPL-3.0-only
import { ButtonLink } from "@anyplay/ui/button";
import Link from "next/link";
import { Mark } from "@/brand/mark";
import { Wordmark } from "@/brand/wordmark";
import type { Direction } from "@/components/network-map/styles";
import { LINKS } from "./copy";

const navLink =
  "hidden min-h-11 items-center rounded-control px-3 text-small font-medium text-ink-2 transition-colors duration-[var(--duration-quick)] sm:inline-flex [@media(hover:hover)]:hover:text-ink";

/** The header of the public site. The wordmark links home; "Sign in" is the one quiet button. */
export function SiteHeader({ direction, className = "" }: { direction: Direction; className?: string }) {
  return (
    <header className={`mx-auto flex w-full max-w-[var(--content-max)] items-center justify-between px-[var(--gutter)] py-4 ${className}`}>
      <Link href="/" aria-label="AnyPlay, home" className="-mx-2 flex items-center gap-3 rounded-control px-2 py-2 text-ink">
        <Mark direction={direction} size={26} className="text-brand-text" />
        <Wordmark direction={direction} title="AnyPlay" className="h-[22px] w-auto" />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
        <a href={LINKS.source} className={navLink}>
          Source
        </a>
        <a href={LINKS.launcher} className={navLink}>
          Launcher
        </a>
        <ButtonLink href={LINKS.signIn} variant="secondary">
          Sign in
        </ButtonLink>
      </nav>
    </header>
  );
}
