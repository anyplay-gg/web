// SPDX-License-Identifier: AGPL-3.0-only
import { ButtonLink } from "@anyplay/ui/button";
import { NetworkMap } from "@/components/network-map/network-map";
import { HERO, LINKS } from "@/components/site/copy";
import { SiteHeader } from "@/components/site/header";
import { Legend } from "@/components/site/legend";
import { Proof } from "@/components/site/proof";

/**
 * Direction B, Route. The opposite of a gaming page: a light, cool paper, ink type and a transit
 * map. The network is drawn the way people already read connections, with lines that bend at 45
 * degrees and interchanges where relays are. The map sits in a sheet, like a printed plan, with its
 * key under it. The ember colour is a signal lamp on the routes and the one button.
 */
export function HeroB() {
  const t = HERO.b;
  return (
    <div data-direction="b" className="relative isolate flex min-h-dvh flex-col bg-bg">
      <SiteHeader direction="b" />
      <main className="mx-auto grid w-full max-w-[var(--content-max)] flex-1 items-center gap-10 px-[var(--gutter)] pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pt-2">
        <div>
          <p className="reveal font-mono text-micro font-medium tracking-[0.08em] text-ink-2 uppercase" style={{ ["--d" as string]: "0ms" }}>
            {t.eyebrow}
          </p>
          <h1
            className="reveal mt-5 max-w-[14ch] font-display text-headline font-semibold text-balance text-ink"
            style={{ ["--d" as string]: "40ms", lineHeight: 1.02 }}
          >
            {t.title}
          </h1>
          <p className="reveal mt-6 max-w-[36ch] text-lead text-ink-2 text-pretty" style={{ ["--d" as string]: "120ms" }}>
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
        <figure className="reveal relative" style={{ ["--d" as string]: "160ms" }}>
          <div className="relative aspect-[358/420] overflow-hidden rounded-surface border border-line bg-surface shadow-raised lg:aspect-[860/760]">
            <NetworkMap direction="b" className="absolute inset-0" />
          </div>
          <Legend direction="b" className="mt-3" />
        </figure>
      </main>
      <div className="mx-auto w-full max-w-[var(--content-max)] px-[var(--gutter)] pb-12">
        <Proof className="hidden sm:grid" />
      </div>
    </div>
  );
}
