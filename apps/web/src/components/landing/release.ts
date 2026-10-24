// SPDX-License-Identifier: AGPL-3.0-only
import { LINKS } from "./links";

/**
 * The files of the launcher's latest release, so the download menu starts the download itself instead
 * of sending the visitor to GitHub. File names carry the version (and changed with the rename), so
 * they are found by their ending, not spelled out. Asked of GitHub at most every 15 minutes; when
 * GitHub does not answer, every entry falls back to the release page.
 */

export type Download = { href: string; size?: number };

export type Downloads = {
  version?: string;
  windows: Download;
  appImage: Download;
  tarball: Download;
  page: string;
};

type Asset = { name: string; size: number; browser_download_url: string };

const RELEASE_API = "https://api.github.com/repos/anyplay-gg/launcher/releases/latest";

export async function latestDownloads(): Promise<Downloads> {
  const fallback: Downloads = {
    windows: { href: LINKS.download },
    appImage: { href: LINKS.download },
    tarball: { href: LINKS.download },
    page: LINKS.download,
  };
  try {
    const res = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return fallback;
    const release = (await res.json()) as { tag_name?: string; html_url?: string; assets?: Asset[] };
    const assets = release.assets ?? [];
    // The installer is what a new player wants; the portable exe is there for the self-update of old versions.
    const pick = (...endings: string[]): Download | undefined => {
      for (const ending of endings) {
        const a = assets.find((x) => x.name.endsWith(ending));
        if (a) return { href: a.browser_download_url, size: a.size };
      }
      return undefined;
    };
    return {
      version: release.tag_name?.replace(/^v/, ""),
      windows: pick("-Setup.exe", "-x64.exe") ?? fallback.windows,
      appImage: pick(".AppImage") ?? fallback.appImage,
      tarball: pick(".tar.gz") ?? fallback.tarball,
      page: release.html_url ?? fallback.page,
    };
  } catch {
    return fallback;
  }
}
