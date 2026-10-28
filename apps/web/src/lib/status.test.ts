import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusPage, utc } from "@/components/status/status-page";
import { Intl } from "@/i18n/test-utils";
import { loadStatus, parseStatus } from "./status";

const body = (over: Record<string, unknown> = {}) => ({
  status: "operational",
  checked: 1_800_000_000_000,
  components: [
    { id: "api", status: "up" },
    { id: "database", status: "up" },
    { id: "signalling", status: "up" },
    { id: "relay", status: "up" },
    { id: "web", status: "unknown" },
  ],
  ...over,
});
const answer = (json: unknown, ok = true) => (async () => ({ ok, json: async () => json }) as Response) as typeof fetch;

describe("parseStatus", () => {
  it("reads the answer of the cloud", () => {
    expect(parseStatus(body())?.parts.relay).toBe("up");
  });
  it("refuses a wrong shape", () => {
    expect(parseStatus(null)).toBeNull();
    expect(parseStatus(body({ status: "fine" }))).toBeNull();
    expect(parseStatus(body({ checked: "now" }))).toBeNull();
    expect(parseStatus(body({ components: [{ id: "api", status: "great" }] }))).toBeNull();
  });
  it("ignores a part it does not know", () => {
    const parsed = parseStatus(body({ components: [{ id: "toaster", status: "down" }] }));
    expect(parsed?.parts.api).toBe("unknown");
  });
});

describe("loadStatus", () => {
  it("asks CLOUD_URL and calls the website up when it is this page", async () => {
    let asked = "";
    const fetcher = (async (url: string) => {
      asked = url;
      return { ok: true, json: async () => body() } as Response;
    }) as unknown as typeof fetch;
    const status = await loadStatus({ CLOUD_URL: "http://cloud.internal:8080/" }, fetcher);
    expect(asked).toBe("http://cloud.internal:8080/v1/status");
    expect(status.overall).toBe("operational");
    expect(status.parts.web).toBe("up");
  });
  it("says the cloud is unreachable when it does not answer", async () => {
    const failing = (async () => {
      throw new Error("refused");
    }) as typeof fetch;
    const status = await loadStatus({}, failing, () => 5);
    expect(status).toMatchObject({ overall: "unreachable", checked: 5, parts: { api: "down", web: "up" } });
  });
  it("treats an error status or garbage as no answer", async () => {
    expect((await loadStatus({}, answer({}, false))).overall).toBe("unreachable");
    expect((await loadStatus({}, answer({ hello: 1 }))).overall).toBe("unreachable");
  });
});

describe("StatusPage", () => {
  it("names every part with a word, and prints the time", async () => {
    const status = await loadStatus({}, answer(body({ components: [{ id: "relay", status: "down" }], status: "degraded" })));
    const html = renderToStaticMarkup(createElement(Intl, null, createElement(StatusPage, { status })));
    expect(html).toContain("Some parts are down");
    for (const name of ["Cloud", "Database", "Live updates", "Relay", "Website"]) expect(html).toContain(name);
    expect(html).toContain("Down");
    expect(html).toContain("Not monitored");
    expect(html).toContain(utc(1_800_000_000_000));
  });
});
