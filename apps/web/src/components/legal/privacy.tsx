// SPDX-License-Identifier: AGPL-3.0-only
import { A, type Contents, type Fact, Facts, LegalPage, List, Mail, Operator, P, Section, Strong } from "./doc";
import { readSite } from "@/lib/site";
import { LEGAL, readLegal } from "./meta";

/**
 * The privacy notice (GDPR Art. 12 to 14). Every sentence here describes what the cloud, the launcher
 * and this website do today; the sources are crates/cloud in anyplaynet/cloud, apps/web here, and the
 * inventory in docs/compliance/data-inventory.md of the cloud. When the code changes, change the text
 * in the same pull request, and raise LEGAL.version and the date.
 */

export const PRIVACY_CONTENTS: Contents = [
  { id: "who", title: "Who is responsible" },
  { id: "keep", title: "What we keep" },
  { id: "pc", title: "What your computer sends" },
  { id: "relays", title: "Relays and voice" },
  { id: "website", title: "This website" },
  { id: "recipients", title: "Who gets your data" },
  { id: "choice", title: "Do you have to give it?" },
  { id: "rights", title: "Your rights" },
  { id: "delete", title: "Deleting your account" },
  { id: "backups", title: "Backups" },
  { id: "automatic", title: "Automatic decisions" },
  { id: "young", title: "Children and young people" },
  { id: "changes", title: "Changes" },
];

const contract = "Contract: you asked for an account (GDPR Art. 6(1)(b)).";
const interest = "Our interest in a safe service (GDPR Art. 6(1)(f)).";
const untilDeleted = "Until your account is deleted.";

