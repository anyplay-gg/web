// SPDX-License-Identifier: AGPL-3.0-only
// The bundle budget: how much JavaScript a route loads on first visit, read from the numbers
// `next build` writes (.next/diagnostics/route-bundle-stats.json), against scripts/bundle-budget.json.
//
//   node scripts/check-bundle.mjs            check, exit 1 when a route is over or has no budget
//   node scripts/check-bundle.mjs --update   write budgets 8 % above what the build measured
//
// A budget is a decision, not a default: a route that appears without one fails the check, so a new
// page says how heavy it may be. Raising one is a change someone reviews, with the reason in the
// pull request. The sizes are uncompressed bytes of the first-load chunks (what the browser parses).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const statsPath = `${root}apps/web/.next/diagnostics/route-bundle-stats.json`;
const budgetPath = `${root}scripts/bundle-budget.json`;
/** Test pages that exist only for the browser tests. */
const IGNORED = /^\/(e2e-throw|_not-found)/;
const HEADROOM = 1.08;

const kb = (n) => `${(n / 1000).toFixed(0)} kB`;
const stats = JSON.parse(readFileSync(statsPath, "utf8")).filter((r) => !IGNORED.test(r.route));

if (process.argv.includes("--update")) {
  const next = Object.fromEntries(
    stats
      .map((r) => [r.route, Math.ceil((r.firstLoadUncompressedJsBytes * HEADROOM) / 5000) * 5000])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(budgetPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`wrote ${Object.keys(next).length} budgets to scripts/bundle-budget.json`);
  process.exit(0);
}

const budget = JSON.parse(readFileSync(budgetPath, "utf8"));
const problems = [];
for (const { route, firstLoadUncompressedJsBytes: size } of stats.sort((a, b) => a.route.localeCompare(b.route))) {
  const limit = budget[route];
  const state = limit === undefined ? "NO BUDGET" : size > limit ? "OVER" : "ok";
  console.log(`${state.padEnd(10)} ${route.padEnd(30)} ${kb(size).padStart(8)} / ${limit === undefined ? "-" : kb(limit)}`);
  if (state !== "ok") problems.push(`${route}: ${state === "OVER" ? `${kb(size)} is over its budget of ${kb(limit)}` : "has no budget, run with --update and review the number"}`);
}
for (const route of Object.keys(budget)) {
  if (!stats.some((r) => r.route === route)) problems.push(`${route}: has a budget but is no longer a route, remove it`);
}
if (problems.length) {
  console.error(`\n${problems.length} bundle problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("\nEvery route is within its budget.");
