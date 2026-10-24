// SPDX-License-Identifier: AGPL-3.0-only
import { Avatar, Glyph, launcherFont } from "./launcher-ui";
import type { PhosphorName } from "./phosphor";

/**
 * The point of AnyPlay in one picture: two PCs, one game, connected. Until now a game run with AnyPS5
 * was a game for one; with AnyPlay two players are in the same session, directly or through a relay.
 * The picture is decorative (the words beside it say the same); the packets crossing the line are
 * constant motion, so they run linear and stop for reduced motion.
 */

const POINTS: { icon: PhosphorName; title: string; text: string }[] = [
  { icon: "gameController", title: "Join from the launcher", text: "See which friends are playing and join their game in one step." },
  { icon: "users", title: "Bring your party", text: "Take everyone in your party into your game at once." },
  { icon: "cloud", title: "Connected either way", text: "Directly when your networks allow it, through a relay when they don't." },
];

export function Together() {
  return (
    <section aria-labelledby="together" className="mx-auto w-full max-w-[1160px] px-[var(--gutter)] pb-[clamp(5rem,10vw,8rem)]">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20">
        <div>
          <p className="font-mono text-[13px] tracking-[0.04em] text-brand-text uppercase">Online play</p>
          <h2 id="together" className="display mt-4 max-w-[14ch] text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] leading-[1.06]">
            No more playing alone
          </h2>
          <p className="mt-6 max-w-[32rem] text-[17px] leading-[1.65] text-ink-2 text-pretty">
            Join a friend&rsquo;s game from the launcher or invite them into yours. AnyPlay connects your PCs over the internet
            and keeps your party together while you play.
          </p>
          <ul className="mt-10 grid gap-6">
            {POINTS.map((p) => (
              <li key={p.title} className="grid grid-cols-[40px_1fr] gap-4">
                <span className="grid size-10 place-items-center rounded-[12px] bg-brand/12 text-brand-text shadow-[inset_0_0_0_1px_rgb(255_90_31/0.25)]">
                  <Glyph name={p.icon} className="size-5" />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold">{p.title}</span>
                  <span className="mt-1 block text-[15px] leading-[1.55] text-ink-2 text-pretty">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className={`relative overflow-hidden rounded-[28px] bg-[#100d0c] p-[clamp(1.25rem,3vw,2.25rem)] text-white shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_40px_100px_-40px_rgb(255_90_31/0.35)] ${launcherFont}`}
        >
          <span className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_90_31/0.22),transparent)]" />
          <div className="relative grid grid-cols-2 items-center gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-5">
            <Player name="riley" where="Your PC" />
            <div className="col-span-2 row-start-2 flex flex-col items-center gap-2 sm:col-span-1 sm:row-start-auto">
              <span className="relative block h-[2px] w-[clamp(3rem,10vw,7rem)] overflow-hidden rounded-full bg-white/12">
                <span className="packet absolute inset-y-0 left-0 w-1/3 rounded-full bg-linear-to-r from-transparent via-[#ff8066] to-transparent" />
              </span>
              <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-white/80 tabular-nums">
                Direct · 18 ms
              </span>
              <span className="relative block h-[2px] w-[clamp(3rem,10vw,7rem)] overflow-hidden rounded-full bg-white/12">
                <span className="packet packet-back absolute inset-y-0 left-0 w-1/3 rounded-full bg-linear-to-r from-transparent via-[#ff8066] to-transparent" />
              </span>
            </div>
            <Player name="mira" where="mira's PC" />
          </div>

          <div className="relative mt-7 rounded-[16px] bg-white/[0.05] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <p className="px-1 text-[13px] font-semibold text-white/55">Playing Together</p>
            <div className="mt-2 grid gap-2">
              <Line who="riley" state="You · Host" />
              <Line who="mira" state="Direct" />
              <Line who="kit" state="Through a relay" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Player({ name, where }: { name: string; where: string }) {
  return (
    <div className="min-w-0 rounded-[18px] bg-white/[0.06] p-[clamp(0.75rem,2vw,1.25rem)] text-center shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
      <span className="mx-auto block w-fit">
        <Avatar name={name} size={48} />
      </span>
      <p className="mt-3 truncate text-[16px] font-semibold">{name}</p>
      <p className="truncate text-[12px] text-white/55">{where}</p>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff8066]/15 px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-[#ffb3a0]">
        <Glyph name="gameController" className="size-3.5" /> Playing
      </p>
    </div>
  );
}

function Line({ who, state }: { who: string; state: string }) {
  return (
    <div className="flex min-h-[46px] items-center gap-3 rounded-[12px] bg-white/[0.06] px-4">
      <Glyph name="gameController" className="size-[17px] text-white/80" />
      <span className="text-[15px] font-medium">{who}</span>
      <span className="ml-auto text-[13px] text-white/55">{state}</span>
    </div>
  );
}
