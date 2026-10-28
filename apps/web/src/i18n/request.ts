// SPDX-License-Identifier: AGPL-3.0-only
import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, LOCALE_HEADER, parseLocale, resolveLocale } from "./config";
import { loadMessages } from "./messages";

/**
 * The language of this request. The proxy (src/proxy.ts) has already weighed `?lang=`, the cookie
 * and Accept-Language and says the result in a header; when it did not run (a test), the same
 * weighing is done here from the cookie and Accept-Language.
 */
export default getRequestConfig(async () => {
  const h = await headers();
  const locale =
    parseLocale(h.get(LOCALE_HEADER)) ??
    resolveLocale({ cookie: (await cookies()).get(LOCALE_COOKIE)?.value, acceptLanguage: h.get("accept-language") });
  return { locale, messages: await loadMessages(locale) };
});
