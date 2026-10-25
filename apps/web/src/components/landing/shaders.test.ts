// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from "vitest";
import { PIXEL_BUDGET, SMALL_SCREEN, readPixelBudget } from "./shaders";

function screen(small: boolean) {
  const matchMedia = vi.fn((query: string) => ({ matches: query === SMALL_SCREEN && small }));
  vi.stubGlobal("window", { matchMedia });
  return matchMedia;
}

afterEach(() => vi.unstubAllGlobals());

describe("readPixelBudget", () => {
  it("gives a phone or touch screen the small budget", () => {
    const matchMedia = screen(true);
    expect(readPixelBudget()).toBe(350_000);
    expect(matchMedia).toHaveBeenCalledWith("(pointer: coarse), (max-width: 767px)");
  });

  it("gives a desktop the large budget", () => {
    screen(false);
    expect(readPixelBudget()).toBe(900_000);
  });

  it("answers with the desktop value where there is no window", () => {
    expect(readPixelBudget()).toBe(PIXEL_BUDGET.large);
  });
});
