// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { AREAS, loadMessages } from "./messages";

type Tree = { [key: string]: string | Tree };

/** Every leaf as `path -> text`. */
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    if (typeof v === "string") out[prefix + k] = v;
    else Object.assign(out, flatten(v, `${prefix}${k}.`));
  }
  return out;
}

/** The ICU arguments of a message, `{name}` and `{n, plural, ...}` alike, and the rich tags. */
function placeholders(text: string): string[] {
  const args = [...text.matchAll(/\{\s*([A-Za-z_][\w]*)\s*[,}]/g)].map((m) => m[1]!);
  const tags = [...text.matchAll(/<([A-Za-z]+)>/g)].map((m) => `<${m[1]}>`);
  return [...new Set([...args, ...tags])].sort();
}

describe("messages", () => {
  for (const area of AREAS) {
    describe(area, () => {
      for (const locale of LOCALES.filter((l) => l !== "en")) {
        it(`${locale} has exactly the keys and placeholders of English`, async () => {
          const en = flatten(((await loadMessages("en", [area]))[area] ?? {}) as Tree);
          const other = flatten(((await loadMessages(locale, [area]))[area] ?? {}) as Tree);
          expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
          for (const key of Object.keys(en)) {
            expect(other[key], `${locale} ${area}.${key} is empty`).not.toBe("");
            expect(placeholders(other[key]!), `${locale} ${area}.${key}`).toEqual(placeholders(en[key]!));
          }
        });
      }
    });
  }
});
