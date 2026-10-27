// SPDX-License-Identifier: AGPL-3.0-only
import { readSite } from "@/lib/site";
import { Footer } from "../landing/footer";
import { Header } from "../landing/header";
import { LINKS } from "../landing/links";
import { pillGlass, pillSmall } from "../landing/pills";
import { LandingProviders } from "../landing/providers";
import { latestDownloads } from "../landing/release";
import { FileList } from "./file-list";
import { dayLabel } from "./files";
import { Looks } from "./looks";
import { PrimaryDownload } from "./primary";

/**
 * The download page: the launcher's current release as it is on GitHub. One button for the visitor's
 * system, every file with its size under it, how to check them, then what 0.3.5 brings and what
 * happens after the install. Nothing here is a screenshot or a claim the release does not make.
 */

const NEW = [
  {
    title: "Played With Recently",
    text: "Friends lists the people you shared a party or a game with in the last 30 days, so adding one takes a single step. Only you see it, you can turn it off or clear it any time, and people you block never show up.",
  },
  {
    title: "A calmer language choice",
    text: "Choosing a language is a plain list of names. The language you point at shows the page in it right away. The launcher speaks English, Türkçe, Deutsch, Español, Français and Português.",
  },
  {
    title: "Still when you ask",
    text: "With Animations set to Reduced, every look holds still and loading indicators pulse gently instead of spinning.",
  },
] as const;

const STEPS = [
  { title: "Install and open the launcher", text: "From then on it offers updates by itself, on Windows, Linux and the Mac." },
  { title: "Sign in", text: "The launcher opens your browser. Make an account or sign in, and you are back in the launcher, online." },
  { title: "Add your friends", text: "Send a request by name. Once they accept, you see when they are online and what they play." },
] as const;

export async function DownloadPage() {
  const { discord } = readSite();
  const downloads = await latestDownloads();
  const day = dayLabel(downloads.published);

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
          <section className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] pt-[clamp(8rem,13vw,11rem)] pb-[clamp(3.5rem,7vw,6rem)]">
            <p className="reveal font-mono text-[13px] tracking-[0.04em] text-brand-text uppercase">
              {downloads.version ? `Launcher ${downloads.version}` : "Launcher"}
              {day ? ` · ${day}` : ""}
            </p>
            <h1 className="display reveal mt-5 max-w-[14ch] text-[clamp(2.5rem,1.2rem+5vw,5rem)] leading-[1.04] text-balance" style={{ ["--d" as string]: "60ms" }}>
              Get the launcher
            </h1>
            <p
              className="reveal mt-6 max-w-[34rem] text-[clamp(1.0625rem,0.95rem+0.4vw,1.25rem)] leading-[1.6] text-ink-2 text-pretty"
              style={{ ["--d" as string]: "120ms" }}
            >
              Free and open source. Install it, sign in, and your friends are one click away.
            </p>
            <div className="reveal mt-10" style={{ ["--d" as string]: "180ms" }}>
              <PrimaryDownload downloads={downloads} />
            </div>
          </section>

          <section id="files" aria-labelledby="files-title" className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] pb-[clamp(4rem,8vw,7rem)]">
            <h2 id="files-title" className="display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.06]">
              All downloads
            </h2>
            <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-ink-2 text-pretty">
              Every file goes straight to the release on GitHub.
            </p>
            {!downloads.live && (
              <p
                role="status"
                className="mt-6 max-w-[34rem] rounded-[16px] bg-surface-2 px-4 py-3 text-[14px] leading-[1.55] text-ink-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] text-pretty"
              >
                GitHub did not answer just now, so sizes and the version are missing. These buttons open the latest release, where every file is listed.
              </p>
            )}
            <div className="mt-8">
              <FileList downloads={downloads} />
            </div>
            <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              <div>
                <h3 className="text-[16px] font-semibold">Check what you got</h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-2 text-pretty">
                  Every release lists SHA-256 checksums for its files. Updates inside the launcher are signed, so it only installs what we published.
                </p>
                <p className="mt-3 flex flex-wrap gap-x-6">
                  <a href={downloads.checksums.href} className={textLink}>
                    SHA256SUMS.txt
                  </a>
                  <a href={downloads.page} className={textLink}>
                    Release notes
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold">Read the code</h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-2 text-pretty">
                  The launcher is open source. Build it yourself, or see exactly what it does on your computer.
                </p>
                <p className="mt-3">
                  <a href={LINKS.launcherCode} className={textLink}>
                    Launcher on GitHub
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="new-title" className="border-t border-line">
            <div className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] py-[clamp(4rem,8vw,7rem)]">
              <p className="font-mono text-[13px] tracking-[0.04em] text-brand-text uppercase">New in 0.3.5</p>
              <h2 id="new-title" className="display mt-4 max-w-[16ch] text-[clamp(1.75rem,1.2rem+2.4vw,3.25rem)] leading-[1.06] text-balance">
                Six looks, three of them new
              </h2>
              <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-ink-2 text-pretty">
                Pick one in Settings under Appearance, or on the first start. Ember, Tide and Daylight move; the pictures here stand still.
              </p>
              <div className="mt-10">
                <Looks />
              </div>
              <ul className="mt-16 grid gap-x-10 gap-y-8 md:grid-cols-3">
                {NEW.map((n) => (
                  <li key={n.title} className="border-t border-line-strong/40 pt-5">
                    <h3 className="text-[16px] font-semibold">{n.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-ink-2 text-pretty">{n.text}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-[14px] leading-[1.6] text-ink-3">Share play in the party room is on its way.</p>
            </div>
          </section>

          <section aria-labelledby="after-title" className="border-t border-line">
            <div className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] py-[clamp(4rem,8vw,7rem)]">
              <h2 id="after-title" className="display max-w-[16ch] text-[clamp(1.75rem,1.2rem+2.4vw,3.25rem)] leading-[1.06] text-balance">
                After the install
              </h2>
              <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="border-t border-line-strong/40 pt-5">
                    <span className="tnum font-mono text-[13px] text-brand-text">0{i + 1}</span>
                    <h3 className="mt-2 text-[16px] font-semibold">{s.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-ink-2 text-pretty">{s.text}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={LINKS.createAccount} className={pillGlass}>
                  Create an account
                </a>
                {discord && (
                  <a href={discord} className={pillGlass}>
                    Join the Discord
                  </a>
                )}
              </div>
              <p className="mt-12 max-w-[40rem] text-[14px] leading-[1.6] text-ink-3 text-pretty">
                AnyPlay does not include or provide games. You play the games you own, run through AnyPS5, a compatibility layer and never an emulator.
                See <a href={LINKS.compatibility} className={textLink}>how games run</a>.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </LandingProviders>
  );
}

const textLink =
  "inline-flex min-h-11 items-center text-[14px] font-medium text-ink underline decoration-ink-3 underline-offset-4 [text-decoration-skip-ink:auto] transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:decoration-ink";
