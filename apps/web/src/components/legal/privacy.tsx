// SPDX-License-Identifier: AGPL-3.0-only
import { A, type Contents, type Fact, Facts, LegalPage, List, Mail, P, Section, Strong } from "./doc";
import { LEGAL } from "./meta";

/**
 * The privacy notice (GDPR Art. 12 to 14). Every sentence here describes what the cloud and this
 * website do today; the sources are crates/cloud in anyplaynet/cloud and apps/web here. When the code
 * changes, change the text in the same pull request, and raise LEGAL.version and the date.
 */

export const PRIVACY_CONTENTS: Contents = [
  { id: "who", title: "Who is responsible" },
  { id: "keep", title: "What we keep" },
  { id: "pc", title: "What your computer sends" },
  { id: "relays", title: "Relays" },
  { id: "website", title: "This website" },
  { id: "recipients", title: "Who gets your data" },
  { id: "choice", title: "Do you have to give it?" },
  { id: "rights", title: "Your rights" },
  { id: "delete", title: "Deleting your account" },
  { id: "automatic", title: "Automatic decisions" },
  { id: "young", title: "Children and young people" },
  { id: "changes", title: "Changes" },
];

const contract = "Contract: you asked for an account (GDPR Art. 6(1)(b)).";
const interest = "Our interest in a safe service (GDPR Art. 6(1)(f)).";

const KEPT: Fact[] = [
  {
    what: "E-mail address",
    why: "To send you a sign-in code and notices about your account (a new address, a deletion), and to find your account.",
    basis: contract,
    keep: "Until your account is deleted.",
  },
  {
    what: "Handle and account number",
    why: "So your friends can find you. Every signed-in player can look a handle up. Anyone who knows your handle can open your profile page, which shows only what you chose to show to everyone.",
    basis: contract,
    keep: "Until your account is deleted.",
  },
  {
    what: "Sign-in codes and sign-up permits",
    why: "To check the code you type. We store only a scrambled form of the code (a hash) next to your e-mail address.",
    basis: contract,
    keep: "A code for 10 minutes, with at most 5 tries. A sign-up permit for 15 minutes.",
  },
  {
    what: "Age and terms confirmations",
    why: "To show that you confirmed you are old enough, and which version of the terms you accepted. We do not ask for your date of birth.",
    basis: contract,
    keep: "Until your account is deleted.",
  },
  {
    what: "Your devices",
    why: "The name your launcher gives its computer, the system (Windows, Linux or macOS), when it was added and last used, and a scrambled copy of the key that keeps it signed in. It keeps you signed in and lets us notice a stolen sign-in.",
    basis: "Contract, and our interest in a safe service (GDPR Art. 6(1)(b) and (f)).",
    keep: "Until you sign the device out or delete your account. An account holds at most 10 devices; adding an 11th replaces the one used longest ago. The scrambled copy of a replaced key is kept for 30 days to spot a stolen one.",
  },
  {
    what: "Passkeys",
    why: "The name you gave the passkey, its public part, and when it was added and last used. Your fingerprint or face never leaves your device.",
    basis: contract,
    keep: "Until you remove the passkey or delete your account.",
  },
  {
    what: "Browser sessions and one cookie",
    why: "The sign-in on this website needs one cookie with a random value, so that the next page knows it is you. It is set when you open a sign-in page, it carries no other information, and it is deleted when you close the browser.",
    basis: (
      <>
        Contract. The cookie is needed for the service you asked for, so there is no cookie banner (§ 25(2) no. 2
        TDDDG).
      </>
    ),
    keep: "30 minutes after you last used it, and 4 hours at most.",
  },
  {
    what: "Friends, friend requests and blocks",
    why: "For your friend list. A block is private: the other person is not told.",
    basis: contract,
    keep: "Until you remove it or either account is deleted.",
  },
  {
    what: "Presence",
    why: "Whether you are online, which game and version you play, whether others can join you, and when you were last online. Friends see the first three. The last one is stored but not shown to anyone.",
    basis: contract,
    keep: "Only the latest state is kept, until your account is deleted.",
  },
  {
    what: "Game sessions and parties",
    why: "Your handle, an endpoint ID (the technical ID of your connection set-up, not your IP address), a relay address, a virtual address and your game title and version. A game can add up to 8 KB of its own data; we do not look inside it. Voice chat does not pass through our cloud service.",
    basis: contract,
    keep: "A session member is removed 30 seconds after the connection ends. A party member is removed 15 minutes after going offline.",
  },
  {
    what: "Messages",
    why: "The text, who wrote it, when, who is in the conversation and what each person has read. We can read messages on our server, because they are not end-to-end encrypted. We do not read them as a routine. A message comes to us when someone reports it.",
    basis: contract,
    keep: "30 days, then deleted. The messages you wrote are deleted at once when your account is deleted.",
  },
  {
    what: "Profile",
    why: "Your about text, favourite games, picture, play time per game and day, and trophies (game, trophy number, grade, time). Each part is shown to your friends only, unless you choose nobody or everyone. We resize every picture and drop its metadata.",
    basis: contract,
    keep: "Until you change or remove it, or delete your account.",
  },
  {
    what: "Connected accounts",
    why: "If you link Discord: your Discord user ID, the name and the avatar Discord shows. We never get your password and keep no Discord token. Your friends see the link unless you choose otherwise.",
    basis: contract,
    keep: "Until you unlink it or delete your account.",
  },
  {
    what: "Your IP address",
    why: "The server has to see it to answer you. We hold it in memory only, to stop abuse such as guessing codes. We do not write it to our database or our logs.",
    basis: interest,
    keep: "At most 1 hour, and it is gone when the server restarts.",
  },
  {
    what: "Reports",
    why: "Who reported whom, the reason, the text the reporter wrote (up to 1,000 characters), and a copy of what was reported: the handle and, if the report names one, the message. The copy stays when the message is deleted.",
    basis: (
      <>
        {interest} Where the law asks us to act on illegal content, a legal obligation (GDPR Art. 6(1)(c)).
      </>
    ),
    keep: "6 months after we decide, or 1 year after it was filed if nobody decided. A report stays if the reported person deletes their account. If the reporter deletes theirs, their name is erased from it.",
  },
  {
    what: "Warnings, mutes, bans and appeals",
    why: "The action, the rule and the reason, the end date, your appeal and the answer. A ban also holds your account number and a keyed hash of your e-mail address, so that the ban still holds if you come back with a new account and the same address.",
    basis: interest,
    keep: "A warning, a mute or a time-limited ban: 6 months after it ends or was given. A ban for good: until we lift it, and 6 months after. These records stay when you delete your account.",
  },
  {
    what: "Moderation log",
    why: "A line for every step a moderator takes: who, what, to whom, and why. It lets us show that decisions were fair.",
    basis: interest,
    keep: "3 years.",
  },
  {
    what: "Server logs",
    why: "To find faults. They hold no e-mail addresses, IP addresses or codes. Our web server writes no access log.",
    basis: interest,
    keep: "Each service keeps its newest 30 MB of log lines. Older lines are overwritten.",
  },
];

