// SPDX-License-Identifier: AGPL-3.0-only
import { ButtonLink } from "@anyplay/ui/button";
import { Wordmark } from "@/brand/wordmark";
import { NetworkMap } from "@/components/network-map/network-map";
import { HERO, LINKS } from "@/components/site/copy";
import { SiteHeader } from "@/components/site/header";
import { Legend } from "@/components/site/legend";
import { Proof } from "@/components/site/proof";

/**
 * Direction C, Dither. Type leads. The wordmark runs the full width at the bottom of the screen,
 * wide "Any" and narrow "Play", in the one flat raspberry. The network behind it is drawn as light
 * quantised to a single colour with a Bayer matrix, the way a console screen once drew a glow:
 * the same scene as the other directions, rendered rough on purpose.
 */
export function HeroC() {
  const t = HERO.c;
  return (
    <div data-direction="c" className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-bg">
      <>
        <NetworkMap direction="c" className="absolute inset-0 -z-10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-28" style={{ background: "linear-gradient(var(--ap-bg), transparent)" }} />
        <SiteHeader direction="c" className="relative z-10" />
        <main className="relative z-10 mx-auto flex w-full max-w-[var(--content-max)] flex-1 flex-col justify-between px-[var(--gutter)] pt-8 sm:pt-[5vh]">
          <div className="max-w-[40rem]">
            <p className="reveal font-mono text-micro font-medium tracking-[0.08em] text-ink-2 uppercase" style={{ ["--d" as string]: "0ms" }}>
              {t.eyebrow}
            </p>
            <h1
              className="reveal mt-5 max-w-[12ch] font-display text-poster font-extrabold text-balance text-ink"
              style={{ ["--d" as string]: "40ms", fontStretch: "118%" }}
            >
              {t.title}
            </h1>
            <p className="reveal mt-6 max-w-[34ch] text-lead text-ink-2 text-pretty" style={{ ["--d" as string]: "120ms" }}>
              {t.lead}
            </p>
            <div className="reveal mt-8 flex flex-wrap gap-3" style={{ ["--d" as string]: "190ms" }}>
              <ButtonLink href={LINKS.launcher} variant="primary">
                {t.primary}
              </ButtonLink>
              <ButtonLink href={LINKS.source} variant="secondary">
                {t.secondary}
              </ButtonLink>
            </div>
          </div>
          <div className="mt-10 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <Proof className="hidden sm:grid lg:max-w-[46rem]" />
            <Legend direction="c" className="max-w-[24rem] justify-self-start lg:justify-self-end" />
          </div>
          <Wordmark direction="c" title="AnyPlay" className="mt-6 mb-[max(1rem,2.5vh)] block h-auto max-h-[26vh] w-full text-brand" />
        </main>
      </>
    </div>
  );
}
