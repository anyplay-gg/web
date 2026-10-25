// SPDX-License-Identifier: AGPL-3.0-only
import { Fragment } from "react";
import { ArrowRightIcon, CodeBracketIcon, LockClosedIcon, ServerStackIcon } from "@heroicons/react/20/solid";
import { DownloadMenu } from "./download-button";
import { Header, Wordmark } from "./header";
import { HeroField, TiltIn } from "./hero";
import { LauncherDemo } from "./launcher-demo";
import { LINKS } from "./links";
import { LandingProviders, WhenVisible } from "./providers";
import { latestDownloads } from "./release";
import { DitherField, SunField } from "./shaders";
import { Story } from "./story";
import { Terminal } from "./terminal";
import { Together } from "./together";

/**
 * The public landing. Night palette (the launcher's black, warmed), one accent, one wide face for
 * headlines, pill buttons. It reads top to bottom as one story: the promise over a dithered field that
 * answers the pointer, the launcher itself playing a short scene, how to start, that it is yours to
 * run, and a dithered sun to close. Shaders are Paper Shaders (Apache-2.0), mounted only
 * near the viewport; icons are Heroicons (MIT).
 */

const pill =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold whitespace-nowrap select-none transition-[background-color,color,scale,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] active:duration-[var(--duration-press)]";
const pillLight = `${pill} bg-[#f6f5f1] text-[#161513] shadow-[inset_0_-1px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.4),0_10px_30px_-10px_rgb(255_90_31/0.45)] [@media(hover:hover)]:hover:bg-white`;
/** The navbar's button: the same light pill, sized for a 56 high bar. */
const pillSmall =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#f6f5f1] px-3.5 text-[14px] font-semibold whitespace-nowrap text-[#161513] select-none transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] [@media(hover:hover)]:hover:bg-white";
const pillGlass = `${pill} bg-white/[0.06] text-[#f6f5f1] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.1)] backdrop-blur-md [@media(hover:hover)]:hover:bg-white/[0.1]`;

/** The headline, word by word. The last word carries the gradient and is padded below, so the gradient reaches its descender. */
const HEADLINE = ["Play", "your", "games", "together."];

const OPEN = [
  { icon: CodeBracketIcon, title: "Open source", text: "The launcher, the network and the cloud are public code." },
  { icon: ServerStackIcon, title: "Run your own", text: "Host a cloud for your friends with one compose file." },
  { icon: LockClosedIcon, title: "Your data", text: "Export everything or delete your account whenever you like." },
] as const;

