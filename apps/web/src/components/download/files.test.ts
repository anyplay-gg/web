// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { FALLBACK } from "../landing/release";
import { dayLabel, fileRows, megabytes } from "./files";

describe("download files", () => {
  it("offers one main file per system", () => {
    const mains = fileRows(FALLBACK).filter((r) => r.main).map((r) => r.os);
    expect(mains.sort()).toEqual(["linux", "mac", "windows"]);
  });
  it("formats sizes and days, and says nothing when it does not know", () => {
    expect(megabytes(20_261_577)).toBe("20.3 MB");
    expect(megabytes(undefined)).toBeUndefined();
    expect(dayLabel("2026-10-27")).toBe("27 Oct 2026");
    expect(dayLabel("nonsense")).toBeUndefined();
    expect(dayLabel(undefined)).toBeUndefined();
  });
});