const KEPT: Fact[] = [
  {
    what: "E-mail address",
    why: "To send you a sign-in code and notices about your account (a new address, a deletion), and to find your account. Nobody else sees it.",
    basis: contract,
    keep: "Until your account is deleted. When you change the address, the old one is overwritten and gets a notice.",
  },
  {
    what: "Handle, account number and the date you joined",
    why: "So your friends can find you. A handle cannot be changed. Anyone, signed in or not, who knows your handle can open your profile page and see your handle and account number, and whatever parts of your profile you set to “everyone”.",
    basis: contract,
    keep: untilDeleted,
  },
  {
    what: "Sign-in codes and sign-up permits",
    why: "To check the code you type. We store only a scrambled form of the code (a hash) next to your e-mail address.",
    basis: contract,
    keep: "A code for 10 minutes, with at most 5 tries. A sign-up permit for 15 minutes.",
  },
  {
    what: "Age and terms confirmations",
    why: "To show that you confirmed you are old enough, and which version of the terms you accepted and when. We do not ask for your date of birth.",
    basis: contract,
    keep: "Until your account is deleted. Only the newest version you accepted is kept.",
  },
  {
    what: "Your devices",
    why: "The name your launcher gives its computer (the name of your PC), the system (Windows, Linux or macOS), when it was added and last used, and a scrambled copy of the key that keeps it signed in. It keeps you signed in and lets us notice a stolen sign-in.",
    basis: "Contract, and our interest in a safe service (GDPR Art. 6(1)(b) and (f)).",
    keep: "Until you sign the device out or delete your account. An account holds at most 10 devices; adding an 11th replaces the one used longest ago. The scrambled copy of a replaced key is kept for at least 30 days to spot a stolen one. We do not remove devices you stop using, so sign them out yourself.",
  },
  {
    what: "Passkeys",
    why: "The name you gave the passkey, its public part, and when it was added and last used. Your fingerprint or face never leaves your device. Your handle is given to your device as the passkey’s name.",
    basis: contract,
    keep: "Until you remove the passkey or delete your account. A copy on your own device or in your password manager is yours to delete.",
  },
  {
    what: "Browser sessions and one cookie",
    why: "The sign-in on this website needs one cookie with a random value, so that the next page knows it is you. It is set when a page asks our server for a session, which includes the sign-in pages, your account pages and profile pages. It carries no other information, and it is deleted when you close the browser. We do not store your IP address or browser with it.",
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
    why: "For your friend list. A block is private: the other person is not told. Your friends can see in their feed that you became friends.",
    basis: contract,
    keep: "Until you remove it or either account is deleted.",
  },
  {
    what: "Presence",
    why: "Whether you are online, which game and version you play, whether others can join you, and when you were last online. Friends see the first three, unless you switched on “Appear offline” (on the Privacy page or in the launcher). The last one is stored but not shown to anyone.",
    basis: contract,
    keep: "Only the latest state is kept, until your account is deleted.",
  },
  {
    what: "Game sessions, parties and invitations",
    why: "Your handle, an endpoint ID (the technical ID of your connection set-up, not your IP address), a relay address, a virtual address and your game title and version. A game can add up to 8 KB of its own data; we do not look inside it. Members of a session or party see all of this. If a session is open to friends, the friends of every member can see it too.",
    basis: contract,
    keep: "A session member is removed 30 seconds after the connection ends. A party member is removed 15 minutes after going offline. An invitation lasts 15 minutes. The endpoint ID and the virtual address stay the same from one session to the next, so players can tell that it is you.",
  },
  {
    what: "Join codes",
    why: "A link you create so that someone can join you. We store a scrambled form of the code, not the code. Anyone who has the link can see, without an account, your handle, the game, how many are playing and the kind of session. If you share the link on Discord, Discord sees it.",
    basis: contract,
    keep: "2 hours, or until you revoke it.",
  },
  {
    what: "Calls and missed calls",
    why: "A call is an invitation that rings for 30 seconds. If nobody answers, the person you called sees a missed call from you. We store who called and when. We do not record calls and keep no call history.",
    basis: contract,
    keep: "A missed call: 30 days.",
  },
  {
    what: "Messages",
    why: "The text, who wrote it, when, who is in the conversation (direct, group or party chat) and what each person has read (the others in the conversation see that). We can read messages on our server, because they are not end-to-end encrypted. We do not read them as a routine. A message comes to us when someone reports it.",
    basis: contract,
    keep: "30 days after it was sent, then deleted. A conversation with no new messages for 30 days is deleted.",
  },
  {
    what: "Reactions to messages",
    why: "If you answer a message with one of six reactions (nice, love, laugh, gg, wow, sad): which message, your account and the reaction. You have one reaction per message; choosing another replaces it. The members of the conversation who can see the message see the reaction and who set it. If you and the person who reacted have blocked each other, you do not see it.",
    basis: contract,
    keep: "Until you remove it, the message is deleted (30 days after it was sent) or the message is unsent, whichever comes first. Deleting your account removes your reactions.",
  },
  {
    what: "Edited and unsent messages",
    why: "You can change the text of your own message for 15 minutes after you sent it, up to 20 times. The people in the conversation then see the new text and that it was edited, and when. You can also unsend a message at any time while it exists: its text disappears for everyone at once and a marker stays in the conversation. The old text of an edited or unsent message cannot be opened by the people in the conversation. We keep it only so that a report can be judged on what the reporter saw. A moderator reads it only when someone has reported that message. To keep the service fair, an account can make 60 edits, unsends and reactions per minute.",
    basis: contract,
    keep: "The old text: 7 days, then deleted (it also goes when the message is deleted). It is not part of the data you can download. A message that a report holds stays with the report.",
  },
  {
    what: "Screenshots and clips you send to a friend",
    why: "If you use “Send to a Friend” in the launcher: the file you chose (a PNG or JPEG screenshot of up to 10 MB, or an MP4 clip of up to 100 MB and 60 seconds), who sent it, when, and the conversation it is in. Only the friend you sent it to can open it: it goes into your direct conversation, never to strangers, message requests or groups, and we check who may open it on every request. We check the type, size and length of a file. We do not look at the picture and we do not remove metadata from it; screenshots made by the launcher have none. A file comes to us only when you press Send. If your friend reports it, a moderator can see it.",
    basis: contract,
    keep: "30 days after you sent it, then deleted. If you take the message back, nobody can open it at once, and we delete it after 7 days, unless a report holds it. A file that a report holds stays until 6 months after a moderator decides the report, or for 1 year after the report if nobody decides. It stays even if you delete your account, like the report.",
  },
  {
    what: "Looking-for-group listings",
    why: "If you use “Find Players”: the game, the way you want to play (online, LAN or Play Together), a language, a note of up to 140 characters, how many players you look for, and who asked to join. Every signed-in player who looks at the listings of that game sees your handle, the game, the mode, the language, your note and the free places, unless you blocked each other. Anyone you accept gets an invitation to your party. Your note is public to them: do not write personal data in it. We cannot tell which games a player owns; the launcher only asks for the listings of games in its own library.",
    basis: contract,
    keep: "A listing is open for 1 hour. We delete it, with its requests, a day after it closed. A ban closes your listings at once. A report of a listing keeps its note.",
  },
  {
    what: "Feed",
    why: "Short items that your friends see: a trophy you earned, a new friend, a game you played for the first time, a party. Friends can react to an item; you see how many reacted, not who. The setting “Feed” on the Privacy page can switch it off, and then nothing is recorded. We also keep the list of games we have seen you play, so that we can tell when a game is new for you.",
    basis: contract,
    keep: "A feed item: 90 days. The list of games: until your account is deleted.",
  },
  {
    what: "People you played with",
    why: "A private list for you, so you can add someone as a friend, open their profile or block them later. When you and another account were in the same party or session together for at least 2 minutes, we store that account, when it was last, and the title of the session (a party has none). The other person is not told and it shows on no profile. You see it in the launcher. A block hides the entry. The switch “Remember people I play with” on the Privacy page is on for a new account; when you turn it off, nothing new is added, and “Clear the list” on the same page removes what is there.",
    basis: contract,
    keep: "30 days after you last played together, and at most the latest 50 people. Deleted with either of the two accounts.",
  },
  {
    what: "Leaderboard scores",
    why: "When a game you play reports a score for one of its boards, we keep your best score on that board: the game's title ID, the board's number or name as the game gives it, the score, and when you reached it. We keep no history of earlier scores. Your friends see your entry and your rank on the board, unless you choose nobody; everyone includes people who are not signed in, who then see your handle, score and date on the board's public page. You always see your own entry. A block hides you and the other person from each other, and a banned account is not shown. A moderator can remove an entry and give a reason; the removal stays on the entry so the same score is not put back until a moderator restores it. We do not check the game: a score is what the game reports. The choice “Scores” starts at friends. You change it on this website, under Privacy in your account; the launcher does not show a setting for it yet.",
    basis: contract,
    keep: "Until you delete your account.",
  },
  {
    what: "Profile, trophies and play time",
    why: "Your about text, favourite games, picture, play time per game and day, trophies (game, trophy number, grade, time, and whether it is secret), the level and points we work out from them, and the reports you send about how a game ran (verdict, system, version). Each part is shown to your friends only, unless you choose nobody or everyone. “Everyone” includes people who are not signed in. A player who may see your trophies can compare them with their own. Your trophies also count in the anonymous share of players who earned a trophy, once at least 10 players have the game, whatever you set. We resize every picture and drop its metadata. A picture has a web address that does not need a sign-in, and a browser or proxy may keep a copy for up to a year.",
    basis: contract,
    keep: "Until you change or remove it, or delete your account. Game reports count for compatibility only when at least 3 players sent one.",
  },
  {
    what: "Connected accounts",
    why: "If you link Discord: your Discord user ID, the name and the avatar Discord shows. We never get your password and keep no Discord token. Your friends see the link unless you choose otherwise. The name and picture are a copy from the day you linked.",
    basis: contract,
    keep: "Until you unlink it or delete your account.",
  },
  {
    what: "Notification devices",
    why: "If you switch on notifications in a browser: the address of your browser’s push service, two keys that belong to it, the name of the browser and the kinds of notice you chose. A notice carries the title and the handle of the sender, never the text of a message.",
    basis: "Your request: you switched it on (GDPR Art. 6(1)(b)).",
    keep: "Until you switch it off, the push service says the device is gone, or 5 sends in a row fail. At most 10 devices.",
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
    keep: "6 months after we decide, or 1 year after it was filed if nobody decided. A report stays if the reported person deletes their account. If the reporter deletes theirs, their name is erased from it, but the text they wrote stays.",
  },
  {
    what: "Warnings, mutes, bans and appeals",
    why: "The action, the rule and the reason, the end date, your appeal and the answer. A ban also holds your account number and a keyed hash of your e-mail address, so that the ban still holds if you come back with a new account and the same address.",
    basis: interest,
    keep: "A warning or a mute: 6 months after it ends or was given. A time-limited ban: 6 months after it ends. A ban for good: until we lift it. When we lift a ban, we delete the ban and the hash of your e-mail address at once; the record of the action stays for 6 months more. These records stay when you delete your account.",
  },
  {
    what: "Moderation log",
    why: "A line for every step a moderator takes: who, what, to whom, and why. The reason can include the text of your appeal. It lets us show that decisions were fair.",
    basis: interest,
    keep: "3 years. It stays when you delete your account.",
  },
  {
    what: "Server logs",
    why: "To find faults. They hold no e-mail addresses, IP addresses or codes. A line about a sign-in or a ban can hold an account or device number. Our web server writes no access log.",
    basis: interest,
    keep: "Each service keeps its newest 30 MB of log lines. Older lines are overwritten.",
  },
];

