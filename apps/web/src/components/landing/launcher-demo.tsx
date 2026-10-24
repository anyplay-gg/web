// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { AnimatePresence, m, useInView } from "@anyplay/ui/motion";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import { CoverArt, CoverTile, GAMES } from "./covers";
import { ACCENT, Avatar, Caption, Glyph, Keycap, Panel, Row, Toast, launcherFont } from "./launcher-ui";
import { useStill } from "./providers";

/**
 * The launcher's home screen, laid out on its own 1600 by 900 dp grid (the gallery's size) and scaled
 * to fit, with a library of invented games (covers.tsx), playing a short story on a loop: a friend
 * comes online, the player starts a party, two friends join, the game starts, a trophy lands and the
 * trophy list opens on it. Off screen it pauses where it is; with reduced motion it shows the party,
 * standing still. Decorative: the page says all of it in words.
 */

export const W = 1600;
export const H = 900;

/** How long each step of the story holds, in ms. */
const HOLD = [1900, 1800, 1700, 1700, 2800, 2600, 4200];

const settle = { type: "spring", duration: 0.5, bounce: 0 } as const;
const pop = { type: "spring", duration: 0.55, bounce: 0.22 } as const;

export function LauncherDemo({ className = "" }: { className?: string }) {
  const still = useStill();
  const ref = useRef<HTMLDivElement>(null);
  const at = useRef(0);
  const inView = useInView(ref, { margin: "120px" });
  const [playing, setStep] = useState(0);
  const scale = useFit(ref, W);

  useEffect(() => {
    if (still || !inView) return;
    let timer = 0;
    const tick = () => {
      at.current = (at.current + 1) % HOLD.length;
      setStep(at.current);
      timer = window.setTimeout(tick, HOLD[at.current]);
    };
    timer = window.setTimeout(tick, HOLD[at.current]);
    return () => clearTimeout(timer);
  }, [still, inView]);

  const step = still ? 4 : playing;
  const panelOpen = step >= 2 && step <= 4;
  const members = step >= 4 ? 3 : step >= 3 ? 2 : 1;
  const toast =
    step === 1
      ? { icon: "userCircle" as const, text: "mira is online" }
      : step === 3
        ? { icon: "users" as const, text: "mira joined your party" }
        : step === 4
          ? { icon: "users" as const, text: "kit joined your party" }
          : null;

  return (
    <div
      ref={ref}
      aria-hidden
      className={`relative aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-[#0f030a] shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_0_0_9px_#0c0b0a,0_0_0_10px_rgb(255_255_255/0.07),0_60px_140px_-40px_rgb(255_90_31/0.45)] ${className}`}
    >
      <div className={`absolute top-0 left-0 origin-top-left text-white ${launcherFont}`} style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <Home unread={step >= 1 && step <= 4 ? 1 : 0} members={members} playing={step >= 5} drift={inView} />

        {/* The online panel, over a scrim */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <m.span
              key="scrim"
              className="absolute inset-0 bg-black/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
          {panelOpen && (
            <m.div
              key="panel"
              className="absolute inset-y-0 right-0 w-[560px]"
              initial={{ opacity: 0, x: 70 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={settle}
            >
              <HomePage members={members} />
            </m.div>
          )}
        </AnimatePresence>

        {/* Toast, top centre */}
        <div className="absolute top-[26px] left-1/2 -translate-x-1/2">
          <AnimatePresence initial={false} mode="wait">
            {toast && (
              <m.div
                key={toast.text}
                initial={{ opacity: 0, y: -24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.16 } }}
                transition={pop}
              >
                <Toast icon={toast.icon}>{toast.text}</Toast>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* The trophy list, over everything but the banner */}
        <AnimatePresence initial={false}>
          {step === 6 && (
            <m.div
              key="trophies"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <TrophyList />
            </m.div>
          )}
        </AnimatePresence>

        {/* Trophy banner, top centre */}
        <div className="absolute top-[14px] left-1/2 -translate-x-1/2">
          <AnimatePresence initial={false}>
            {step === 5 && (
              <m.div
                key="trophy"
                initial={{ opacity: 0, y: -150 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40, transition: { duration: 0.3 } }}
                transition={{ ...pop, delay: 0.5 }}
              >
                <TrophyBanner />
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** Scale a screen drawn `base` wide to the width it gets. */
export function useFit(ref: RefObject<HTMLDivElement | null>, base: number) {
  const [scale, setScale] = useState(0.7);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setScale(e.contentRect.width / base);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, base]);
  return scale;
}

/** The home screen under everything else: artwork, top bar, library, hero and hints. */
export function Home({
  unread = 0,
  members = 1,
  playing = false,
  drift = false,
}: {
  unread?: number;
  members?: number;
  playing?: boolean;
  /** Whether the artwork drifts; only while the screen is on the page's screen. */
  drift?: boolean;
}) {
  return (
    <>
      <Backdrop drift={drift} />
      <TopBar unread={unread} />
      <TileRow />
      <Hero playing={playing} members={members} />
      <Hints />
    </>
  );
}

/**
 * The selected game's artwork, filling the window and drifting from 1.01 to 1.07 about the top right
 * over 24 s (DESIGN.md 5.2), under the two scrims that keep the text readable.
 */
function Backdrop({ drift }: { drift: boolean }) {
  return (
    <>
      <CoverArt game={0} wide className={`absolute inset-0 size-full ${drift ? "artwork-drift" : ""}`} />
      <span className="absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/0.78)_0%,rgb(0_0_0/0.35)_50%,transparent_85%)]" />
      <span className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.55)_0%,transparent_30%,transparent_55%,rgb(0_0_0/0.85)_100%)]" />
    </>
  );
}

function TopBar({ unread }: { unread: number }) {
  return (
    <div className="absolute top-[34px] right-[64px] left-[64px] flex h-[44px] items-center">
      <p className="text-[24px] font-semibold">Games</p>
      <div className="ml-auto flex items-center gap-8">
        <div className="flex items-center gap-3">
          <IconButton>
            <Glyph name="squaresFour" className="size-5" />
          </IconButton>
          <IconButton>
            <Glyph name="gear" className="size-5" />
          </IconButton>
        </div>
        <span className="flex h-[44px] items-center gap-2.5 rounded-full pr-[18px] pl-1">
          <span className="relative">
            <Avatar name="riley" size={36} />
            <span className="absolute -right-[2px] -bottom-[2px] size-[8px] rounded-full ring-[3px] ring-[#24060f]" style={{ background: ACCENT }} />
          </span>
          <span className="text-[16px] font-medium text-white/90">riley</span>
          {unread > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-white text-[12px] font-bold text-[#141414]">{unread}</span>
          )}
        </span>
        <span className="text-[20px] font-medium text-white/92 tabular-nums">21:47</span>
      </div>
    </div>
  );
}

function IconButton({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-[44px] place-items-center rounded-full bg-white/[0.10] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
      {children}
    </span>
  );
}

function TileRow() {
  return (
    <>
      <CoverTile
        game={0}
        className="absolute top-[112px] left-[64px] size-[176px] rounded-[21px] shadow-[0_14px_32px_rgb(0_0_0/0.3)] outline-[3px] outline-offset-[1.8px] outline-white/95 outline-solid"
      />
      {GAMES.slice(1).map((g, i) => (
        <CoverTile
          key={g.title}
          game={i + 1}
          className="absolute top-[141px] size-[118px] rounded-[14px] shadow-[0_10px_24px_rgb(0_0_0/0.26)]"
          style={{ left: 266 + i * 134 }}
        />
      ))}
    </>
  );
}

function Hero({ playing, members }: { playing: boolean; members: number }) {
  return (
    <div className="absolute top-[578px] left-[64px]">
      <p className="flex h-5 items-center gap-1.5 text-[15px] font-medium text-white/70">
        <Glyph name="checkCircleFill" className="size-[14px]" />
        {members > 1 ? `Ready to play · party of ${members}` : "Ready to play"}
      </p>
      <p className="mt-[6px] text-[58px] leading-[1.15] font-light tracking-[-0.01em]">{GAMES[0]!.title}</p>
      <div className="mt-[22px] flex items-center gap-3">
        <span
          className={`inline-flex h-[54px] w-[210px] items-center justify-center gap-2.5 rounded-[14px] text-[20px] font-semibold transition-[background-color,color,scale,box-shadow] duration-[220ms] ${
            playing
              ? "scale-[1.05] bg-white text-black shadow-[0_0_30px_rgb(255_255_255/0.12)]"
              : "bg-white/[0.26] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
          }`}
        >
          <Glyph name="playFill" className="size-[17px]" /> Play
        </span>
        <span className="inline-flex h-[54px] items-center gap-2 rounded-[14px] bg-white/[0.10] px-[28px] text-[20px] font-semibold tabular-nums shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
          <Glyph name="trophyFill" className="size-[18px]" /> {playing ? "9/34" : "8/34"}
        </span>
        <span className="grid size-[54px] place-items-center rounded-[14px] bg-white/[0.10] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
          <Glyph name="dotsThree" className="size-[24px]" />
        </span>
      </div>
      <div className="mt-[38px] flex gap-12">
        <Fact label="Size" value="10.1 GB" />
        <Fact label="Version" value="01.000.011" />
        <Fact label="Played" value="12 h" />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-[13px] font-semibold tracking-[0.05em] text-white/55 uppercase">{label}</span>
      <span className="mt-[4px] block text-[17px] font-semibold tabular-nums">{value}</span>
    </span>
  );
}

function Hints() {
  return (
    <div className="absolute right-[64px] bottom-[25px] flex items-center gap-7 text-[15px] font-medium text-white/72">
      {[
        ["Enter", "Select"],
        ["Esc", "Back"],
        ["O", "Options"],
      ].map(([k, l]) => (
        <span key={k} className="flex items-center gap-2">
          <Keycap>{k}</Keycap> {l}
        </span>
      ))}
    </div>
  );
}

/** The online panel's home page, as the launcher lays it out (DESIGN.md 17). */
function HomePage({ members }: { members: number }) {
  const party = members > 1;
  return (
    <Panel className="h-full" title="riley" subtitle="Online">
      <AnimatePresence initial={false} mode="wait">
        {party ? (
          <m.div key="party" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={settle}>
            <Caption>Party</Caption>
            <Row
              focused
              icon="users"
              title={members >= 3 ? "riley, mira, kit" : "riley, mira"}
              detail={`${members} of 8 members`}
              chevron
            />
          </m.div>
        ) : (
          <m.div key="start" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <Row focused icon="users" title="Start a Party" />
          </m.div>
        )}
      </AnimatePresence>
      <Row icon="envelopeSimple" title="Messages" detail={party ? "1 unread" : "Talk to your friends"} chevron />
      <Caption>Friends</Caption>
      <Row icon="gameController" title="kit" detail={members >= 3 ? "In your party" : `Playing ${GAMES[0]!.title} · You can join`} chevron />
      <Row icon="userCircle" title="mira" detail={party ? "In your party" : "Online"} chevron />
      <Row icon="userCircle" title="noor" detail="Online" chevron />
      <Row icon="userPlus" title="Add a Friend" chevron />
    </Panel>
  );
}

/** Trophy grade colours (DESIGN.md 1.2). */
const GRADE = { platinum: "#bdd6f7", gold: "#f7c757", silver: "#ccd1db", bronze: "#d48c5c" } as const;
type Grade = keyof typeof GRADE;

/** A trophy's icon: art of the invented game, or a glow in the grade's colour. Greyed when not earned. */
function TrophyIcon({ size, grade, art, earned = true }: { size: number; grade: Grade; art?: number; earned?: boolean }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: size * 0.18, filter: earned ? undefined : "grayscale(1)", opacity: earned ? 1 : 0.45 }}
    >
      {art !== undefined ? (
        <CoverArt game={art} className="absolute inset-0 size-full" />
      ) : (
        <span className="absolute inset-0" style={{ background: `radial-gradient(80% 80% at 30% 25%, ${GRADE[grade]}, #2a1a12)` }} />
      )}
      <Glyph name="trophyFill" className="drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]" style={{ position: "relative", color: "#fff", width: size * 0.36, height: size * 0.36 }} />
    </span>
  );
}