export function PrivacyNotice() {
  return (
    <LegalPage
      title="How AnyPlay handles your data"
      lead="This is the privacy notice for the AnyPlay cloud at anyplaynet.com. It says what we keep about you, why, for how long, and what you can do about it."
      summary={[
        "We keep what we need to run your account, your friends, your messages and your game sessions. Nothing else.",
        "We show no ads, sell no data, and use no analytics or tracking tools. This website loads nothing from other companies.",
        "We never see your game files, your saves or what happens inside a game.",
        <>
          You can download your data and delete your account on the{" "}
          <A href="/account/data">Your data</A> page whenever you like.
        </>,
        "Our server is in Germany. Two services we use work outside the EU, and we say which in “Who gets your data”.",
      ]}
      contents={PRIVACY_CONTENTS}
      other={{ href: "/terms", label: "Terms of use" }}
    >
      <Section id="who" title="Who is responsible">
        <P>
          The AnyPlay project, called “AnyPlay” or “we” here, runs this cloud. You can write to us at <Mail />. A person
          reads it. We have no data protection officer.
        </P>
      </Section>

      <Section id="keep" title="What we keep">
        <P>
          Here is every kind of data about you that the cloud keeps, why we need it, the legal basis (the reason the law
          lets us), and how long we keep it. Other players only see what is said below.
        </P>
        <Facts items={KEPT} />
        <P>
          We keep encrypted backup copies of the server for 14 days. A backup is not changed when you delete something, so
          deleted data can stay in a backup until that backup is 14 days old and removed.
        </P>
      </Section>

      <Section id="pc" title="What your computer sends">
        <P>
          The launcher and the net service on your PC send the cloud your sign-in key, the device name and system, the
          game you play, and the data other players need to connect to you. They keep your sign-in key in your system’s
          credential store, or in a protected file if your system has none. They do not upload your game files or saves.
        </P>
        <P>
          If you switch on <em>Record Network Calls</em>, the log stays on your PC unless you share it yourself.
        </P>
        <P>
          The launcher also asks GitHub for updates and recommended settings. GitHub sees your IP address when it does.
          See GitHub’s own privacy statement for what it does with it.
        </P>
      </Section>

      <Section id="relays" title="Relays">
        <P>
          When your PC cannot reach another player directly, your game traffic goes through a relay. We run it on our
          server in Germany. The traffic is encrypted from your PC to the other player’s PC, so the relay cannot read
          it. The relay does see your IP address and your account number while you are connected. Our own code does not
          store that pair and does not log connections. You can switch on relay-only mode in the
          launcher so that other players never see your IP address.
        </P>
      </Section>

      <Section id="website" title="This website">
        <List>
          <li>No analytics, no ads, no tracking tools, and no error-reporting service in your browser.</li>
          <li>
            Everything on the page, including fonts and pictures, comes from anyplaynet.com. The page loads nothing
            from other companies.
          </li>
          <li>The only cookie is the sign-in cookie described under “What we keep”. We store nothing else in your browser.</li>
          <li>
            The download menu shows the newest launcher. Our server asks GitHub for it, so GitHub does not see you. When
            you choose a download or the Discord invite, you leave this website and that service sees you.
          </li>
        </List>
      </Section>

      <Section id="recipients" title="Who gets your data">
        <List>
          <li>
            <Strong>Other players</Strong> see your handle, your presence and the session data above, as described. What
            your profile shows depends on your choices on the <A href="/account/privacy">Privacy</A> page.
          </li>
          <li>
            <Strong>Contabo GmbH</Strong>, Germany, rents us the server. Our database and the relay run on it.
          </li>
          <li>
            <Strong>Cloudflare, Inc.</Strong>, USA, runs our DNS and passes this website’s and the cloud’s traffic
            through its network. It sees your IP address and the requests you make, and it can handle them in data
            centres outside the EU. It relies on the EU Standard Contractual Clauses and on its certification under the
            EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <Strong>Resend</Strong> (Plus Five Five, Inc.), USA, sends our e-mails: sign-in codes and account notices.
            It sees your e-mail address and the message, and it stores them in the USA. It relies on the EU Standard
            Contractual Clauses and on its certification under the EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <Strong>Discord Inc.</Strong>, USA, only if you link Discord. You sign in at Discord, not with us, and
            Discord tells us your user ID, name and avatar.
          </li>
          <li>
            <Strong>Authorities</Strong>, only when the law requires it, for example a court order, and when we must
            report a threat to someone’s life (Digital Services Act, Art. 9, 10 and 18).
          </li>
        </List>
        <P>We do not sell your data and do not share it with anyone else.</P>
      </Section>

      <Section id="choice" title="Do you have to give it?">
        <P>
          To have an account we need your e-mail address and a handle. Without them we cannot create it. Everything else
          comes from a feature you use. If you do not want presence, do not start a game while signed in.
        </P>
      </Section>

      <Section id="rights" title="Your rights">
        <P>You have these rights under the GDPR (Art. 15 to 21):</P>
        <List>
          <li>
            <Strong>Access and a copy.</Strong> On the <A href="/account/data">Your data</A> page you can download a file
            with your account, devices, passkeys, friends, requests and blocks, privacy choices, profile, picture,
            trophies, play time, connected accounts, party, conversations and your messages, your reports, the actions
            against you and your consent record. It does not hold your presence.
          </li>
          <li>
            <Strong>Correction.</Strong> You can change your e-mail address and your profile in your account. For
            anything else, ask us.
          </li>
          <li>
            <Strong>Erasure.</Strong> See “Deleting your account”.
          </li>
          <li>
            <Strong>Objection.</Strong> Where we rely on our own interest, you can object for reasons that concern your
            situation. We then stop, unless we show strong reasons that override yours, or we need the data for legal
            claims.
          </li>
          <li>
            <Strong>Restriction.</Strong> You can ask us to pause the use of your data in the cases the law lists.
          </li>
          <li>
            <Strong>Complaint.</Strong> You can complain to a data protection authority, for example in the country where
            you live or work. The{" "}
            <A href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">European Data Protection Board</A>{" "}
            lists them.
          </li>
        </List>
        <P>
          To use a right that has no button, write to <Mail />. We answer within one month and it is free. If we need to
          be sure that you are you, we may ask you to write from the e-mail address of the account. If we say no, we tell
          you why and how to complain.
        </P>
      </Section>

      <Section id="delete" title="Deleting your account">
        <P>
          On the <A href="/account/data">Your data</A> page, type your handle and confirm. You are signed out everywhere
          at once and we send a notice to your e-mail address. Your account is then deleted after{" "}
          <Strong>30 days</Strong>. Until then you can cancel by signing in again.
        </P>
        <P>
          Deleting removes your account, devices, passkeys, friends, requests, blocks, presence, sessions, party, profile,
          picture, trophies, play time, connected accounts and the messages you wrote. It does not remove the records about
          reports, warnings, mutes, bans and appeals, nor the moderation log. They stay for the times given under “What
          we keep”. Reports you filed lose your name.
        </P>
      </Section>

      <Section id="automatic" title="Automatic decisions">
        <P>
          Nobody is banned by a computer alone. A person decides every warning, mute and ban. The cloud applies a few
          automatic limits: you must wait after too many sign-in attempts or reports, and an account less than 24 hours
          old cannot start a conversation with someone who is not its friend. These only ask you to wait. They are not
          decisions with legal effect on you.
        </P>
      </Section>

      <Section id="young" title="Children and young people">
        <P>
          You must be at least {LEGAL.minimumAge} to use AnyPlay. See the <A href="/terms#age">terms, section “Age”</A>.
          We do not ask for your date of birth. When you sign up you confirm once that you are old enough, and we store
          the date you did. We use no data for ads or profiles. If you are under {LEGAL.minimumAge}, tell a parent. A
          parent can write to <Mail /> and we delete the account.
        </P>
      </Section>

      <Section id="changes" title="Changes">
        <P>
          We change this text when the service changes. The date and version at the top say when. If a change matters to
          you, we tell you on this website or in the launcher before it takes effect.
        </P>
      </Section>
    </LegalPage>
  );
}
