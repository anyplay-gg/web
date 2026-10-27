// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { FALLBACK, parseRelease } from "./release";

const asset = (name: string, size = 1_000_000) => ({ name, size, browser_download_url: `https://example.test/${name}` });

const release = {
  tag_name: "v0.3.5",
  html_url: "https://example.test/release",
  published_at: "2026-10-27T10:00:00Z",
  assets: [
    asset("AnyPlay-Launcher-0.3.5-Setup.exe"),
    asset("AnyPlay-Launcher-0.3.5-x64.exe"),
    asset("AnyPS5-Launcher-0.3.5-x64.exe"),
    asset("AnyPlay-Launcher-0.3.5-x86_64.AppImage"),
    asset("AnyPlay-Launcher-0.3.5-x86_64.flatpak"),
    asset("AnyPlay-Launcher-0.3.5-linux-x86_64.tar.gz"),
    asset("AnyPlay-Launcher-0.3.5-macos-arm64.zip"),
    asset("SHA256SUMS.txt"),
  ],
};

describe("parseRelease", () => {
  it("finds every system's file by its ending", () => {
    const d = parseRelease(release);
    expect(d.live).toBe(true);
    expect(d.version).toBe("0.3.5");
    expect(d.published).toBe("2026-10-27");
    expect(d.windows.href).toContain("Setup.exe");
    expect(d.windowsPortable.href).toContain("AnyPlay-Launcher-0.3.5-x64.exe");
    expect(d.mac.href).toContain("macos-arm64.zip");
    expect(d.flatpak.href).toContain(".flatpak");
    expect(d.checksums.href).toContain("SHA256SUMS.txt");
  });

  it("never offers the old AnyPS5-named file", () => {
    const d = parseRelease({ ...release, assets: [asset("AnyPS5-Launcher-0.3.5-x64.exe")] });
    expect(d).toBe(FALLBACK);
  });

  it("falls back per file when one is missing", () => {
    const d = parseRelease({ ...release, assets: release.assets.filter((a) => !a.name.endsWith(".zip")) });
    expect(d.live).toBe(true);
    expect(d.mac).toEqual(FALLBACK.mac);
  });

  it("treats a release with no installer as no answer", () => {
    expect(parseRelease({ tag_name: "v1", assets: [] })).toBe(FALLBACK);
  });
});
