// SPDX-License-Identifier: AGPL-3.0-only

/**
 * A join code is 10 characters of this alphabet (no 0, 1, l or o, which are easy to misread), and
 * the cloud reads it without regard to case (spec/portal-api.md, "Join pages"). Anything else is
 * answered here, with no request: a typo or a mangled link never reaches the cloud.
 */
const JOIN_CODE = /^[23456789abcdefghijkmnpqrstuvwxyz]{10}$/i;

/** The code in its one canonical form (lower case), or null when it is not a join code. */
export function normalizeJoinCode(code: string | null | undefined): string | null {
  if (typeof code !== "string" || !JOIN_CODE.test(code)) return null;
  return code.toLowerCase();
}

/** The page of an invitation. The code is validated, so nothing else can ever be built into a path. */
export function joinPath(code: string): string {
  return `/join/${code}`;
}

/** The launcher's own link. The launcher opens, shows the invitation and asks; it joins nobody by itself. */
export function launcherJoinUrl(code: string): string {
  return `anyps5://v1/join/${code}`;
}

/**
 * Where sign-in and sign-up may send a person back to: a join page of this site, and nothing else.
 * No other path, no query, no fragment, no other origin, so the `next` of a link can never become
 * an open redirect. Returns the path in its canonical form, or null.
 */
export function safeNext(next: string | string[] | null | undefined): string | null {
  if (typeof next !== "string") return null;
  const match = /^\/join\/(.*)$/.exec(next);
  const code = match ? normalizeJoinCode(match[1]) : null;
  return code ? joinPath(code) : null;
}

/** `/sign-in` or `/create`, with the way back when there is one. */
export function withNext(path: "/sign-in" | "/create", next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
