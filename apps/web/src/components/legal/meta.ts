// SPDX-License-Identifier: AGPL-3.0-only
// The facts both legal texts share. `version` is the cloud's TERMS_VERSION: change it here and in
// the server's deploy/.env together, and every player is asked to accept the terms again.
export const LEGAL = {
  operator: "AnyPlay",
  contact: "privacy@anyplaynet.com",
  version: "1",
  changed: "2026-10-25",
  changedText: "25 October 2026",
  minimumAge: 16,
} as const;
