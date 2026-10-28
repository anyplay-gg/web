import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { connection } from "next/server";
import { Monitoring } from "@/components/monitoring";
import { SiteProvider } from "@/components/site-context";
import { readSite } from "@/lib/site";
import "./globals.css";

// Per request: the instance's own address comes from the server's environment, not from the build.
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { url } = readSite();
  return {
  title: { default: "AnyPlay", template: "%s · AnyPlay" },
  description:
    "Play your AnyPS5 games together: friends, parties, voice chat and trophies, on an open network that anyone can host.",
  ...(url ? { metadataBase: new URL(url) } : {}),
  // The manifest comes from app/manifest.ts. On iPhone the install is "Add to Home Screen" and the
  // status bar blends into the night palette; the pages keep clear of it with the safe-area insets.
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "AnyPlay", statusBarStyle: "black-translucent" },
  };
}

// viewportFit "cover" lets the night ground run under the notch and the home bar; the shells pad
// their content with env(safe-area-inset-*). Zoom stays free: nothing here caps it.
export const viewport: Viewport = { themeColor: "#0b0a09", colorScheme: "dark light", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = readSite();
  const locale = await getLocale();
  // Only the shared words go to every page; the account flows add theirs in their own layouts.
  const { common } = (await getMessages()) as { common: Record<string, unknown> };
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={{ common }}>
          <SiteProvider site={site}>{children}</SiteProvider>
        </NextIntlClientProvider>
        <Monitoring />
      </body>
    </html>
  );
}
