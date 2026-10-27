// SPDX-License-Identifier: AGPL-3.0-only
import type { ComponentType } from "react";
import { AppleLogo, LinuxLogo, WindowsLogo } from "../landing/os-logos";
import type { Download, Downloads } from "../landing/release";

export type Os = "windows" | "linux" | "mac";

export type FileRow = {
  id: string;
  os: Os;
  logo: ComponentType<{ className?: string }>;
  name: string;
  detail: string;
  file: Download;
  /** The one a visitor on this system is sent to first. */
  main?: boolean;
  note?: string;
};

/** Every file of a release. The page puts the visitor's own system first. */
export function fileRows(d: Downloads): FileRow[] {
  return [
    { id: "windows", os: "windows", logo: WindowsLogo, name: "Windows installer", detail: "64-bit. No administrator rights needed.", file: d.windows, main: true },
    { id: "windows-portable", os: "windows", logo: WindowsLogo, name: "Windows, one file", detail: "64-bit. Runs without installing.", file: d.windowsPortable },
    {
      id: "mac",
      os: "mac",
      logo: AppleLogo,
      name: "macOS",
      detail: "Apple silicon, macOS 11 or newer.",
      file: d.mac,
      main: true,
      note: "If macOS says the developer cannot be verified, open System Settings > Privacy & Security and choose Open Anyway.",
    },
    { id: "appimage", os: "linux", logo: LinuxLogo, name: "Linux AppImage", detail: "x86-64. Make it executable and run it.", file: d.appImage, main: true },
    { id: "flatpak", os: "linux", logo: LinuxLogo, name: "Linux Flatpak", detail: "x86-64.", file: d.flatpak },
    { id: "tarball", os: "linux", logo: LinuxLogo, name: "Linux archive", detail: "x86-64. A tar.gz to unpack anywhere.", file: d.tarball },
  ];
}

export function megabytes(bytes?: number) {
  return bytes ? `${(bytes / 1_000_000).toFixed(1)} MB` : undefined;
}

/** "27 Oct 2026" from an ISO day, in UTC so the server and the browser agree. */
export function dayLabel(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
