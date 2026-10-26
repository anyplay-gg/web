import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readSite } from "@/lib/site";
import { LEGAL, readLegal } from "./meta";
import { NOTICE_CONTENTS, LegalNotice, noticeContents } from "./notice";
import { PRIVACY_CONTENTS, PrivacyNotice } from "./privacy";
import { TERMS_CONTENTS, TermsOfUse } from "./terms";

// Example data only: the repository holds no real operator.
const OPERATOR = {
  LEGAL_OPERATOR_NAME: "Jane Example",
  LEGAL_OPERATOR_STREET: "Example Street 1",
  LEGAL_OPERATOR_CITY: "12345 Exampletown",
  LEGAL_OPERATOR_COUNTRY: "Germany",
};
const INSTANCE = {
  ...OPERATOR,
  SITE_URL: "https://play.example.org",
  LEGAL_CONTACT_EMAIL: "contact@example.org",
  LEGAL_PRIVACY_EMAIL: "privacy@example.org",
  LEGAL_ABUSE_EMAIL: "abuse@example.org",
  LEGAL_AUTHORITY_NAME: "Example Data Protection Office",
  LEGAL_AUTHORITY_STREET: "Office Road 2",
  LEGAL_AUTHORITY_CITY: "54321 Officetown",
  LEGAL_AUTHORITY_SITE: "https://dpa.example.org",
};
const VARS = Object.keys(INSTANCE);

function render(env: Record<string, string>) {
  for (const k of VARS) vi.stubEnv(k, "");
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return {
    legal: renderToStaticMarkup(createElement(LegalNotice)),
    privacy: renderToStaticMarkup(createElement(PrivacyNotice)),
    terms: renderToStaticMarkup(createElement(TermsOfUse)),
  };
}

afterEach(() => vi.unstubAllEnvs());

const texts = render(INSTANCE);
const unset = render({});
const text = (html: string) => html.replace(/<[^>]*>/g, " ");

describe.each(Object.entries(texts))("the %s text", (_name, html) => {
  it("has no placeholder left", () => {
    const text = html.replace(/<[^>]*>/g, " ");
    expect(text).not.toMatch(/\[[A-Z][A-Z ,'-]+\]|NOT IMPLEMENTED|CONFIRM|\bdraft\b|TODO/);
  });
  it("names no console maker or platform", () => {
    expect(html.replace(/AnyPS5/g, "")).not.toMatch(/playstation|\bpsn\b|sony|xbox|nintendo/i);
  });
  it("names the operator, the postal address and the right addresses", () => {
    expect(html).toContain(OPERATOR.LEGAL_OPERATOR_NAME);
    expect(html).toContain(OPERATOR.LEGAL_OPERATOR_STREET);
    expect(html).toContain(OPERATOR.LEGAL_OPERATOR_CITY);
    expect(html.includes(INSTANCE.LEGAL_CONTACT_EMAIL) || html.includes(INSTANCE.LEGAL_PRIVACY_EMAIL)).toBe(true);
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
    expect(text).toContain(INSTANCE.LEGAL_ABUSE_EMAIL);
  });
  it("does not link the closed EU dispute platform", () => {
    expect(texts.legal).not.toMatch(/ec\.europa\.eu\/consumers\/odr|ODR/);
  });
});

describe("the privacy notice", () => {
  it("names the supervisory authority and its address", () => {
    expect(texts.privacy).toContain(INSTANCE.LEGAL_AUTHORITY_SITE);
    expect(texts.privacy).toContain(INSTANCE.LEGAL_AUTHORITY_STREET);
    expect(texts.privacy).toContain(INSTANCE.LEGAL_PRIVACY_EMAIL);
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

describe("without operator details", () => {
  it("makes the legal notice say which variables to set", () => {
    const t = text(unset.legal);
    expect(t).toContain("Operator details not published");
    expect(t).toContain("This instance has not published");
    // Visitors never see variable names or setup hints (the hint exists in development only).
    expect(unset.legal).not.toMatch(/LEGAL_|SITE_URL|environment variable/);
    expect(unset.legal).toContain("id=\"provider\"");
  });
  it("leaves the operator block out of the privacy notice and the terms", () => {
    for (const html of [unset.privacy, unset.terms]) {
      expect(html).not.toContain("<address");
      expect(html).not.toContain("not set its operator details");
      expect(html).not.toMatch(/LEGAL_OPERATOR/);
      expect(text(html)).not.toMatch(/:s*In this text|:s*These terms/);
    }
  });
  it("lists only the variables that are still missing", () => {
    const partial = render({ LEGAL_OPERATOR_NAME: "Jane Example" });
    expect(readLegal({ LEGAL_OPERATOR_NAME: "Jane Example" }).missing).toEqual([
      "LEGAL_OPERATOR_STREET",
      "LEGAL_OPERATOR_CITY",
      "LEGAL_OPERATOR_COUNTRY",
    ]);
    expect(partial.legal).not.toContain("<address");
    expect(partial.legal).not.toContain("Jane Example");
  });
  it("treats blank values as unset", () => {
    expect(readLegal({ ...OPERATOR, LEGAL_OPERATOR_CITY: "   " }).operator).toBeNull();
    expect(readLegal(OPERATOR).operator).toEqual({
      name: "Jane Example",
      street: "Example Street 1",
      city: "12345 Exampletown",
      country: "Germany",
    });
  });
  it("keeps every contents entry pointing at a section", () => {
    for (const c of noticeContents(false)) expect(unset.legal).toContain(`id="${c.id}"`);
    expect(unset.legal).not.toContain("id=\"content\"");
  });
  it("has no defaults for the instance: no addresses, no authority, no domain", () => {
    expect(readLegal({})).toMatchObject({ contact: null, privacy: null, abuse: null, authority: null });
    expect(readSite({})).toEqual({ url: null, host: null, discord: null });
    expect(unset.legal).not.toMatch(/mailto:|anyplaynet.com/);
    expect(unset.privacy).not.toMatch(/anyplaynet.com|datenschutz-berlin/);
    expect(text(unset.legal)).toContain("has not published a contact address");
  });
  it("reads the e-mail addresses and the authority from the environment", () => {
    expect(readLegal({ LEGAL_CONTACT_EMAIL: "hi@example.org" }).contact).toBe("hi@example.org");
    expect(readLegal(INSTANCE).authority?.name).toBe("Example Data Protection Office");
    expect(readLegal({ LEGAL_AUTHORITY_NAME: "Only a name" }).authority).toBeNull();
  });
  it("reads the site address and the community link, and ignores anything that is not a web address", () => {
    expect(readSite({ SITE_URL: "https://play.example.org/", COMMUNITY_DISCORD_URL: "https://discord.gg/abc" })).toEqual({
      url: "https://play.example.org",
      host: "play.example.org",
      discord: "https://discord.gg/abc",
    });
    expect(readSite({ SITE_URL: "javascript:alert(1)", COMMUNITY_DISCORD_URL: "nonsense" })).toEqual({
      url: null,
      host: null,
      discord: null,
    });
  });
  it("uses the instance host in the texts when it is set", () => {
    expect(text(texts.terms)).toContain("play.example.org");
    expect(text(texts.privacy)).toContain("play.example.org");
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
