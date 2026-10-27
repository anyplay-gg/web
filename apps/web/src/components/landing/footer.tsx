// SPDX-License-Identifier: AGPL-3.0-only
import { readSite } from "@/lib/site";
import { Wordmark } from "./header";
import { LINKS } from "./links";

export function Footer() {
  const { discord } = readSite();
  return (
    <footer className="relative border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid w-full max-w-[1160px] gap-10 px-[var(--gutter)] py-14 md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-12 lg:gap-16">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-[22rem] text-[14px] leading-[1.6] text-ink-3">
            Open source on GitHub. Not affiliated with any console maker.
          </p>
        </div>
        <FooterColumn
          title="Product"
          links={[
            ["Download", LINKS.downloadPage],
            ["Release notes", LINKS.releases],
            ["Compatibility", LINKS.compatibility],
            ["Self-hosting", LINKS.selfHost],
          ]}
        />
        <FooterColumn
          title="Community"
          links={[
            ...(discord ? ([["Discord", discord]] as [string, string][]) : []),
            ["GitHub", LINKS.github],
          ]}
        />
        <FooterColumn
          title="Account"
          links={[
            ["Sign in", LINKS.signIn],
            ["Create an account", LINKS.createAccount],
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            ["Legal notice", LINKS.legal],
            ["Privacy notice", LINKS.privacy],
            ["Terms of use", LINKS.terms],
          ]}
        />
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <ul className="mt-2 md:mt-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="inline-flex min-h-11 items-center text-[14px] text-ink-3 transition-colors duration-[var(--duration-quick)] [@media(hover:hover)]:hover:text-ink"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
