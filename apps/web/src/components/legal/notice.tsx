// SPDX-License-Identifier: AGPL-3.0-only
import { A, type Contents, LegalPage, List, Mail, Operator, P, Section, Strong } from "./doc";

/**
 * The legal notice (Impressum) under § 5 DDG, with the responsible person under § 18(2) MStV, the
 * statement on consumer arbitration under § 36 VSBG and the points of contact under Art. 11 and 12 of
 * the Digital Services Act. The EU online dispute resolution platform closed on 20 July 2025, so no
 * link to it belongs here.
 */

export const NOTICE_CONTENTS: Contents = [
  { id: "provider", title: "Provider" },
  { id: "contact", title: "Contact" },
  { id: "content", title: "Responsible for content" },
  { id: "dsa", title: "Points of contact under the EU Digital Services Act" },
  { id: "disputes", title: "Consumer arbitration" },
];

export function LegalNotice() {
  return (
    <LegalPage
      title="Legal notice"
      lead="Who runs AnyPlay at anyplaynet.com, and how to reach them. This is the Impressum required by § 5 of the German Digital Services Law (Digitale-Dienste-Gesetz, DDG)."
      contents={NOTICE_CONTENTS}
      current="legal"
    >
      <Section id="provider" title="Provider">
        <Operator />
        <P>AnyPlay is run by a private individual. There is no company, no commercial register entry and no VAT ID.</P>
      </Section>

      <Section id="contact" title="Contact">
        <List>
          <li>
            <Strong>General questions and this notice:</Strong> <Mail />
          </li>
          <li>
            <Strong>Data protection:</Strong> <Mail kind="privacy" />
          </li>
          <li>
            <Strong>Notices of illegal content:</Strong> <Mail kind="abuse" />
          </li>
        </List>
        <P>
          We read and answer in English and German. A person reads every message. We have no telephone number. Write an
          e-mail and we answer as soon as we can.
        </P>
      </Section>

      <Section id="content" title="Responsible for content">
        <P>
          Responsible for the content of this website under § 18(2) of the German Interstate Media Treaty (MStV):
        </P>
        <Operator />
      </Section>

      <Section id="dsa" title="Points of contact under the EU Digital Services Act">
        <P>
          Articles 11 and 12 of the EU Digital Services Act ask for one point of contact. This is ours. Authorities of the
          Member States, the European Commission and the European Board for Digital Services can use it. So can the
          people who use AnyPlay.
        </P>
        <List>
          <li>
            <Strong>E-mail:</Strong> <Mail />
          </li>
          <li>
            <Strong>Languages:</Strong> English and German.
          </li>
          <li>
            <Strong>Post:</Strong> the address above.
          </li>
        </List>
        <P>
          To tell us about content you think is illegal, write to <Mail kind="abuse" />. What to include is explained in the
          terms, in <A href="/terms#notices">Reporting illegal content</A>. To challenge a decision of ours, see{" "}
          <A href="/terms#appeal">Appeal</A> in the same terms.
        </P>
      </Section>

      <Section id="disputes" title="Consumer arbitration">
        <P>
          We do not take part in dispute resolution before a consumer arbitration board, and the law does not require us
          to (§ 36 of the German Consumer Dispute Resolution Act, VSBG). This is the statement that § 36 asks for. Your right to go to court stays as it is. So does the route for challenging decisions about your account that the
          terms describe.
        </P>
      </Section>
    </LegalPage>
  );
}
