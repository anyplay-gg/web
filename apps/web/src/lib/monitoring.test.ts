import { describe, expect, it } from "vitest";
import { initMonitoring, monitoringOrigin } from "./monitoring";

describe("monitoring", () => {
  it("does nothing without a DSN, so a default install sends nothing anywhere", async () => {
    expect(await initMonitoring(undefined)).toBe(false);
    expect(await initMonitoring("")).toBe(false);
  });
  it("reads the origin of a DSN for the CSP", () => {
    expect(monitoringOrigin("https://abc@glitch.example.org/12")).toBe("https://glitch.example.org");
    expect(monitoringOrigin("not a url")).toBeNull();
    expect(monitoringOrigin(undefined)).toBeNull();
  });
});
