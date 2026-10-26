// SPDX-License-Identifier: AGPL-3.0-only
// What makes one deployment of the website different from another: its address and its community.
// Read on the server for each request (the root layout awaits `connection()`), never at build time.
// Nothing here has a default: an instance that sets nothing shows nothing of the kind.

export type Site = {
  /** The public origin, for example https://play.example.org, without a trailing slash. */
  url: string | null;
  /** The host name of `url`, for sentences like "comes from example.org". */
  host: string | null;
  /** A Discord invite link, or null: then every place that links it is left out. */
  discord: string | null;
};

type Env = Record<string, string | undefined>;

function origin(raw: string | undefined): URL | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function readSite(env: Env = process.env): Site {
  const url = origin(env.SITE_URL);
  const discord = origin(env.COMMUNITY_DISCORD_URL);
  return {
    url: url ? url.origin : null,
    host: url ? url.host : null,
    discord: discord ? discord.href : null,
  };
}
