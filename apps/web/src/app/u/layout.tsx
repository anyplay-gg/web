// SPDX-License-Identifier: AGPL-3.0-only
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

type Tree = Record<string, Record<string, unknown>>;

/**
 * Public profiles: the shared words and only the account words this page uses (the profile, the
 * compare card, the level meter, the trophy grades and the shared parts), not the security and
 * data texts of the signed-in area. Anyone can open this page, so it carries as little as it can.
 * A key missing here shows as a missing message in the profile e2e test.
 */
export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const { common, account } = (await getMessages()) as Tree;
  const { publicProfile, compare, level, state, ui, trophies } = account as Tree;
  return (
    <NextIntlClientProvider messages={{ common, account: { publicProfile, compare, level, state, ui, trophies: { grades: (trophies as Tree).grades } } }}>
      {children}
    </NextIntlClientProvider>
  );
}
