// SPDX-License-Identifier: AGPL-3.0-only
import { LINKS } from "./links";

/**
 * The files of the launcher's latest release, so the download menu starts the download itself instead
 * of sending the visitor to GitHub. File names carry the version (and changed with the rename), so
 * they are found by their ending, not spelled out. Asked of GitHub at most every 15 minutes; when
 * GitHub does not answer, every entry falls back to the release page and `live` is false, so a page
 * can say so instead of showing sizes it does not have.
 */

export type Download = { href: string; size?: number };

export type Downloads = {
  version?: string;
  /** The day the release was published, as an ISO date. */
  published?: string;
  /** True when the files come from the release itself, false for the release-page fallback. */
  live: boolean;
  windows: Download;
  windowsPortable: Download;
  appImage: Download;
  flatpak: Download;
  tarball: Download;
  mac: Download;
  checksums: Download;
  page: string;
};

type Asset = { name: string; size: number; browser_download_url: string };
type Release = { tag_name?: string; html_url?: string; published_at?: string; assets?: Asset[] };

const RELEASE_API = "https://api.github.com/repos/anyplaynet/launcher/releases/latest";

export const FALLBACK: Downloads = {
  live: false,
  windows: { href: LINKS.download },
  windowsPortable: { href: LINKS.download },
  appImage: { href: LINKS.download },
  flatpak: { href: LINKS.download },
  tarball: { href: LINKS.download },
  mac: { href: LINKS.download },
  checksums: { href: LINKS.download },
  page: LINKS.download,
};

/** Reads GitHub's release document. A release without any of the expected files counts as no answer. */
export function parseRelease(release: Release): Downloads {
  const assets = release.assets ?? [];
  const pick = (...endings: string[]): Download | undefined => {
    for (const ending of endings) {
      // The old AnyPS5-named portable exe is for the self-update of old versions, never offered.
      const a = assets.find((x) => x.name.endsWith(ending) && !x.name.startsWith("AnyPS5-"));
      if (a) return { href: a.browser_download_url, size: a.size };
    }
    return undefined;
  };
  const windows = pick("-Setup.exe", "-x64.exe");
  if (!windows) return FALLBACK;
  return {
    live: true,
    version: release.tag_name?.replace(/^v/, ""),
    published: release.published_at?.slice(0, 10),
    windows,
    windowsPortable: pick("-x64.exe") ?? FALLBACK.windowsPortable,
    appImage: pick(".AppImage") ?? FALLBACK.appImage,
    flatpak: pick(".flatpak") ?? FALLBACK.flatpak,
    tarball: pick(".tar.gz") ?? FALLBACK.tarball,
    mac: pick("-macos-arm64.zip") ?? FALLBACK.mac,
    checksums: pick("SHA256SUMS.txt") ?? FALLBACK.checksums,
    page: release.html_url ?? FALLBACK.page,
  };
}

export async function latestDownloads(): Promise<Downloads> {
  try {
    const res = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return FALLBACK;
    return parseRelease((await res.json()) as Release);
  } catch {
    return FALLBACK;
  }
}