/**
 * The trophy banner (DESIGN.md 5.14): a 480 wide card, gray 18 at 0.94, radius 20, a one-pixel stroke
 * from the grade's colour down to white, a glow behind the icon that swells and settles, and the icon
 * popping in 0.18 s after the card. The trophy is invented, like the game.
 */
export function TrophyBanner({ grade = "gold" }: { grade?: Grade }) {
  const c = GRADE[grade];
  return (
    <div
      className="w-[480px] rounded-[20px] p-px"
      style={{ background: `linear-gradient(to bottom, ${c}8c, rgb(255 255 255 / 0.08))`, boxShadow: "0 8px 36px rgb(0 0 0 / 0.5)" }}
    >
      <div className="relative flex items-center gap-4 overflow-hidden rounded-[19px] bg-[rgb(18_18_18/0.94)] p-[14px] backdrop-blur-xl">
        <m.span
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/[0.08] to-transparent"
          initial={{ x: "0%" }}
          animate={{ x: "520%" }}
          transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.45 }}
        />
        <span className="relative grid size-[64px] place-items-center">
          <m.span
            className="absolute inset-0 rounded-full blur-[14px]"
            style={{ background: c }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0.3] }}
            transition={{ duration: 1.4, times: [0, 0.4, 1], delay: 0.18 }}
          />
          <m.span
            className="relative"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.35, delay: 0.18 }}
          >
            <TrophyIcon size={60} grade={grade} art={0} />
          </m.span>
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: c }}>
            <Glyph name="trophyFill" className="size-3.5" /> Trophy earned
          </span>
          <span className="mt-1 block truncate text-[19px] font-semibold">Into the Ember</span>
          <span className="mt-1 block truncate text-[13px] text-white/60">Finish a drift as the sun goes down.</span>
        </span>
        <Glyph name="trophyFill" className="mr-1.5 size-[26px]" style={{ position: "relative", color: c }} />
      </div>
    </div>
  );
}