export function PrivacyNotice() {
  const { operator, authority } = readLegal();
  const { host } = readSite();
  const site = host ?? "this website";
  return (
    <LegalPage
      title="Privacy notice"
      lead={`How AnyPlay handles your data. This notice is for the AnyPlay cloud ${host ? `at ${host}` : "you are using"}. It says what we keep about you, why, for how long, and what you can do about it.`}
      summary={[
        "We keep what we need to run your account, your friends, your messages and your game sessions. Nothing else.",
        "We show no ads, sell no data, and use no analytics or tracking tools. This website loads nothing from other companies.",
        "Messages are not end-to-end encrypted, and we keep them for 30 days.",
        "A screenshot or clip you send to a friend is stored on our server for 30 days and only your friend can open it. A looking-for-group listing is public to other players of that game for 1 hour.",
        "We never see your game files, your saves or what happens inside a game.",
        <>
          You can download your data and delete your account on the <A href="/account/data">Your data</A> page whenever
          you like.
        </>,
        "Our server is in the EU. A few services we use are in the USA, and we say which in the section on who gets your data.",
      ]}
      contents={PRIVACY_CONTENTS}
      current="privacy"
      mail="privacy"
    >
      <Section id="who" title="Who is responsible">
        <P>
          Under the GDPR, the one responsible for your data (the “controller”) is a private person, not a company{operator ? ":" : "."}
        </P>
        <Operator />
        <P>
          In this text, “we” means this person. For data protection write to <Mail kind="privacy" />. A person reads it. We have no
          data protection officer. The{" "}
          <A href="/legal">legal notice</A> has the other ways to reach us.
        </P>
      </Section>

      <Section id="keep" title="What we keep">
        <P>
          Here is every kind of data about you that the cloud keeps, why we need it, the legal basis (the reason the law
          lets us), and how long we keep it. Other players only see what is said below.
        </P>
        <Facts items={KEPT} />
      </Section>

      <Section id="pc" title="What your computer sends">
        <P>
          The launcher and the net service on your PC send the cloud your sign-in key, the device name and system, the
          game you play, and the data other players need to connect to you. They keep your sign-in key in your system’s
          credential store. If your system has none, they keep it in a file in your user folder that only you can read.
          That file is not encrypted. They do not upload your game files or saves.
          The launcher sends us no usage statistics and no crash reports.
        </P>
        <P>
          If you switch on <em>Record Network Calls</em>, the log stays on your PC unless you share it yourself.
        </P>
        <P>
          The launcher also asks GitHub for updates, the tools it needs, recommended settings and community layouts.
          GitHub sees your IP address when it does, and can see which game a layout was fetched for. See GitHub’s own
          privacy statement for what it does with that.
        </P>
        <P>
          If you use Discord, the launcher can show on your Discord profile which game you play and a button to join
          you. It does this through the Discord app on your PC, it is on by default, and you can switch it off in the launcher’s settings.
          Once a week, while a game starts, the launcher also asks Discord for its list of known games.
        </P>
      </Section>

      <Section id="relays" title="Relays and voice">
        <P>
          When your PC cannot reach another player directly, your game traffic goes through a relay. We run it on our own
          server. The traffic is encrypted from your PC to the other player’s PC, so the relay cannot read it. The relay
          does see your IP address, your account number and who you talk to, with the time and the amount of data, while
          you are connected. Our own code does not store that and does not log connections. You can switch on relay-only
          mode in the launcher so that other players never see your IP address.
        </P>
        <P>
          Voice chat and calls travel the same way, straight between the players or through our relay, encrypted. They do
          not pass through our cloud service, and we do not record them. If a party uses a Discord voice channel, Discord carries that voice.
        </P>
      </Section>

      <Section id="website" title="This website">
        <List>
          <li>No analytics, no ads, no tracking tools, and no error reports sent from your browser to anyone.</li>
          <li>
            Everything on the page, including fonts and pictures, comes from {site}. The page loads nothing from
            other companies.
          </li>
          <li>
            The only cookie is the sign-in cookie described in <A href="#keep">What we keep</A>. If you switch on notifications, your
            browser also stores a small service worker and one value in its local storage (<code>anyplay.push.device</code>
            ) so that it can show them. Switching notifications off removes the value. We store nothing else in your
            browser.
          </li>
          <li>
            The download menu shows the newest launcher. Our server asks GitHub for it, so GitHub does not see you. When
            you choose a download or the Discord invite, you leave this website and that service sees you.
          </li>
          <li>
            Pages, pictures and the web address of a profile are public if you set a part of your profile to
            “everyone”. Search engines are asked not to list profile pages.
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
            <Strong>Contabo GmbH</Strong>, Germany, rents us the server, in a data centre in the EU. Our database, our
            relay and our backups run on it. Contabo can reach everything on the server in the way any hosting company
            can.
          </li>
          <li>
            <Strong>Cloudflare, Inc.</Strong>, USA, runs the DNS of {site}, passes the visitors of
            www.{site} on to the main address, and forwards the e-mail we receive. When you open {site}
            itself, your request goes to our server and not through Cloudflare. It relies on the EU Standard
            Contractual Clauses and on its certification under the EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <Strong>Resend</Strong> (Plus Five Five, Inc.), USA, sends our e-mails: sign-in codes and account notices. It
            sees your e-mail address and the message, and stores them in the USA for up to 30 days. It relies on the EU
            Standard Contractual Clauses and on its certification under the EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <Strong>Google LLC</Strong>, USA, receives what you write to our e-mail addresses, because we read them in a
            Gmail inbox. It relies on its certification under the EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <Strong>GitHub, Inc.</Strong>, USA, only when your launcher checks for updates or downloads a tool, a setting
            or a layout. Your PC talks to GitHub directly; we do not send it your data. GitHub is certified under the
            EU-U.S. Data Privacy Framework.
          </li>
          <li>
            <Strong>Discord Inc.</Strong>, USA, only if you link Discord or use Discord with the launcher. You sign in
            at Discord, not with us, and Discord tells us your user ID, name and avatar. We send Discord no data about
            you. You start this yourself, which is the basis for the transfer (GDPR Art. 49(1)(a)).
          </li>
          <li>
            <Strong>The push service of your browser</Strong> (for example Google, Mozilla, Apple or Microsoft), only if
            you switch on notifications. It gets an encrypted notice and your subscription address. You start this
            yourself (GDPR Art. 49(1)(a)).
          </li>
          <li>
            <Strong>Authorities</Strong>, only when the law requires it, for example a court order, and when we must
            report a threat to someone’s life (Digital Services Act, Art. 9, 10 and 18).
          </li>
        </List>
        <P>
          We do not sell your data and do not share it with anyone else. We have not signed a data processing contract
          with every service above; where a service is a processor for us, we rely on its standard terms.
        </P>
      </Section>

      <Section id="choice" title="Do you have to give it?">
        <P>
          To have an account we need your e-mail address and a handle. Without them we cannot create it. Everything else
          comes from a feature you use. If you do not want presence, switch on “Appear offline”.
        </P>
      </Section>

      <Section id="rights" title="Your rights">
        <P>You have these rights under the GDPR (Art. 15 to 21):</P>
        <List>
          <li>
            <Strong>Access and a copy.</Strong> On the <A href="/account/data">Your data</A> page you can download a file
            with your account, devices, passkeys, friends, requests and blocks, privacy choices, profile, picture,
            trophies, play time, game reports, connected accounts, notification devices, party, feed items, the people you played with, your leaderboard scores and who may see them, conversations
            and your own messages and reactions, a list of the screenshots and clips you sent (not the files), your looking-for-group listings and requests, your reports, the actions against you and your consent record. It does not hold your
            presence, the list of games we saw you play, invitations, missed calls, your join code, the messages other
            people wrote to you, the old text of messages you edited or unsent, and the records about you that moderators keep. Write to us for those.
          </li>
          <li>
            <Strong>Correction.</Strong> You can change your e-mail address and your profile in your account. For
            anything else, ask us.
          </li>
          <li>
            <Strong>Erasure.</Strong> See <A href="#delete">Deleting your account</A>.
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
            you live or work.{" "}
            {authority && (
              <>
                The one responsible for us is the <A href={authority.site}>{authority.name}</A>, {authority.street},{" "}
                {authority.city}.{" "}
              </>
            )}
            The <A href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">European Data Protection Board</A>{" "}
            lists {authority ? "the others" : "them"}.
          </li>
        </List>
        <P>
          To use a right that has no button, write to <Mail kind="privacy" />. We answer within one month and it is free.
          If we need to be sure that you are you, we may ask you to write from the e-mail address of the account. If we
          say no, we tell you why and how to complain.
        </P>
      </Section>

      <Section id="delete" title="Deleting your account">
        <P>
          On the <A href="/account/data">Your data</A> page, type your handle and confirm. You are signed out everywhere
          at once and we send a notice to your e-mail address. Your account is then deleted after{" "}
          <Strong>30 days</Strong>. Until then you can cancel: sign in on this website and choose “Keep my account”. In those 30 days your profile stays
          as it is, so change its settings first if you want it hidden.
        </P>
        <P>
          Deleting removes your account, devices, passkeys, friends, requests, blocks, presence, sessions, party, join
          code, profile, picture, trophies, play time, game reports, feed items, the people you played with, your leaderboard scores, connected accounts, notification devices,
          the messages you wrote with their old texts, your reactions, the screenshots and clips you sent, and your looking-for-group listings and requests. A
          direct conversation is deleted as a whole, with what the other person wrote in it. Group conversations keep what
          others wrote. A screenshot or clip that a report holds stays until the report is decided and its 6 months are over, or for up to 1 year if nobody decides.
        </P>
        <P>
          It does not remove the records about reports, warnings, mutes, bans and appeals, nor the moderation log. They
          stay for the times given in <A href="#keep">What we keep</A>. Reports you filed lose your name. A feed item that belongs to
          a friend and mentions you can stay for up to 90 days. A picture can stay in a browser or proxy cache for up to a
          year, and a relay ticket for up to 24 hours.
        </P>
      </Section>

      <Section id="backups" title="Backups">
        <P>
          Every night the server saves an encrypted copy of its data, and keeps it for 14 days. We keep an encrypted copy
          on our own computer for up to 90 days. Before each update the server also saves a copy of its data. We keep the
          newest 14 of these copies and delete any that is older than 90 days. So deleted data can stay in a backup for up to 90 days. We use backups to restore the service
          after a failure, not to look at data. If we restore a backup, we delete again what was deleted since.
        </P>
      </Section>

      <Section id="automatic" title="Automatic decisions">
        <P>
          Nobody is banned by a computer alone. A person decides every warning, mute and ban. The cloud applies a few
          automatic limits: you must wait after too many sign-in attempts or reports, an account less than 24 hours old
          cannot start a conversation with someone who is not its friend or send more than 10 friend requests a day, and
          some handles, such as “admin”, cannot be chosen. These only ask you to wait or to choose another. They are not
          decisions with legal effect on you.
        </P>
      </Section>

      <Section id="young" title="Children and young people">
        <P>
          You must be at least {LEGAL.minimumAge} to use AnyPlay. See the <A href="/terms#age">terms, section “Age”</A>.
          We do not ask for your date of birth. When you sign up you confirm once that you are old enough, and we store
          the date you did. We use no data for ads or profiles. If you are under {LEGAL.minimumAge}, tell a parent. A
          parent can write to <Mail kind="privacy" /> and we delete the account.
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
