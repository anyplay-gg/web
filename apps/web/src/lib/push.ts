// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The browser side of Web Push, as pure functions so they can be tested: what a browser can do,
 * how to name a device, how to hand the VAPID key to `PushManager.subscribe`.
 */

export type PushSupport = "ok" | "needs-install" | "unsupported";

export interface PushEnv {
  userAgent: string;
  /** Running as an installed app (display-mode standalone, or iOS's navigator.standalone). */
  standalone: boolean;
  serviceWorker: boolean;
  pushManager: boolean;
  notification: boolean;
}

const isApple = (ua: string) => /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua));

/**
 * Whether this browser can receive a push. Safari on iPhone and iPad only has the Push API for an
 * app added to the Home Screen, so there the answer is "install first" rather than "no".
 */
export function pushSupport(env: PushEnv): PushSupport {
  if (isApple(env.userAgent) && !env.standalone) return "needs-install";
  return env.serviceWorker && env.pushManager && env.notification ? "ok" : "unsupported";
}

/** "Chrome on Android": enough for a person to tell their devices apart; nothing that identifies one. */
export function deviceLabel(ua: string): string {
  const os = /Android/.test(ua)
    ? "Android"
    : isApple(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux|X11/.test(ua)
            ? "Linux"
            : null;
  // The order matters: Edge and Opera also say Chrome, and Chrome also says Safari.
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\/|FxiOS/.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS/.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  return os ? `${browser} on ${os}` : browser;
}

/** The VAPID public key is base64url; `applicationServerKey` wants the bytes. */
export function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