type Trophy = {
  name: string;
  text: string;
  grade: Grade;
  art?: number;
  earned?: string;
  progress?: [number, number];
  hidden?: boolean;
  focused?: boolean;
};

const TROPHIES: Trophy[] = [
  { name: "Into the Ember", text: "Finish a drift as the sun goes down.", grade: "gold", art: 0, earned: "Today at 9:47 PM", focused: true },
  { name: "Side by Side", text: "Finish a race with a friend in your party.", grade: "silver", earned: "Oct 22, 2026 at 11:02 PM" },
  { name: "Warm Tyres", text: "Drive your first lap.", grade: "bronze", earned: "Oct 19, 2026 at 8:15 PM" },
  { name: "Long Way Home", text: "Drive 50 kilometres across the canyon.", grade: "silver", progress: [23, 50] },
  { name: "Hidden Trophy", text: "Keep playing to find out.", grade: "gold", hidden: true },
];

/** The trophy list overlay (DESIGN.md 5.11): the set with its percent and counts per grade, then the trophies. */
function TrophyList() {
  return (
    <div className="absolute inset-0 bg-black/74 backdrop-blur-xl">
      <div className="px-[90px] pt-[70px]">
        <div className="flex items-center gap-[26px]">
          <CoverTile game={0} className="relative block size-[112px] rounded-[20px] shadow-[0_10px_30px_rgb(0_0_0/0.4)]" />
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold tracking-[0.06em] text-white/55 uppercase">Trophies</p>
            <p className="text-[36px] leading-none font-light">{GAMES[0]!.title}</p>
            <div className="flex items-center gap-4">
              <span className="text-[22px] font-semibold tabular-nums">26%</span>
              <span className="h-[6px] w-[260px] overflow-hidden rounded-full bg-white/16">
                <m.span
                  className="block h-full rounded-full"
                  style={{ background: ACCENT }}
                  initial={{ width: "22%" }}
                  animate={{ width: "26%" }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                />
              </span>
              {(
                [
                  ["gold", "2/5"],
                  ["silver", "3/9"],
                  ["bronze", "4/19"],
                ] as const
              ).map(([g, n]) => (
                <span key={g} className="flex items-center gap-1.5 text-[15px] font-semibold text-white/85 tabular-nums">
                  <Glyph name="trophyFill" className="size-4" style={{ color: GRADE[g] }} /> {n}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-[34px] flex flex-col gap-[10px]">
          {TROPHIES.map((t, i) => (
            <m.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.1 + i * 0.05 }}
              className={`flex items-center gap-5 rounded-[16px] p-[14px] ${
                t.focused ? "bg-white/[0.13] outline-2 outline-offset-[3.2px] outline-white/95 outline-solid" : "bg-white/[0.05]"
              }`}
            >
              {t.hidden ? (
                <span className="grid size-[68px] shrink-0 place-items-center rounded-[12px] bg-white/[0.07]">
                  <Glyph name="lock" className="size-[22px] opacity-50" />
                </span>
              ) : (
                <TrophyIcon size={68} grade={t.grade} art={t.art} earned={!!t.earned} />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-[18px] font-semibold ${t.earned ? "" : "text-white/80"}`}>{t.name}</span>
                <span className="mt-0.5 block text-[14px] text-white/60">{t.text}</span>
                {t.progress && (
                  <span className="mt-2 flex items-center gap-2 text-[13px] text-white/60 tabular-nums">
                    <span className="h-1 w-[180px] overflow-hidden rounded-full bg-white/16">
                      <span className="block h-full rounded-full" style={{ width: `${(t.progress[0] / t.progress[1]) * 100}%`, background: ACCENT }} />
                    </span>
                    {t.progress[0]}/{t.progress[1]}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span
                  className="flex items-center justify-end gap-1.5 text-[14px] font-semibold capitalize"
                  style={{ color: GRADE[t.grade], opacity: t.earned ? 1 : 0.55 }}
                >
                  <Glyph name="trophyFill" className="size-4" /> {t.grade}
                </span>
                <span className={`mt-1 block text-[13px] ${t.earned ? "text-white/70" : "text-white/40"}`}>{t.earned ?? "Not earned"}</span>
              </span>
            </m.div>
          ))}
        </div>
      </div>
    </div>
  );
}
