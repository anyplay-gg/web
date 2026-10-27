// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The launcher's six looks, painted from the same three tones the launcher's background shader
 * blends (deep, middle, bright; ui/theme.rs, converted to hex). A still gradient stands for each:
 * the page stays calm, and the words say which of them move.
 */
type Look = { name: string; text: string; isNew?: boolean; bg: string };

const tone = (deep: string, middle: string, bright: string, glow = "78% 0%") =>
  `radial-gradient(110% 90% at ${glow}, ${bright} 0%, transparent 58%), linear-gradient(165deg, ${middle}, ${deep})`;

export const LOOKS: Look[] = [
  { name: "Cosmic", text: "Deep space blue.", bg: tone("#030617", "#0a266b", "#6ba3ff") },
  { name: "Aurora", text: "Dark water, mint light.", bg: tone("#02080b", "#054d4d", "#8fffc7") },
  { name: "Sunset", text: "Plum into amber.", bg: tone("#0f030a", "#851c38", "#ffa354") },
  { name: "Ember", text: "A low hearth in charcoal and copper. Embers rise and fade.", isNew: true, bg: tone("#080302", "#401608", "#ff8f2b", "50% 115%") },
  { name: "Tide", text: "Deep petrol water with light from above.", isNew: true, bg: tone("#010509", "#03304d", "#7aedff") },
  { name: "Daylight", text: "The first light look. Soft sky, dark text, drifting clouds.", isNew: true, bg: tone("#a3bfe3", "#d4e3f2", "#fff2d1", "50% 115%") },
];

export function Looks({ showNew = true }: { showNew?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
      {LOOKS.map((l) => (
        <li key={l.name}>
          <span
            aria-hidden
            className="block h-[clamp(7.5rem,18vw,11rem)] rounded-[20px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]"
            style={{ backgroundImage: l.bg }}
          />
          <h3 className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[16px] leading-[1.3] font-semibold">
            {l.name}
            {l.isNew && showNew ? (
              <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[12px] leading-[1.3] font-semibold text-brand-text">New in 0.3.5</span>
            ) : null}
          </h3>
          <p className="mt-1 text-[14px] leading-[1.55] text-ink-2 text-pretty">{l.text}</p>
        </li>
      ))}
    </ul>
  );
}
