import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LEGAL } from "./meta";
import { NOTICE_CONTENTS, LegalNotice } from "./notice";
import { PRIVACY_CONTENTS, PrivacyNotice } from "./privacy";
import { TERMS_CONTENTS, TermsOfUse } from "./terms";

const texts = {
  legal: renderToStaticMarkup(createElement(LegalNotice)),
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
  it("names the operator, the postal address and the right addresses", () => {
    expect(html).toContain(LEGAL.operator.name);
    expect(html).toContain(LEGAL.operator.street);
    expect(html.includes(LEGAL.contact) || html.includes(LEGAL.privacy)).toBe(true);
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
  it("links the other two legal pages in its foot", () => {
    for (const href of ["/legal", "/privacy", "/terms"]) expect(html).toContain(`href="${href}"`);
  });
});

describe("the legal notice", () => {
  it("has the statements the law asks for", () => {
    const text = texts.legal.replace(/<[^>]*>/g, " ");
    expect(text).toMatch(/§ 18\(2\)/);
    expect(text).toMatch(/§ 36/);
    expect(text).toMatch(/Articles 11 and 12/);
    expect(text).toContain(LEGAL.abuse);
  });
  it("does not link the closed EU dispute platform", () => {
    expect(texts.legal).not.toMatch(/ec\.europa\.eu\/consumers\/odr|ODR/);
  });
});

describe("the privacy notice", () => {
  it("names the supervisory authority and its address", () => {
    expect(texts.privacy).toContain(LEGAL.authority.site);
    expect(texts.privacy).toContain("Alt-Moabit 59–61");
    expect(texts.privacy).toContain(LEGAL.privacy);
  });
});

describe("the terms", () => {
  it("name the age, the notice period and the liability limits", () => {
    const text = texts.terms.replace(/<[^>]*>/g, " ");
    expect(text).toContain(`at least ${LEGAL.minimumAge}`);
    expect(text).toMatch(/30 days/);
    expect(text).toMatch(/Product Liability Act/);
    expect(text).toMatch(/typical/);
    expect(text).toMatch(/German law applies/);
  });
});

describe("the anchors", () => {
  it.each([
    ["legal", NOTICE_CONTENTS],
    ["privacy", PRIVACY_CONTENTS],
    ["terms", TERMS_CONTENTS],
  ] as const)("every entry of the %s contents leads to a section", (name, contents) => {
    for (const c of contents) expect(texts[name]).toContain(`id="${c.id}"`);
  });
  it("links between the texts reach existing sections", () => {
    const ids = (cs: { id: string }[]) => cs.map((c) => c.id);
    const targets = { privacy: PRIVACY_CONTENTS, terms: TERMS_CONTENTS, legal: NOTICE_CONTENTS };
    for (const [name, html] of Object.entries(texts)) {
      for (const m of html.matchAll(/href="\/(terms|privacy|legal)#([a-z]+)"/g)) {
        expect(ids(targets[m[1] as keyof typeof targets]), `${name} -> ${m[0]}`).toContain(m[2]);
      }
    }
  });
});
