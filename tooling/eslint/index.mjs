// SPDX-License-Identifier: AGPL-3.0-only
// The lint bans every AnyPlay app shares. Each one exists because the thing it bans bypasses a
// decision made once, in @anyplay/tokens or in the hardening notes of next.config.ts.
//
// Flat config REPLACES a rule when a later block sets it again, it does not merge. So the
// restricted-syntax list is one exported constant that every block passes on, and
// scripts/check-lint-barriers.mjs proves with probe files that each ban still fires in each
// folder (athaus lost three bans that way once, silently).

/** A pattern inside a string or template literal of a class list. */
const inClasses = (regex, message) => [
  { selector: `Literal[value=${regex}]`, message },
  { selector: `TemplateElement[value.raw=${regex}]`, message },
];

export const restrictedSyntax = [
  ...inClasses(
    "/\\b(bg|text|border|ring|divide|from|via|to|fill|stroke|outline|decoration|shadow|caret|accent)-(black|white)(\\/|\\b)/",
    "No pure black or white: use a colour role from @anyplay/tokens (text-ink, bg-surface, ...). Pure black and white are the colours that are never a decision.",
  ),
  ...inClasses(
    "/#(000|fff)(000|fff)?\\b/i",
    "No pure black or white literal: use a colour role from @anyplay/tokens.",
  ),
  ...inClasses(
    "/\\brounded(-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?-\\[\\d+(\\.\\d+)?(px|rem)\\]/",
    "No radius outside the tokens: rounded-inner, rounded-control, rounded-surface or rounded-pill.",
  ),
  ...inClasses(
    "/\\btext-\\[\\d+(\\.\\d+)?(px|rem)\\]/",
    "No font size outside the scale: text-micro, text-small, text-body, text-lead, text-title, text-headline or text-display.",
  ),
  ...inClasses(
    "/\\btransition-all\\b/",
    "Name the properties that change: transition-[background-color,color], transition-transform. `all` animates what nobody meant to.",
  ),
  {
    selector: "ExpressionStatement[directive='use server']",
    message: "No Server Actions. The Rust API is the only backend; pages call it with fetch.",
  },
  {
    selector: "Property[key.name='borderRadius'][value.type='Literal']",
    message: "No inline radius: use a radius token class.",
  },
];

export const restrictedImports = {
  paths: [
    ...["motion", "motion/react", "motion/react-m", "framer-motion"].map((name) => ({
      name,
      message: "Import motion from @anyplay/ui/motion: it carries the reduced-motion gate.",
    })),
    { name: "next/og", message: "next/og had a critical RCE in 2026; share cards are rendered ahead of time." },
    { name: "next/image", message: "The image optimizer is off; use a plain <img> with width and height." },
  ],
};

/** The shared rule block. Apps spread it into their own config for src/**. */
export const anyplayRules = {
  "no-restricted-syntax": ["error", ...restrictedSyntax],
  "no-restricted-imports": ["error", restrictedImports],
  "react/no-danger": "error",
};

/**
 * The art-directed marketing surfaces (the landing, the sign-in pages and the account pages, which share its look). They set type in fluid clamps, draw glass with
 * white at low alpha and copy the launcher's own radii, so the three token bans (pure black or white,
 * radius, font size) do not hold there; every other ban does. The app's screens stay on the tokens.
 */
const TOKEN_BANS = [
  "No pure black or white",
  "No pure black or white literal",
  "No radius outside the tokens",
  "No font size outside the scale",
];
export const marketingRules = {
  ...anyplayRules,
  "no-restricted-syntax": [
    "error",
    ...restrictedSyntax.filter((r) => !TOKEN_BANS.some((ban) => r.message.startsWith(`${ban}:`))),
  ],
};

/**
 * A complete flat config for a package that is not a Next app (packages/ui, packages/api-client):
 * TypeScript's recommended rules, React's hooks rules and the AnyPlay bans. Apps built on Next take
 * eslint-config-next instead and add `anyplayRules` themselves.
 */
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export const packageConfig = [
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...anyplayRules,
    },
  },
];
