// SPDX-License-Identifier: AGPL-3.0-only
import { ButtonLink } from "@anyplay/ui/button";
import { NetworkMap } from "@/components/network-map/network-map";
import { HERO, LINKS } from "@/components/site/copy";
import { SiteHeader } from "@/components/site/header";
import { Legend } from "@/components/site/legend";
import { Proof } from "@/components/site/proof";

/**
 * Direction A, Signal. A night page and one light source: the map fills the screen, and the words
 * sit in the dark side of it. The headline is a claim you can check ("a network you can read"),
 * because the source is public. Cyan appears only where something connects: routes, relays, the
 * primary button.
 */
export function HeroA() {
  const t = HERO.a;
  return (
    <div data-direction="a" className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-bg">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(1100px 720px at 76% 42%, color-mix(in oklab, var(--ap-brand) 11%, var(--ap-bg)), var(--ap-bg) 68%)",
        }}
      />
      <>
        <NetworkMap direction="a" className="absolute inset-0 -z-10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-28" style={{ background: "linear-gradient(var(--ap-bg), transparent)" }} />
        <SiteHeader direction="a" className="relative z-10" />
        <main className="relative z-10 mx-auto flex w-full max-w-[var(--content-max)] flex-1 flex-col justify-between px-[var(--gutter)] pt-10 pb-8 sm:pt-[9vh]">
          <div className="max-w-[44rem]">
            <p className="reveal font-mono text-micro font-medium tracking-[0.08em] text-ink-2 uppercase" style={{ ["--d" as string]: "0ms" }}>
              {t.eyebrow}
            </p>
            <h1
              className="reveal mt-5 max-w-[12ch] font-display text-display font-bold text-balance text-ink"
              style={{ ["--d" as string]: "40ms", fontVariationSettings: '"wght" 700' }}
            >
              {t.title}
            </h1>
            <p className="reveal mt-6 max-w-[34ch] text-lead text-ink-2 text-pretty" style={{ ["--d" as string]: "120ms" }}>
              {t.lead}
            </p>
            <div className="reveal mt-9 flex flex-wrap gap-3" style={{ ["--d" as string]: "190ms" }}>
              <ButtonLink href={LINKS.launcher} variant="primary">
                {t.primary}
              </ButtonLink>
              <ButtonLink href={LINKS.source} variant="secondary">
                {t.secondary}
              </ButtonLink>
            </div>
          </div>
          <div className="mt-12 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <Proof className="hidden sm:grid lg:max-w-[46rem]" />
            <Legend direction="a" className="max-w-[24rem] justify-self-start lg:justify-self-end" />
          </div>
        </main>
      </>
    </div>
  );
}
