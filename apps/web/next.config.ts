// SPDX-License-Identifier: AGPL-3.0-only
import type { NextConfig } from "next";

/**
 * Hardening, because the 2025-26 Next.js advisories are real and every self-hoster would have to
 * patch a Node image within days:
 * - no Server Actions and no "use server" anywhere (lint-banned), so the action endpoints and their
 *   DoS class do not exist;
 * - no auth logic here: the Rust API owns sessions, signed-in pages are client components that call
 *   it with the cookie and the CSRF header;
 * - the image optimizer is off (`unoptimized`), `next/og` is banned: both had critical RCEs in 2026;
 * - `standalone` output: a small server that contains only what it needs.
 * The Content-Security-Policy is set per request in src/proxy.ts (it needs a nonce).
 */
const config: NextConfig = {
  output: "standalone",
  // Next writes its own AGENTS.md into the app; the repo has one at the root that says what is true here.
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  transpilePackages: ["@anyplay/ui", "@anyplay/api-client", "@anyplay/tokens"],
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default config;
