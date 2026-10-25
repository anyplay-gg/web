// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";
import { LINKS } from "../landing/links";

/**
 * The three legal pages as one strip, for the foot of every page group that has no larger footer.
 * Real links to real pages, so they work without script. `current` marks the page you are on.
 */
const ITEMS = [
  ["legal", "Legal notice", LINKS.legal],
  ["privacy", "Privacy notice", LINKS.privacy],
  ["terms", "Terms of use", LINKS.terms],
] as const;

export function LegalLinks({
  current,
  frame = "max-w-[1160px] px-[var(--gutter)]",
  className = "",
}: {
  current?: (typeof ITEMS)[number][0];
  /** Width and side padding, to line the strip up with the page above it. */
  frame?: string;
  className?: string;
}) {
  return (
    <footer className={`mx-auto w-full ${frame} pb-[calc(2rem+env(safe-area-inset-bottom))] ${className}`}>
    <nav aria-label="Legal">
      <ul className="flex flex-wrap gap-x-6 border-t border-line pt-4 text-[14px]">
        {ITEMS.map(([id, label, href]) => (
          <li key={id}>
            <Link
              href={href}
              aria-current={current === id ? "page" : undefined}
              className="inline-flex min-h-11 items-center text-ink-3 underline-offset-4 transition-[color] duration-[var(--duration-quick)] aria-[current=page]:font-medium aria-[current=page]:text-ink [@media(hover:hover)]:hover:text-ink [@media(hover:hover)]:hover:underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    </footer>
  );
}
