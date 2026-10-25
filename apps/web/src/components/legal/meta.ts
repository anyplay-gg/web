// SPDX-License-Identifier: AGPL-3.0-only
// The facts the legal texts share. The real name and address of the operator live here and in the
// three texts that use them (legal notice, privacy notice, terms), and nowhere else in the project.
// `version` is the cloud's TERMS_VERSION: change it here and in the server's deploy/.env together,
// and every player is asked to accept the terms again.
export const LEGAL = {
  operator: {
    name: "Alec Fritsch",
    street: "Donaustraße 44",
    city: "12043 Berlin",
    country: "Germany",
  },
  contact: "contact@anyplaynet.com",
  privacy: "privacy@anyplaynet.com",
  abuse: "abuse@anyplaynet.com",
  version: "2",
  changed: "2026-10-25",
  changedText: "25 October 2026",
  minimumAge: 16,
  authority: {
    name: "Berliner Beauftragte für Datenschutz und Informationsfreiheit",
    street: "Alt-Moabit 59–61",
    city: "10555 Berlin",
    site: "https://www.datenschutz-berlin.de",
  },
} as const;
