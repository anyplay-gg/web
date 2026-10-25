// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { joinPath, launcherJoinUrl, normalizeJoinCode, safeNext, withNext } from "./join";

describe("normalizeJoinCode", () => {
  it("takes 10 characters of the alphabet, in any case, and lower-cases them", () => {
    expect(normalizeJoinCode("ember23456")).toBe("ember23456");
    expect(normalizeJoinCode("EMBER23456")).toBe("ember23456");
    expect(normalizeJoinCode("23456789ab")).toBe("23456789ab");
  });

  it("refuses the wrong length", () => {
    for (const c of ["", "ember2345", "ember234567", " ember23456", "ember23456 "]) expect(normalizeJoinCode(c)).toBeNull();
  });

  it("refuses the characters left out of the alphabet: 0, 1, l and o", () => {
    for (const bad of ["0", "1", "l", "o", "O", "L"]) expect(normalizeJoinCode(`ember2345${bad}`)).toBeNull();
  });

  it("refuses anything that is not a plain code", () => {
    for (const c of ["ember2345-", "ember2345_", "ember2345/", "../../a-b", "ember2345é", "<script>x"]) expect(normalizeJoinCode(c)).toBeNull();
    expect(normalizeJoinCode(undefined)).toBeNull();
    expect(normalizeJoinCode(null)).toBeNull();
  });
});

describe("links", () => {
  it("builds the page and the launcher link from a code", () => {
    expect(joinPath("ember23456")).toBe("/join/ember23456");
    expect(launcherJoinUrl("ember23456")).toBe("anyps5://v1/join/ember23456");
  });
});

describe("safeNext", () => {
  it("keeps a join page of this site, in its canonical form", () => {
    expect(safeNext("/join/ember23456")).toBe("/join/ember23456");
    expect(safeNext("/join/EMBER23456")).toBe("/join/ember23456");
  });

  it("refuses everything else, so it can never be an open redirect", () => {
    for (const next of [
      "https://evil.example/join/ember23456",
      "//evil.example/join/ember23456",
      "/\evil.example",
      "/join/ember23456/",
      "/join/ember23456?x=1",
      "/join/ember23456#x",
      "/join/ember2345",
      "/join/../account",
      "/account",
      "/",
      "join/ember23456",
      "javascript:alert(1)",
      "",
    ])
      expect(safeNext(next), next).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(["/join/ember23456", "/join/ember23456"])).toBeNull();
  });
});

describe("withNext", () => {
  it("adds the way back to the sign-in and create addresses, escaped", () => {
    expect(withNext("/sign-in", "/join/ember23456")).toBe("/sign-in?next=%2Fjoin%2Fember23456");
    expect(withNext("/create", null)).toBe("/create");
  });
});
