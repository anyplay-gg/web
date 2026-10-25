import { beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  getClient: vi.fn(() => undefined as unknown),
  captureException: vi.fn(),
}));
vi.mock("@sentry/browser", () => sentry);

import { captureError, initMonitoring, monitoringOrigin, scrubEvent } from "./monitoring";

const DSN = "https://abc@glitch.example.org/12";

beforeEach(() => {
  vi.clearAllMocks();
  sentry.getClient.mockReturnValue(undefined);
});

describe("monitoring", () => {
  it("does nothing without a DSN, so a default install sends nothing anywhere", async () => {
    expect(await initMonitoring(undefined)).toBe(false);
    expect(await initMonitoring("")).toBe(false);
  });
  it("reads the origin of a DSN for the CSP", () => {
    expect(monitoringOrigin(DSN)).toBe("https://glitch.example.org");
    expect(monitoringOrigin("not a url")).toBeNull();
    expect(monitoringOrigin(undefined)).toBeNull();
  });
});

describe("scrubEvent", () => {
  it("drops the page URL, user and breadcrumbs, and keeps the exception", () => {
    const event = scrubEvent({
      request: { url: "https://anyplaynet.com/u/somebody", headers: { Referer: "x" } },
      user: { ip_address: "1.2.3.4" },
      breadcrumbs: [{ message: "x" }],
      exception: { values: [{ value: "boom" }] },
    });
    expect(event).toEqual({ exception: { values: [{ value: "boom" }] } });
  });
  it("is what init installs as beforeSend", async () => {
    await initMonitoring(DSN);
    expect(sentry.init.mock.calls[0]?.[0]).toMatchObject({ beforeSend: scrubEvent });
  });
});

describe("captureError", () => {
  it("is a no-op without a DSN: no init, no capture", async () => {
    await captureError(new Error("boom"), { digest: "d1", boundary: "route" }, undefined);
    await captureError(new Error("boom"), {}, "");
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("sends one event with the boundary tag and the digest", async () => {
    const error = new Error("boom");
    await captureError(error, { digest: "d1", boundary: "global" }, DSN);
    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).toHaveBeenCalledWith(error, { tags: { boundary: "global" }, extra: { digest: "d1" } });
  });

  it("does not init a second time when the client already exists", async () => {
    sentry.getClient.mockReturnValue({});
    await captureError(new Error("boom"), { boundary: "route" }, DSN);
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("swallows its own failures", async () => {
    sentry.captureException.mockImplementationOnce(() => {
      throw new Error("sdk broke");
    });
    await expect(captureError(new Error("boom"), {}, DSN)).resolves.toBeUndefined();
  });
});
