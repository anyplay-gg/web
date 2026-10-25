import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PRIVACY_CONTENTS, PrivacyNotice } from "./privacy";
import { LEGAL } from "./meta";
import { TERMS_CONTENTS, TermsOfUse } from "./terms";

const texts = {
  privacy: renderToStaticMarkup(createElement(PrivacyNotice)),
  terms: renderToStaticMarkup(createElement(TermsOfUse)),
};

describe.each(Object.entries(texts))("the %s text", (_name, html) => {
  it("has no placeholder left", () => {
    const text = html.replace(/<[^>]*>/g, " ");
    expect(text).not.toMatch(/\[[A-Z][A-Z ,'-]+\]|NOT IMPLEMENTED|CONFIRM|\bdraft\b|TODO/);
  });
  it("names no console maker or platform", () => {
    expect(html.replace(/AnyPS5/g, "")).not.toMatch(/playstation|\bpsn\b|sony|xbox|nintendo/i);
  });
  it("names no person and gives the one address", () => {
    expect(html).toContain(LEGAL.contact);
    expect(html).not.toMatch(/support@/);
  });
  it("carries the version and the date of the last change", () => {
    expect(html).toContain(`Version ${LEGAL.version}`);
    expect(html).toContain(LEGAL.changedText);
    expect(html).toContain(`dateTime="${LEGAL.changed}"`);
  });
  it("has no exclamation mark in the text", () => {
    expect(html.replace(/<[^>]*>/g, " ")).not.toContain("!");
  });
});

describe("the anchors", () => {
  it.each([
    ["privacy", PRIVACY_CONTENTS],
    ["terms", TERMS_CONTENTS],
  ] as const)("every entry of the %s contents leads to a section", (name, contents) => {
    for (const c of contents) expect(texts[name]).toContain(`id="${c.id}"`);
  });
  it("links between the texts reach existing sections", () => {
    const ids = (cs: { id: string }[]) => cs.map((c) => c.id);
    for (const [from, to] of [
      [texts.privacy, TERMS_CONTENTS],
      [texts.terms, PRIVACY_CONTENTS],
    ] as const) {
      const targets = [...from.matchAll(/href="\/(?:terms|privacy)#([a-z]+)"/g)].map((m) => m[1]);
      for (const t of targets) expect(ids(to)).toContain(t);
    }
  });
});
