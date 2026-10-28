// SPDX-License-Identifier: AGPL-3.0-only
// The facts the legal texts share. Nothing about a person lives in this repository: whoever runs a
// deployment says who they are in the server's environment (see `readLegal`), so a self-hoster
// publishes their own legal notice and not ours.
// `version` is the cloud's TERMS_VERSION: change it here and in the server's deploy/.env together,
// and every player is asked to accept the terms again.
export const LEGAL = {
  version: "2",
  changed: "2026-10-28",
  changedText: "28 October 2026",
  minimumAge: 16,
} as const;

export type Operator = { name: string; street: string; city: string; country: string };

export type LegalConfig = {
  /** Null while the deployment has not set (all of) its operator details. */
  operator: Operator | null;
  /** The operator variables that are empty or missing, in the order the notice lists them. */
  missing: string[];
  /** Null while the instance has not set the address. */
  contact: string | null;
  privacy: string | null;
  abuse: string | null;
  /** Null unless all four parts are set. */
  authority: { name: string; street: string; city: string; site: string } | null;
};

type Env = Record<string, string | undefined>;

export const OPERATOR_VARS = [
  ["name", "LEGAL_OPERATOR_NAME"],
  ["street", "LEGAL_OPERATOR_STREET"],
  ["city", "LEGAL_OPERATOR_CITY"],
  ["country", "LEGAL_OPERATOR_COUNTRY"],
] as const satisfies readonly (readonly [keyof Operator, string])[];

/**
 * Reads the deployment's legal details from the environment. Call it while rendering a page that has
 * awaited `connection()`: it must run per request, so the values come from the running server and
 * are never part of the build, the image or the client bundle (the names carry no NEXT_PUBLIC_).
 * Nothing has a default: an instance names itself or says nothing.
 */
export function readLegal(env: Env = process.env): LegalConfig {
  const get = (name: string, fallback = "") => env[name]?.trim() || fallback;
  const fields = OPERATOR_VARS.map(([key, name]) => ({ key, name, value: get(name) }));
  const missing = fields.filter((f) => !f.value).map((f) => f.name);
  const operator =
    missing.length === 0
      ? (Object.fromEntries(fields.map((f) => [f.key, f.value])) as Operator)
      : null;
  const authority = {
    name: get("LEGAL_AUTHORITY_NAME"),
    street: get("LEGAL_AUTHORITY_STREET"),
    city: get("LEGAL_AUTHORITY_CITY"),
    site: get("LEGAL_AUTHORITY_SITE"),
  };
  return {
    operator,
    missing,
    contact: get("LEGAL_CONTACT_EMAIL") || null,
    privacy: get("LEGAL_PRIVACY_EMAIL") || null,
    abuse: get("LEGAL_ABUSE_EMAIL") || null,
    authority: Object.values(authority).every(Boolean) ? authority : null,
  };
}
