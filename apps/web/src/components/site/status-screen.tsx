// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode, Ref } from "react";

/**
 * The frame of the pages that say something went wrong or something is missing: the night ground,
 * the wordmark, one heading and the way out. No providers, no router and no hooks, so it also
 * renders inside global-error.tsx, where the layout (and with it every provider) is gone. Plain
 * anchors only: after a crash a full page load is the safer way home.
 */
export function StatusScreen({
  title,
  headingRef,
  children,
}: {
  title: string;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <div className="night relative min-h-dvh overflow-x-clip bg-bg text-ink">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_90_31/0.14),transparent)]"
      />
      <div className="relative flex min-h-dvh flex-col px-[max(var(--gutter),env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <header className="mx-auto flex min-h-20 w-full max-w-[1120px] items-center">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router here: global-error.tsx renders without one */}
          <a href="/" aria-label="AnyPlay, home" className="-mx-2 inline-flex min-h-11 items-center rounded-full px-2">
            <span className="display text-[20px] leading-none tracking-[-0.03em]">
              Any<span className="text-brand">Play</span>
            </span>
          </a>
        </header>
        <main id="main" className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center pb-24">
          <div className="grid max-w-[34rem] justify-items-start gap-4">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="display text-balance text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05] outline-none"
            >
              {title}
            </h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/** The paragraph under the heading. */
export function StatusText({ children }: { children: ReactNode }) {
  return <p className="text-[16px] leading-[1.6] text-ink-2 text-pretty">{children}</p>;
}

/** The row of actions; 12px between controls. */
export function StatusActions({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-wrap items-center gap-3">{children}</div>;
}
