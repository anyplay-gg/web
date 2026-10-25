// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "../landing/header";
import { LINKS } from "../landing/links";
import { LegalLinks } from "./links";
import { LEGAL } from "./meta";

/**
 * The frame and the parts of the two legal texts: a title with a short summary, the date of the last
 * change, a list of the sections (beside the text on a wide screen, above it on a phone) and the
 * sections themselves. Long-form reading, so it is plain: the night palette of the site, one column of
 * about 70 characters, no motion.
 */

export type Contents = { id: string; title: string }[];

const link = "text-brand-text underline decoration-1 underline-offset-4";

export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:/.test(href) || href.startsWith("mailto:");
  return external ? (
    <a href={href} className={link}>
      {children}
    </a>
  ) : (
    <Link href={href} className={link}>
      {children}
    </Link>
  );
}

export function Mail({ kind = "contact" }: { kind?: "contact" | "privacy" | "abuse" }) {
  const address = LEGAL[kind];
  return <A href={`mailto:${address}`}>{address}</A>;
}

/** The operator's name and postal address, as the legal notice, the privacy notice and the terms print them. */
export function Operator() {
  const o = LEGAL.operator;
  return (
    <address className="text-[16px] leading-[1.6] text-ink-2 not-italic">
      <Strong>{o.name}</Strong>
      <br />
      {o.street}
      <br />
      {o.city}
      <br />
      {o.country}
    </address>
  );
}

export function LegalPage({
  title,
  lead,
  summary,
  contents,  current,
  mail = "contact",
  children,
}: {
  title: string;
  lead: string;
  summary?: ReactNode[];
  contents: Contents;  current: "legal" | "privacy" | "terms";
  /** Which address the line at the foot names. */
  mail?: "contact" | "privacy";
  children: ReactNode;
}) {
  return (
    <div className="night min-h-dvh bg-bg text-ink">
      <a
        href="#main"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-full bg-[#f6f5f1] px-4 py-2 text-[14px] font-semibold text-[#161513] transition-transform duration-[var(--duration-quick)] focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <header className="mx-auto flex h-20 w-full max-w-[1160px] items-center justify-between px-[var(--gutter)]">
        <Link href="/" aria-label="AnyPlay, home" className="-mx-2 rounded-full px-2 py-1">
          <Wordmark />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center rounded-full px-3 text-[14px] text-ink-2 transition-[color] duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
        >
          Back to the start
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <div className="mx-auto grid w-full max-w-[1160px] gap-x-20 px-[var(--gutter)] pt-8 pb-24 lg:grid-cols-[13rem_minmax(0,36rem)] lg:pt-14">
          <div className="lg:col-start-2 lg:row-start-1">
            <h1 className="display text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05] text-balance">{title}</h1>
            <p className="mt-4 text-[17px] leading-[1.6] text-ink-2 text-pretty">{lead}</p>
            <p className="mt-4 text-[14px] text-ink-3">
              Last changed <time dateTime={LEGAL.changed}>{LEGAL.changedText}</time>. Version {LEGAL.version}.
            </p>
            {summary && (
              <section
                aria-labelledby="short"
                className="mt-10 rounded-[24px] bg-[#141312] p-6 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),inset_0_1px_0_rgb(255_255_255/0.05)]"
              >
                <h2 id="short" className="text-[17px] font-semibold tracking-[-0.01em]">
                  In short
                </h2>
                <ul className="mt-4 grid gap-3 text-[16px] leading-[1.6] text-ink-2">
                  {summary.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand" />
                      <span className="text-pretty">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <nav
            aria-label="Sections"
            className="mt-12 lg:sticky lg:top-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-start"
          >
            <p className="text-[13px] font-semibold text-ink">On this page</p>
            <ol className="mt-3 grid">
              {contents.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center text-[14px] leading-[1.35] text-ink-3 transition-[color] duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-4 lg:col-start-2 lg:row-start-2">
            {children}
            <p className="mt-16 text-[15px] leading-[1.6] text-ink-2">
              Questions about this text: <Mail kind={mail} />. The source of this website is public on{" "}
              <A href={LINKS.github}>GitHub</A>.
            </p>
          </div>
        </div>
      </main>
      <LegalLinks current={current} />
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 scroll-mt-8 border-t border-line pt-10">
      <h2 id={id} className="text-[22px] leading-[1.25] font-semibold tracking-[-0.015em] text-balance">
        {title}
      </h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[16px] leading-[1.6] text-ink-2">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="grid list-disc gap-2 ps-5 text-[16px] leading-[1.6] text-ink-2 marker:text-ink-3">{children}</ul>;
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="grid list-decimal gap-2 ps-6 text-[16px] leading-[1.6] text-ink-2 marker:text-ink-3">{children}</ol>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

export type Fact = { what: string; why: ReactNode; basis: ReactNode; keep: ReactNode };

/**
 * Each kind of data as one block: what it is, then why, on what basis and how long. A table of four
 * columns does not fit a phone, and this reads the same at every width.
 */
export function Facts({ items }: { items: Fact[] }) {
  return (
    <ul className="mt-2 grid gap-3">
      {items.map((f) => (
        <li
          key={f.what}
          className="rounded-[20px] bg-[#141312] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),inset_0_1px_0_rgb(255_255_255/0.05)]"
        >
          <h3 className="text-[16px] leading-[1.4] font-semibold">{f.what}</h3>
          <dl className="mt-3 grid gap-3 text-[15px] leading-[1.6]">
            {(
              [
                ["What and why", f.why],
                ["Basis", f.basis],
                ["How long", f.keep],
              ] as const
            ).map(([term, text]) => (
              <div key={term} className="grid gap-0.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-[13px] leading-[1.9] text-ink-3">{term}</dt>
                <dd className="text-pretty text-ink-2">{text}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
