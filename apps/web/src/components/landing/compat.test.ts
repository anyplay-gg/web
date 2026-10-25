import type { CompatTitle } from "@anyplay/api-client";
import { describe, expect, it } from "vitest";
import { filterTitles, plural } from "./compat";

const t = (titleId: string, reports: number, title?: string): CompatTitle => ({
  titleId,
  ...(title ? { title } : {}),
  verdict: "playable",
  reports,
  counts: { noStart: 0, menus: 0, inGame: 0, playable: reports },
  versions: [],
});
const list = [t("GAME01234", 20, "Tidebreaker"), t("GAME07781", 8), t("GAME03102", 33, "Lap Nine"), t("GAME05919", 20)];

describe("filterTitles", () => {
  it("lists the best-reported first, then by title ID", () => {
    expect(filterTitles(list, "").map((x) => x.titleId)).toEqual(["GAME03102", "GAME01234", "GAME05919", "GAME07781"]);
  });
  it("finds by title ID or by name, ignoring case", () => {
    expect(filterTitles(list, "game0778").map((x) => x.titleId)).toEqual(["GAME07781"]);
    expect(filterTitles(list, "TIDE").map((x) => x.titleId)).toEqual(["GAME01234"]);
  });
  it("needs every word, in any order", () => {
    expect(filterTitles(list, "nine lap").map((x) => x.titleId)).toEqual(["GAME03102"]);
    expect(filterTitles(list, "lap tide")).toEqual([]);
  });
  it("does not change the list it was given", () => {
    const before = list.map((x) => x.titleId);
    filterTitles(list, "");
    expect(list.map((x) => x.titleId)).toEqual(before);
  });
});

describe("plural", () => {
  it("counts", () => {
    expect(plural(1, "report")).toBe("1 report");
    expect(plural(0, "game")).toBe("0 games");
  });
});
