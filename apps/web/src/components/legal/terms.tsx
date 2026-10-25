// SPDX-License-Identifier: AGPL-3.0-only
import { A, type Contents, LegalPage, List, Mail, P, Section, Steps, Strong } from "./doc";
import { LEGAL } from "./meta";

/**
 * The terms of use. The shape follows DSA Art. 14: the rules for what you provide, how moderation
 * works (who decides, with what tools), and how to complain, in plain language. Every statement
 * about moderation describes the cloud today (docs/moderation.md in anyplay-gg/cloud). When the
 * code changes, change the text in the same pull request, and raise LEGAL.version and the date.
 */

export const TERMS_CONTENTS: Contents = [
  { id: "who", title: "Who we are" },
  { id: "service", title: "The service" },
  { id: "age", title: "Age" },
  { id: "account", title: "Your account" },
  { id: "rules", title: "The rules" },
  { id: "moderation", title: "What we do about rule breaks" },
  { id: "appeal", title: "Appeal" },
  { id: "notices", title: "Reporting illegal content" },
  { id: "content", title: "Your content and our rights" },
  { id: "liability", title: "Liability" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact" },
];

export function TermsOfUse() {
  return (
    <LegalPage
      title="Terms of use"
      lead="These are the rules for using AnyPlay at anyplaynet.com: what you can expect from us, what we expect from you, and what happens when someone breaks a rule."
      summary={[
        `You need to be at least ${LEGAL.minimumAge} years old.`,
        "Play only games you own. Do not use cheating tools. Do not build or use anything that pretends to be the server of a publisher whose service still runs.",
        "Be decent to other players. We remove people who are not.",
        "If we limit your account, we tell you why, and you can appeal.",
        "You can delete your account at any time.",
      ]}
      contents={TERMS_CONTENTS}
      other={{ href: "/privacy", label: "Privacy notice" }}
    >
      <Section id="who" title="Who we are">
        <P>
          The AnyPlay project (“we”) runs AnyPlay at anyplaynet.com, an online service for people who play with AnyPS5.
          For every question about these terms, for notices about content, for appeals and for authorities, write to{" "}
          <Mail />. It is our one address. A person reads it, and we read English and German.
        </P>
      </Section>

      <Section id="service" title="The service">
        <P>
          You can sign in, add friends, see who is online and what they play, start and join game sessions and parties,
          write messages, keep a profile with trophies, and connect your PC to other players through encrypted tunnels.
          It is free.
        </P>
        <P>
          We can change the service. If we ever end it, we tell you on this website or in the launcher before we do,
          where we can.
        </P>
      </Section>

      <Section id="age" title="Age">
        <List>
          <li>
            You must be at least <Strong>{LEGAL.minimumAge}</Strong> years old to open an account. When you sign up you
            confirm that you are old enough to agree to these terms on your own.
          </li>
          <li>We do not ask for your date of birth or an ID, and we do not check. We only store the date you confirmed.</li>
          <li>
            If we learn that someone is under {LEGAL.minimumAge}, we close the account and delete its data. Bans are the
            exception. A parent can ask us to do this at <Mail />.
          </li>
        </List>
      </Section>

      <Section id="account" title="Your account">
        <List>
          <li>
            Give a real e-mail address that you control. Keep your handle and your sign-in devices to yourself. Anyone
            with access to your e-mail can sign in as you.
          </li>
          <li>One person, one account.</li>
          <li>
            Handles cannot copy the name of our staff, and the service blocks some names, such as “admin” and the names
            of console makers.
          </li>
          <li>
            You can delete the account at any time on the <A href="/account/data">Your data</A> page. We delete your data as
            the <A href="/privacy#delete">privacy notice</A> says.
          </li>
        </List>
      </Section>

      <Section id="rules" title="The rules">
        <P>You promise to follow these rules.</P>
        <Steps>
          <li>
            <Strong>Only games you own.</Strong> Use AnyPlay only with games you legally own. Do not share, sell or use
            dumps, keys or accounts that are not yours.
          </li>
          <li>
            <Strong>No cheating tools.</Strong> Do not use tools that change a game to give you an unfair advantage, or
            that get around a game’s anti-cheat or copy protection. Do not use AnyPlay to harm another player’s game.
          </li>
          <li>
            <Strong>No stand-in for a running service.</Strong> Do not use AnyPlay, or write software that uses its
            interfaces, to pretend to be the servers of a game publisher or platform owner whose service still runs, to
            present yourself to such a service as a real console, or to issue, forge or pass on tokens or logins for
            someone else’s platform or publisher service.
          </li>
          <li>
            <Strong>No material from a console maker’s servers.</Strong> Do not send us material taken from a console
            maker’s servers, firmware or leaked documents, and do not post it to other players.
          </li>
          <li>
            <Strong>Be decent.</Strong> No harassment, hate, threats, sexual content involving minors, spam or
            impersonation. No illegal content, as the law of the EU or of a Member State defines it.
          </li>
          <li>
            <Strong>Keep the service working.</Strong> No attacks, no scraping, no automated sign-ups, and no attempt to
            get around limits or bans, including a new account after a ban.
          </li>
          <li>
            <Strong>Names.</Strong> Your handle must not be offensive and must not pretend to be someone else.
          </li>
          <li>
            <Strong>Other people’s data.</Strong> Do not put personal data of other people into the data fields that game
            sessions carry.
          </li>
        </Steps>
        <P>
          The launcher and the net service are open source. Their licence says how you may use and change the code.
          These terms say how you may use this service.
        </P>
      </Section>

      <Section id="moderation" title="What we do about rule breaks">
        <List>
          <li>
            <Strong>What we look at.</Strong> We act on reports from players, notices from anyone (also people without an
            account), orders from authorities, and what we find ourselves. We do not scan messages or game traffic. A
            message reaches us when someone reports it.
          </li>
          <li>
            <Strong>Who decides.</Strong> A person decides. The cloud applies automatic limits, such as waiting times on
            sign-in and reports, and a rule that an account under 24 hours old cannot start a conversation with someone
            who is not its friend. It never bans anyone by itself. Our moderators work from the report and the facts
            around it.
          </li>
          <li>
            <Strong>What we may do,</Strong> from light to heavy: warn you, mute you (no friend requests and no messages
            for some days), suspend your account for a time, or close it for good. We choose the lightest step that works.
            We act in a diligent, objective and proportionate way.
          </li>
          <li>
            <Strong>What a ban does.</Strong> It signs out all your devices, takes you out of your sessions and stops the
            same e-mail address from signing up again. We keep a record of the ban so that it holds if you delete the
            account. The <A href="/privacy#keep">privacy notice</A> says for how long.
          </li>
          <li>
            <Strong>What we tell you.</Strong> For every warning, mute or ban you get a statement of reasons: what we did,
            for how long, why (the facts, the rule, whether a report started it), that no computer decided alone, and how
            to appeal. You see it in the app and, if you are banned, when you try to sign in. We do not send it by e-mail.
          </li>
          <li>
            <Strong>We do not say who reported you,</Strong> unless the law requires it.
          </li>
          <li>
            <Strong>Reports in bad faith.</Strong> Each account can file a limited number of reports a day. If someone
            files many reports that are plainly unfounded, we may ignore their reports for a time, after a warning.
          </li>
        </List>
        <P>
          You can report a player in the launcher where it offers this, or write to <Mail /> with the handle and what
          happened.
        </P>
      </Section>

      <Section id="appeal" title="Appeal">
        <List>
          <li>
            You can appeal any warning, mute or ban, once for each, free of charge, within about 6 months (183 days) of
            it. If you are banned, sign in: the page shows the statement and a form for your appeal. If that does not work
            for you, write to <Mail />.
          </li>
          <li>Tell us why you think the step is wrong.</li>
          <li>
            A person who was not involved in the first decision looks again, where we have one. We answer as soon as we
            can. If the step was wrong, we undo it at once.
          </li>
          <li>
            If you still disagree, you can use an out-of-court dispute body that is certified under Article 21 of the
            Digital Services Act, ask a data protection authority about your data, or go to court.
          </li>
        </List>
      </Section>

      <Section id="notices" title="Reporting illegal content">
        <P>
          Anyone can tell us about content they think is illegal, with or without an account. Write to <Mail /> and give:
        </P>
        <List>
          <li>why you think it is illegal;</li>
          <li>exactly where it is, such as the handle, or the conversation and the time of the message;</li>
          <li>your name and e-mail address (you may leave them out for certain child-abuse offences);</li>
          <li>a statement that you believe the notice is accurate and complete.</li>
        </List>
        <P>
          We confirm that we got it, and we tell you what we decided and how to challenge it. We do not use automatic
          means to decide.
        </P>
      </Section>

      <Section id="content" title="Your content and our rights">
        <P>
          You keep what is yours. You give us the right to store and show your handle, your presence, your profile, your
          messages and the other data the service needs, to the people you choose, for as long as your account exists.
        </P>
      </Section>

      <Section id="liability" title="Liability">
        <P>
          AnyPlay is free and offered as it is. We try to keep it running and safe, but we cannot promise that it never
          breaks or loses data. Nothing in these terms limits a liability that the law does not allow us to limit, for
          example for intent or for harm to life, body or health. Your rights as a consumer under the law of your
          country stay as they are.
        </P>
      </Section>

      <Section id="changes" title="Changes">
        <P>
          If we change these terms in an important way, we tell you before it takes effect, and the next time you sign in
          we ask you to accept the new version. If you do not agree, you can delete your account.
        </P>
      </Section>

      <Section id="contact" title="Contact">
        <P>
          <Mail />. English or German.
        </P>
      </Section>
    </LegalPage>
  );
}
