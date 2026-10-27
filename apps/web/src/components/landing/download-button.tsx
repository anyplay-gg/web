// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { Menu } from "@anyplay/ui/menu";
import { ArrowDownTrayIcon, ArrowUpRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { type ComponentType, useSyncExternalStore } from "react";
import { AppleLogo, LinuxLogo, WindowsLogo } from "./os-logos";
import { LINKS } from "./links";
import type { Downloads } from "./release";

type Os = "windows" | "linux" | "mac" | "other";

/** The visitor's system, from the client hints where the browser has them, else the user agent. */
function detectOs(): Os {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const p = (nav.userAgentData?.platform || nav.userAgent || "").toLowerCase();
  // Phones and tablets get no launcher: the menu still lists every system for them.
  if (/iphone|ipad|android/.test(p)) return "other";
  if (p.includes("win")) return "windows";
  if (p.includes("mac")) return "mac";
  if (p.includes("linux") || p.includes("x11") || p.includes("cros")) return "linux";
  return "other";
}

/** Windows is the default for the first paint: most visitors use it, so most never see a change. */
export function useOs(): Os {
  return useSyncExternalStore(noSubscription, detectOs, () => "windows");
}

/** The system never changes while the page is open, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

const LABEL: Record<Os, string> = {
  windows: "Download for Windows",
  linux: "Download for Linux",
  mac: "Download for macOS",
  other: "Download",
};

const TRIGGER_LOGO: Record<Os, ComponentType<{ className?: string }>> = {
  windows: WindowsLogo,
  linux: LinuxLogo,
  mac: ArrowDownTrayIcon,
  other: ArrowDownTrayIcon,
};

function megabytes(bytes?: number) {
  return bytes ? `${(bytes / 1_000_000).toFixed(1)} MB` : undefined;
}

/**
 * The download button: it opens a menu with every system, the visitor's own marked, and each entry
 * downloads the file straight away.
 */
export function DownloadMenu({
  downloads,
  className,
  size = "lg",
}: {
  downloads: Downloads;
  className: string;
  size?: "lg" | "sm";
}) {
  const os = useOs();
  const Logo = TRIGGER_LOGO[os];
  const entries = [
    { os: "windows", logo: WindowsLogo, name: "Windows", detail: "Installer, 64-bit", file: downloads.windows },
    { os: "linux", logo: LinuxLogo, name: "Linux", detail: "AppImage, x86-64", file: downloads.appImage },
    { os: "linux-tar", logo: LinuxLogo, name: "Linux", detail: "tar.gz archive, x86-64", file: downloads.tarball },
    { os: "mac", logo: AppleLogo, name: "macOS", detail: "Apple silicon, macOS 11 or newer", file: downloads.mac },
  ] as const;

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={`group ${className}`}>
        <Logo aria-hidden className={size === "lg" ? "size-[17px]" : "size-4"} />
        {size === "lg" ? LABEL[os] : "Download"}
        <ChevronDownIcon
          aria-hidden
          className="-mr-1 size-4 opacity-60 transition-transform duration-[var(--duration-quick)] ease-[var(--ease-out)] group-data-[popup-open]:rotate-180"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align={size === "lg" ? "center" : "end"} sideOffset={10} className="z-40">
          <Menu.Popup className="night w-[min(340px,calc(100vw-24px))] origin-[var(--transform-origin)] rounded-[22px] bg-[#151311]/92 p-1.5 text-[#f6f5f1] shadow-[0_0_0_1px_rgb(255_255_255/0.09),inset_0_1px_0_rgb(255_255_255/0.07),0_24px_60px_-12px_rgb(0_0_0/0.75)] backdrop-blur-2xl backdrop-saturate-150 transition-[opacity,scale] duration-[180ms] ease-[var(--ease-out)] outline-none data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:duration-[120ms] data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0">
            <p className="px-3 pt-2.5 pb-2 text-[12px] text-[#8f8b84]">
              AnyPlay launcher{downloads.version ? ` ${downloads.version}` : ""} · free
            </p>
            {entries.map((e) => {
              const mine = e.os === os;
              return (
                <Menu.LinkItem
                  key={e.os}
                  href={e.file.href}
                  download
                  closeOnClick
                  className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[16px] px-2.5 py-2 outline-none select-none data-[highlighted]:bg-white/[0.07]"
                >
                  <span className="grid size-10 place-items-center rounded-[12px] bg-white/[0.06] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                    <e.logo className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-tight font-semibold">{e.name}</span>
                    <span className="block text-[12.5px] leading-tight text-[#8f8b84]">{e.detail}</span>
                  </span>
                  {mine ? (
                    <span className="rounded-full bg-[#ff5a1f]/15 px-2 py-0.5 text-[11px] font-semibold text-[#ffb487]">Your system</span>
                  ) : (
                    <span className="font-mono text-[11.5px] text-[#8f8b84] tabular-nums">{megabytes(e.file.size)}</span>
                  )}
                </Menu.LinkItem>
              );
            })}
            <Menu.Separator className="mx-3 my-1.5 h-px bg-white/[0.07]" />
            <Menu.LinkItem
              href={LINKS.downloadPage}
              className="flex min-h-11 items-center justify-between rounded-[14px] px-3 text-[13px] text-[#bdb9b1] outline-none select-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-[#f6f5f1]"
            >
              All downloads and checksums
              <ArrowUpRightIcon aria-hidden className="size-4 opacity-70" />
            </Menu.LinkItem>
            <Menu.LinkItem
              href={downloads.page}
              className="flex min-h-11 items-center justify-between rounded-[14px] px-3 text-[13px] text-[#bdb9b1] outline-none select-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-[#f6f5f1]"
            >
              Release notes
              <ArrowUpRightIcon aria-hidden className="size-4 opacity-70" />
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
