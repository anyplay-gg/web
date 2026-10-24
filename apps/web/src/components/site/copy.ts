// SPDX-License-Identifier: AGPL-3.0-only
// The words of the landing, per direction. Plain English, sentence case, verbs first on buttons, no
// exclamation marks. Every claim here can be checked in the repositories: the licence is a file,
// the compose file is in anyplay-gg/cloud, the export and the 30-day deletion are in the portal API.
import type { Direction } from "@/components/network-map/styles";

export const LINKS = {
  source: "https://github.com/anyplay-gg",
  launcher: "https://github.com/anyplay-gg/launcher/releases",
  signIn: "/sign-in",
} as const;

export const PROOF = [
  { title: "Open source", text: "Every line is public under the AGPL-3.0." },
  { title: "Self-hostable", text: "Run your own cloud from one compose file." },
  { title: "No lock-in", text: "Export your data. Delete your account any time." },
] as const;

export const HERO: Record<Direction, { eyebrow: string; title: string; lead: string; primary: string; secondary: string }> = {
  a: {
    eyebrow: "Pre-launch · team only",
    title: "A network you can read.",
    lead: "Friends, trophies and profiles for AnyPS5 players. Open source, self-hostable, and yours to leave.",
    primary: "Download launcher",
    secondary: "Read the source",
  },
  b: {
    eyebrow: "Pre-launch · team only",
    title: "Your friends, on a network anyone can host.",
    lead: "AnyPlay links AnyPS5 players through relays or directly. The source is public, and so is how it works.",
    primary: "Download launcher",
    secondary: "View the source",
  },
  c: {
    eyebrow: "Pre-launch · team only",
    title: "Leave whenever you like.",
    lead: "An open network for AnyPS5 players. Host it yourself, export your account, delete it. It is all in your hands.",
    primary: "Download launcher",
    secondary: "Read the source",
  },
};

export const MAP_NOTE = "Illustration with synthetic data. Real relay latency replaces it after launch.";
