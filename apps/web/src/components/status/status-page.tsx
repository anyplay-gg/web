// SPDX-License-Identifier: AGPL-3.0-only
import Link from "next/link";
import { Wordmark } from "../landing/header";
import { LegalLinks } from "../legal/links";
import { PART_IDS, type Overall, type PartId, type PartState, type Status } from "@/lib/status";

/**
 * The public status page: one sentence about the whole service, then one row per part. It is a plain
 * server-rendered page on the night palette with no motion. The word in each row carries the state;
 * the dot beside it only repeats it.
 */

const HEADLINE: Record<Overall, string> = {
  operational: "All systems operational",
  degraded: "Some parts are down",
  outage: "AnyPlay is down",
  unreachable: "We can’t reach the AnyPlay cloud",
};

const PARTS: Record<PartId, { name: string; what: string }> = {
  api: { name: "Cloud", what: "Sign-in, friends, parties and messages" },
  database: { name: "Database", what: "Where accounts and friend lists are kept" },
  signalling: { name: "Live updates", what: "Presence, invitations and connecting players" },
  relay: { name: "Relay", what: "Carries game traffic when players can’t connect directly" },
  web: { name: "Website", what: "This site and the account pages" },
};

const STATE_WORD: Record<PartState, string> = { up: "Operational", down: "Down", unknown: "Not monitored" };

const DOT: Record<PartState, string> = {
  up: "bg-[#5fd38d]",
  down: "bg-[#ff6b5e]",
  unknown: "bg-ink-3",
};

function overallDot(overall: Overall): string {
  return overall === "operational" ? DOT.up : overall === "degraded" ? "bg-[#f2b84b]" : DOT.down;
}

export function utc(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16) + " UTC";
}

export function StatusPage({ status }: { status: Status }) {
  return (
    <div className="night min-h-dvh bg-bg text-ink">
      <a
        href="#main"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-pill bg-[#f6f5f1] px-4 py-2 text-small font-semibold text-[#161513] transition-transform duration-[var(--duration-quick)] focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <header className="mx-auto flex h-20 w-full max-w-[1160px] items-center justify-between px-[var(--gutter)]">
        <Link href="/" aria-label="AnyPlay, home" className="-mx-2 rounded-pill px-2 py-1">
          <Wordmark />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center rounded-pill px-3 text-small text-ink-2 transition-[color] duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
        >
          Back to the start
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <div className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] pt-8 pb-24 lg:pt-14">
          <div className="max-w-[36rem]">
            <h1 className="display text-[clamp(2rem,1.6rem+1.4vw,2.6rem)] leading-[1.05] text-balance">Status</h1>
            <p className="mt-6 flex items-center gap-3 text-lead font-semibold">
              <span aria-hidden className={`size-3 shrink-0 rounded-full ${overallDot(status.overall)}`} />
              {HEADLINE[status.overall]}
            </p>
            <p className="mt-3 text-small text-ink-3">
              Checked at <time dateTime={new Date(status.checked).toISOString()}>{utc(status.checked)}</time>. The cloud
              checks itself every ten seconds. Reload for the latest.
            </p>

            <section aria-labelledby="parts" className="mt-10">
              <h2 id="parts" className="sr-only">
                Parts of the service
              </h2>
              <ul className="overflow-hidden rounded-surface bg-[#141312] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),inset_0_1px_0_rgb(255_255_255/0.05)]">
                {PART_IDS.map((id) => (
                  <li
                    key={id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 border-t border-line px-6 py-4 first:border-t-0"
                  >
                    <div>
                      <p className="text-body font-semibold">{PARTS[id].name}</p>
                      <p className="text-small text-ink-3 text-pretty">{PARTS[id].what}</p>
                    </div>
                    <p className="flex items-center gap-2 text-small text-ink-2">
                      <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT[status.parts[id]]}`} />
                      {STATE_WORD[status.parts[id]]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <p className="mt-10 text-body text-ink-2 text-pretty">
              Something not working while everything here says operational? Tell us on the community Discord or open an
              issue on GitHub.
            </p>
          </div>
        </div>
      </main>
      <LegalLinks />
    </div>
  );
}
