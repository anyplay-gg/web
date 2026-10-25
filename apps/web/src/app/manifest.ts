// SPDX-License-Identifier: AGPL-3.0-only
import type { MetadataRoute } from "next";

/**
 * What a phone needs to install the account web as an app. It opens on the account, which sends a
 * signed-out visitor to the sign-in; the colours are the night palette, so the splash screen and the
 * first paint match the page (no white flash).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/account",
    name: "AnyPlay",
    short_name: "AnyPlay",
    description: "Your AnyPlay account: friends, parties, messages and trophies.",
    start_url: "/account",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
