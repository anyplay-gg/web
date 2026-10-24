// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { AnimatePresence, m, useInView, useMotionValueEvent, useScroll, useSpring } from "@anyplay/ui/motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { H, Home, W, useFit } from "./launcher-demo";
import { Caption, Panel, Row, Toast, VoiceWave, launcherFont } from "./launcher-ui";
import { useStill } from "./providers";

/**
 * How it works, in three steps. On a wide screen the section pins while the visitor scrolls through
 * it: the steps on the left light up one after another and the launcher on the right turns to the
 * page for each. On a narrow screen nothing pins; each step sits above its own page. The pages are the
 * launcher's own (launcher/docs/DESIGN.md, section 17), decorative; the steps say it all in words.
 */

const STEPS = [
  {
    n: "01",
    title: "Create your account",
    text: "Sign in from the launcher. It opens your browser, you pick a name, and you're online.",
  },
  {
    n: "02",
    title: "Add your friends",
    text: "Send a request by name. Once they accept, you see when they're online and what they play.",
  },
  {
    n: "03",
    title: "Party up and play",
    text: "Start a party, talk over voice, and take everyone into your game.",
  },
] as const;

const ease = [0.23, 1, 0.32, 1] as const;

export function Story() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const fill = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.4 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))));

  return (
    <section ref={ref} aria-labelledby="how" className="relative md:h-[300vh]">
      <div className="mx-auto w-full max-w-[1200px] px-[var(--gutter)] md:sticky md:top-0 md:flex md:h-dvh md:items-center md:pt-16">
        <div className="grid w-full gap-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center md:gap-16">
          <div>
            <p className="font-mono text-[13px] tracking-[0.04em] text-brand-text uppercase">How it works</p>
            <h2 id="how" className="display mt-4 max-w-[13ch] text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] leading-[1.06]">
              Three steps to your first party
            </h2>

            {/* Wide screens: one list whose active step follows the scroll. */}
            <ol className="relative mt-12 hidden md:block">
              <span aria-hidden className="absolute top-3 bottom-3 left-[15px] w-px bg-white/10" />
              <m.span aria-hidden className="absolute top-3 bottom-3 left-[15px] w-px origin-top bg-brand" style={{ scaleY: fill }} />
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  aria-current={i === active ? "step" : undefined}
                  className="relative grid grid-cols-[32px_1fr] gap-5 py-5"
                >
                  <span
                    className={`relative z-10 grid size-8 place-items-center rounded-full font-mono text-[12px] transition-colors duration-[var(--duration-enter)] ${i <= active ? "bg-brand text-[#0b0a09]" : "bg-[#1d1b19] text-ink-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]"}`}
                  >
                    {s.n}
                  </span>
                  <span>
                    {/* The steps not in view step back by colour, not opacity, so their text keeps its contrast. */}
                    <span className={`block text-[19px] font-semibold tracking-[-0.01em] transition-colors duration-[var(--duration-enter)] ${i === active ? "text-ink" : "text-ink-3"}`}>
                      {s.title}
                    </span>
                    <span className={`mt-2 block max-w-[28rem] text-[15px] leading-[1.6] text-pretty transition-colors duration-[var(--duration-enter)] ${i === active ? "text-ink-2" : "text-ink-3"}`}>
                      {s.text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Wide screens: the launcher for the active step. */}
          <Preview step={active} crop={900} className="mx-auto hidden aspect-square w-full max-w-[min(100%,78dvh)] md:block" />

          {/* Narrow screens: every step with the panel alone, at a size that stays readable. */}
          <ol className="grid gap-14 md:hidden">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <span className="font-mono text-[12px] text-brand-text">{s.n}</span>
                <span className="mt-1 block text-[19px] font-semibold tracking-[-0.01em]">{s.title}</span>
                <span className="mt-2 block text-[15px] leading-[1.6] text-ink-2 text-pretty">{s.text}</span>
                <Preview step={i} crop={560} className="mt-6 aspect-[560/760] w-full" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const settle = { type: "spring", duration: 0.5, bounce: 0 } as const;

const TOASTS = [
  { at: 1400, icon: "checkCircleFill", text: "Signed in as riley" },
  { at: 1700, icon: "userCircle", text: "You and kit are now friends" },
  { at: 900, icon: "users", text: "kit joined your party" },
] as const;

/**
 * The launcher at the moment of a step: the right `crop` dp of its 1600 by 900 window, so the home
 * screen's artwork and library show beside the online panel, scaled to fit. The panel's page changes
 * with the step; the toast arrives at the top of the home side.
 */
function Preview({ step, crop, className = "" }: { step: number; crop: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useFit(ref, crop);
  // The page and its timers start when the preview is first seen, so a phone visitor sees the story
  // play instead of its end.
  const seen = useInView(ref, { once: true, margin: "-15%" });
  const inView = useInView(ref);
  const home = crop - 560;
  return (
    <div
      ref={ref}
      aria-hidden
      className={`relative overflow-hidden rounded-[28px] bg-[#0f030a] shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_50px_120px_-40px_rgb(255_90_31/0.4)] ${className}`}
    >
      <div className={`absolute top-0 left-0 origin-top-left text-white ${launcherFont}`} style={{ width: crop, height: H, transform: `scale(${scale})` }}>
        <div className="absolute top-0" style={{ left: crop - W, width: W, height: H }}>
          <Home members={step === 2 ? 3 : 1} drift={inView} />
        </div>
        <span className="absolute inset-0 bg-black/35" />
        <AnimatePresence initial={false} mode="wait">
          <m.div
            key={step}
            className="absolute inset-y-0 right-0 w-[560px]"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
            transition={settle}
          >
            {!seen ? null : step === 0 ? <SignInPage /> : step === 1 ? <AddFriendPage /> : <PartyPage />}
          </m.div>
        </AnimatePresence>
        {seen && (
          <div
            className="absolute flex justify-center"
            style={home >= 300 ? { top: 26, left: 0, width: home } : { bottom: 170, left: 0, width: crop }}
          >
            <LaterToast key={step} {...TOASTS[step]!} />
          </div>
        )}
      </div>
    </div>
  );
}

/** A toast that arrives `at` ms after its step opens, and is simply there for reduced motion. */
function LaterToast({ at, icon, text }: (typeof TOASTS)[number]) {
  const still = useStill();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (still) return;
    const t = window.setTimeout(() => setShown(true), at);
    return () => clearTimeout(t);
  }, [still, at]);
  return (
    <AnimatePresence>
      {(shown || still) && (
        <m.div initial={{ opacity: 0, y: -18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", duration: 0.55, bounce: 0.22 }}>
          <Toast icon={icon}>{text}</Toast>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Rows arrive one after another, 50 ms apart, once per page. */
function Rows({ children }: { children: ReactNode[] }) {
  return (
    <>
      {children.map((child, i) => (
        <m.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.08 + i * 0.05 }}>
          {child}
        </m.div>
      ))}
    </>
  );
}

function SignInPage() {
  const still = useStill();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (still) return;
    const t = window.setTimeout(() => setSignedIn(true), 1400);
    return () => clearTimeout(t);
  }, [still]);
  const done = signedIn || still;
  return (
    <Panel className="h-full" title={done ? "riley" : "Online"} subtitle={done ? "Online" : "Play with your friends over the internet"}>
      {done ? (
        <Rows key="in">
          {[
            <Row key="p" focused icon="users" title="Start a Party" />,
            <Row key="m" icon="envelopeSimple" title="Messages" detail="Talk to your friends" chevron />,
            <Caption key="c">Friends</Caption>,
            <Row key="a" icon="userPlus" title="Add a Friend" chevron />,
            <Row key="ac" icon="userCircle" title="Account" chevron />,
          ]}
        </Rows>
      ) : (
        <Rows key="out">
          {[
            <Row key="s" focused icon="signIn" title="Sign In" />,
            <Row key="c" icon="userPlus" title="Create Account" />,
            <Row key="cl" icon="cloud" title="Cloud" detail="AnyPlay" chevron />,
          ]}
        </Rows>
      )}
    </Panel>
  );
}

function AddFriendPage() {
  const still = useStill();
  const [typed, setTyped] = useState(0);
  const name = "kit";
  useEffect(() => {
    if (still) return;
    const timers = [...name].map((_, i) => window.setTimeout(() => setTyped(i + 1), 450 + i * 140));
    return () => timers.forEach(clearTimeout);
  }, [still]);
  const shown = still ? name.length : typed;
  const ready = shown === name.length;
  return (
    <Panel className="h-full" title="Add a Friend" subtitle="Send a request by name">
      <Rows>
        {[
          <div key="f" className="flex min-h-[58px] items-center rounded-[12px] px-[22px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)]">
            <span className="text-[17px] font-medium">{name.slice(0, shown)}</span>
            {!ready && <span className="caret ml-0.5 inline-block h-5 w-[2px] bg-white" />}
            {shown === 0 && <span className="text-[17px] text-white/62">Name</span>}
          </div>,
          <Row key="s" focused={ready} icon="paperPlaneRight" title="Send Request" />,
          <Caption key="c">Friends</Caption>,
          <Row key="m" icon="userCircle" title="mira" detail="Online" chevron />,
          <Row key="n" icon="gameController" title="noor" detail="Playing Kitebound · You can join" chevron />,
        ]}
      </Rows>
    </Panel>
  );
}

/** The party page as the launcher draws it (gallery scene online-party), with the voice of who is talking. */
function PartyPage() {
  return (
    <Panel className="h-full" title="Party" subtitle="3 of 8 members">
      <Rows>
        {[
          <Row key="c" focused icon="envelopeSimple" title="Party Chat" detail="2 new" chevron />,
          <Row key="i" icon="userPlus" title="Invite Friends" chevron />,
          <Row key="t" icon="gameController" title="Take the Party to My Game" detail="Ember Drift" />,
          <Caption key="cap">Members</Caption>,
          <Row key="r" info icon="userCircle" title="riley" detail="Leader" trailing={<span className="text-[15px] font-medium">You</span>} />,
          <Row key="m" icon="microphone" title="mira" detail="Talking" trailing={<VoiceWave bars={10} />} chevron />,
          <Row key="k" icon="gameController" title="kit" detail="Playing Ember Drift · You can join" chevron />,
          <div key="l" className="pt-2">
            <Row destructive icon="signOut" title="Leave Party" />
          </div>,
        ]}
      </Rows>
    </Panel>
  );
}