export async function Landing() {
  const downloads = await latestDownloads();
  return (
    <LandingProviders>
      <div className="night min-h-dvh overflow-x-clip bg-bg text-ink">
        <a
          href="#main"
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-full bg-[#f6f5f1] px-4 py-2 text-[14px] font-semibold text-[#161513] transition-transform duration-[var(--duration-quick)] focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <Header pill={pillSmall} downloads={downloads} />

        <main id="main" tabIndex={-1} className="outline-none">
          <section className="relative">
            <HeroField className="absolute inset-x-0 top-0 h-[min(118dvh,1100px)] opacity-85" />
            <div className="relative mx-auto flex w-full max-w-[1160px] flex-col items-center px-[var(--gutter)] pt-[clamp(9rem,15vw,12.5rem)] text-center">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-[clamp(7rem,12vw,10rem)] mx-auto h-[min(36rem,80vw)] max-w-[60rem] bg-[radial-gradient(closest-side,rgb(11_10_9/0.7),transparent)]"
              />
              <a
                href={LINKS.releases}
                className="reveal inline-flex items-center gap-2 rounded-full bg-white/[0.05] py-1.5 pr-3 pl-1.5 text-[13px] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] backdrop-blur-md transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
              >
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold tracking-[0.03em] text-[#0b0a09] uppercase">Preview</span>
                See what&rsquo;s new
                <ArrowRightIcon aria-hidden className="size-3.5 text-ink-3" />
              </a>
              <h1 className="display mt-10 max-w-[12ch] text-[clamp(2.75rem,1.2rem+5vw,5.75rem)] leading-[1.04]">
                {HEADLINE.map((w, i) => (
                  <Fragment key={i}>
                    <span
                      className={`word ${i === HEADLINE.length - 1 ? "-mb-[0.16em] bg-linear-to-b from-[#ffb487] to-[#ff7a3d] bg-clip-text pb-[0.16em] text-transparent" : ""}`}
                      style={{ ["--i" as string]: i }}
                    >
                      {w}
                    </span>
                    {i < HEADLINE.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </h1>
              <p
                className="reveal mt-8 max-w-[36rem] text-[clamp(1.0625rem,0.95rem+0.4vw,1.25rem)] leading-[1.6] text-ink-2 text-pretty"
                style={{ ["--d" as string]: "420ms" }}
              >
                Until now, you played your AnyPS5 games alone. AnyPlay brings your friends in: play online together, party up
                and talk, on an open network that anyone can host.
              </p>
              <div className="reveal mt-12 flex flex-wrap items-center justify-center gap-3" style={{ ["--d" as string]: "500ms" }}>
                <DownloadMenu downloads={downloads} className={pillLight} />
                <a href={LINKS.createAccount} className={pillGlass}>
                  Create an account
                </a>
              </div>
            </div>

            {/* The launcher, playing a short scene, rising flat as the page scrolls. */}
            <div className="relative mx-auto mt-[clamp(4.5rem,9vw,7rem)] w-full max-w-[1280px] px-[var(--gutter)] pb-[clamp(5rem,10vw,8rem)]">
              <span
                aria-hidden
                className="pointer-events-none absolute top-[6%] left-1/2 h-[70%] w-[90%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_90_31/0.32),transparent)]"
              />
              <div className="reveal" style={{ ["--d" as string]: "640ms" }}>
                <TiltIn>
                  <LauncherDemo />
                </TiltIn>
              </div>
            </div>
          </section>

          <Together />

          <div className="py-[clamp(4rem,8vw,6rem)] md:py-0">
            <Story />
          </div>

          {/* Open by default, over a dithered field, with the three commands that start a cloud. */}
          <section aria-labelledby="open" className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] pb-[clamp(5rem,9vw,8rem)]">
            <div className="relative overflow-hidden rounded-[32px] bg-[#0d0c0b] text-[#f6f5f1] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),0_30px_80px_-40px_rgb(0_0_0/0.7)]">
              <WhenVisible className="absolute inset-y-0 right-0 h-full w-full opacity-40 [mask-image:linear-gradient(to_left,black_15%,transparent_75%)] md:w-[70%] md:opacity-70">
                <DitherField className="size-full" />
              </WhenVisible>
              <div className="relative grid gap-12 p-[clamp(1.75rem,5vw,4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:items-center">
                <div>
                  <h2 id="open" className="display max-w-[14ch] text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] leading-[1.04]">
                    Yours to run
                  </h2>
                  <p className="mt-4 max-w-[30rem] text-[17px] leading-[1.6] text-[#bdbab3] text-pretty">
                    No platform owns AnyPlay. Use our cloud, or host your own for your friends.
                  </p>
                  <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-3">
                    {OPEN.map((o) => (
                      <li key={o.title} className="border-t border-white/12 pt-5">
                        <o.icon aria-hidden className="size-5 text-[#ff9a6b]" />
                        <h3 className="mt-3 text-[16px] font-semibold">{o.title}</h3>
                        <p className="mt-1.5 text-[14px] leading-[1.6] text-[#a8a59f] text-pretty">{o.text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 flex flex-wrap gap-3">
                    <a href={LINKS.selfHost} className={pillLight}>
                      Host your own cloud
                    </a>
                    <a href={LINKS.github} className={pillGlass}>
                      Read the code
                    </a>
                  </div>
                </div>
                <Terminal />
              </div>
            </div>
          </section>

          {/* The close: a dithered sun rising behind the last call. */}
          <section aria-labelledby="ready" className="relative overflow-hidden">
            <WhenVisible className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_45%)]">
              <SunField className="size-full" />
            </WhenVisible>
            <div className="relative mx-auto flex w-full max-w-[1160px] flex-col items-center px-[var(--gutter)] pt-[clamp(4rem,8vw,6rem)] pb-[clamp(12rem,26vw,20rem)] text-center">
              <h2 id="ready" className="display text-[clamp(2.25rem,1.4rem+3vw,4rem)] leading-[1.02]">
                Ready to play together?
              </h2>
              <p className="mt-4 text-[17px] text-ink-2">Download the launcher, sign in, and your friends are one click away.</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <DownloadMenu downloads={downloads} className={pillLight} />
                <a href={LINKS.discord} className={pillGlass}>
                  Join the Discord
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="relative border-t border-line bg-bg">
          <div className="mx-auto grid w-full max-w-[1160px] gap-10 px-[var(--gutter)] py-14 md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-12 lg:gap-16">
            <div>
              <Wordmark />
              <p className="mt-3 max-w-[22rem] text-[14px] leading-[1.6] text-ink-3">
                Open source on GitHub. Not affiliated with any console maker.
              </p>
            </div>
            <FooterColumn
              title="Product"
              links={[
                ["Download", LINKS.download],
                ["Release notes", LINKS.releases],
                ["Self-hosting", LINKS.selfHost],
              ]}
            />
            <FooterColumn
              title="Community"
              links={[
                ["Discord", LINKS.discord],
                ["GitHub", LINKS.github],
              ]}
            />
            <FooterColumn
              title="Account"
              links={[
                ["Sign in", LINKS.signIn],
                ["Create an account", LINKS.createAccount],
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                ["Privacy notice", LINKS.privacy],
                ["Terms of use", LINKS.terms],
              ]}
            />
          </div>
        </footer>
      </div>
    </LandingProviders>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="text-[14px] text-ink-3 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
