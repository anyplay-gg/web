// SPDX-License-Identifier: AGPL-3.0-only
// The service worker of the account web. It does one job: show a push from the cloud and open the
// right page when it is tapped. It caches nothing and answers no fetch: account pages are
// private and must always come from the network.

const ICON = "/icons/icon-192.png";
const BADGE = "/icons/badge-96.png";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** A path on this site, or the account page: a push never sends the person anywhere else. */
function target(url) {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return "/account";
  return url;
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // not JSON: show the generic line below
  }
  const title = typeof data.title === "string" && data.title ? data.title : "AnyPlay";
  const options = {
    body: typeof data.body === "string" ? data.body : "You have a new notification.",
    icon: ICON,
    badge: BADGE,
    data: { url: target(data.url) },
  };
  // One notification per tag, so five messages from one friend do not stack five times; a newer one
  // replaces the older and still makes a sound. (renotify without a tag is an error.)
  const tag = typeof data.tag === "string" && data.tag ? data.tag : typeof data.kind === "string" ? data.kind : "";
  if (tag) Object.assign(options, { tag, renotify: true });
  event.waitUntil(
    (async () => {
      // A page the person is looking at already shows it; a notification on top would be noise.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((w) => w.visibilityState === "visible" && w.focused)) return;
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(target(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          await w.focus();
          if ("navigate" in w) await w.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
