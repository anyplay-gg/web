// SPDX-License-Identifier: AGPL-3.0-only
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { Locale } from "./config";
import en_common from "../../messages/en/common.json";
import en_auth from "../../messages/en/auth.json";
import en_account from "../../messages/en/account.json";
import tr_common from "../../messages/tr/common.json";
import tr_auth from "../../messages/tr/auth.json";
import tr_account from "../../messages/tr/account.json";
import de_common from "../../messages/de/common.json";
import de_auth from "../../messages/de/auth.json";
import de_account from "../../messages/de/account.json";
import es_common from "../../messages/es/common.json";
import es_auth from "../../messages/es/auth.json";
import es_account from "../../messages/es/account.json";
import fr_common from "../../messages/fr/common.json";
import fr_auth from "../../messages/fr/auth.json";
import fr_account from "../../messages/fr/account.json";
import pt_common from "../../messages/pt/common.json";
import pt_auth from "../../messages/pt/auth.json";
import pt_account from "../../messages/pt/account.json";

/** Wraps a component under test in the real words of one language (English by default): `render(<Intl>...</Intl>)`. */
const ALL: Record<Locale, Record<string, unknown>> = {
  en: { common: en_common, auth: en_auth, account: en_account },
  tr: { common: tr_common, auth: tr_auth, account: tr_account },
  de: { common: de_common, auth: de_auth, account: de_account },
  es: { common: es_common, auth: es_auth, account: es_account },
  fr: { common: fr_common, auth: fr_auth, account: fr_account },
  pt: { common: pt_common, auth: pt_auth, account: pt_account },
};

export function Intl({ children, locale = "en" }: { children: ReactNode; locale?: Locale }) {
  return (
    <NextIntlClientProvider locale={locale} messages={ALL[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
