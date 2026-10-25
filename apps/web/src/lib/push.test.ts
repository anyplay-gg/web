import { describe, expect, it } from "vitest";
import { deviceLabel, keyBytes, pushSupport } from "./push";

const CHROME_ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const EDGE_WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0";
const FIREFOX_LINUX = "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0";
const all = { serviceWorker: true, pushManager: true, notification: true };

describe("pushSupport", () => {
  it("accepts a browser with all three APIs", () => {
    expect(pushSupport({ userAgent: CHROME_ANDROID, standalone: false, ...all })).toBe("ok");
  });
  it("asks an iPhone browser to install first, and accepts the installed app", () => {
    expect(pushSupport({ userAgent: SAFARI_IPHONE, standalone: false, serviceWorker: true, pushManager: false, notification: false })).toBe("needs-install");
    expect(pushSupport({ userAgent: SAFARI_IPHONE, standalone: true, ...all })).toBe("ok");
  });
  it("says unsupported when an API is missing", () => {
    expect(pushSupport({ userAgent: FIREFOX_LINUX, standalone: false, ...all, pushManager: false })).toBe("unsupported");
  });
});

describe("deviceLabel", () => {
  it("names the browser and the system", () => {
    expect(deviceLabel(CHROME_ANDROID)).toBe("Chrome on Android");
    expect(deviceLabel(EDGE_WINDOWS)).toBe("Edge on Windows");
    expect(deviceLabel(FIREFOX_LINUX)).toBe("Firefox on Linux");
    expect(deviceLabel(SAFARI_IPHONE)).toBe("Safari on iOS");
    expect(deviceLabel("curl/8")).toBe("Browser");
  });
});

describe("keyBytes", () => {
  it("decodes a base64url key to its 65 bytes", () => {
    const key = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
    const bytes = keyBytes(key);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(4);
  });
});
