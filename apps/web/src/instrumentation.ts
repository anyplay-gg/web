// SPDX-License-Identifier: AGPL-3.0-only
import { readLegal } from "@/components/legal/meta";
import { readSite } from "@/lib/site";

/**
 * Runs once when the server starts. An instance that has not been given its own details still serves
 * pages that read calmly to visitors; the instructions for the operator belong here and in the README.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const legal = readLegal();
  const site = readSite();
  const missing = [
    ...legal.missing,
    ...(site.url ? [] : ["SITE_URL"]),
    ...(legal.contact ? [] : ["LEGAL_CONTACT_EMAIL"]),
    ...(legal.privacy ? [] : ["LEGAL_PRIVACY_EMAIL"]),
    ...(legal.abuse ? [] : ["LEGAL_ABUSE_EMAIL"]),
    ...(legal.authority ? [] : ["LEGAL_AUTHORITY_NAME", "LEGAL_AUTHORITY_STREET", "LEGAL_AUTHORITY_CITY", "LEGAL_AUTHORITY_SITE"]),
  ];
  if (missing.length > 0) {
    console.warn(
      `[anyplay-web] This instance is missing settings and shows less than it could. Set these environment variables and restart: ${missing.join(", ")}. See the README, section "Run your own AnyPlay website".`,
    );
  }
}
