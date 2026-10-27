# AnyPlay Web

The website and account web of [AnyPlay](https://anyplaynet.com), live at **[anyplaynet.com](https://anyplaynet.com)**. It is the browser side of the [AnyPlay cloud](https://github.com/anyplaynet/cloud); the [launcher](https://github.com/anyplaynet/launcher) is where you play.

## What you can do there

- **Get the launcher.** The landing page links the files of the latest [launcher release](https://github.com/anyplaynet/launcher/releases).
- **Sign in or create an account** with a passkey or a code sent by e-mail. The launcher's own sign-in opens the same pages.
- **Manage your account:** profile, friends, trophies, notifications, security (passkeys, launchers, browsers), privacy, connections (Discord, Steam) and your data (export and deletion).
- **Share a profile.** Every player has a public page that shows only what that player allows.
- **Check how games run.** The compatibility list is built from players' answers to "How did it run?".
- **Read the legal pages:** legal notice, privacy notice and terms of use.

| Path | Page |
|---|---|
| `/` | Landing page and launcher download |
| `/sign-in`, `/create` | Sign-in and sign-up |
| `/account` | Account pages |
| `/u/{handle}` | Public profile |
| `/compatibility` | Compatibility list |
| `/boards/{title}/{board}` | Leaderboard of a game, read-only (where the cloud has leaderboards on) |
| `/legal`, `/privacy`, `/terms` | Legal notice, privacy notice, terms |

## How it is built

A Turborepo with one app and three packages.

```text
apps/web            the Next.js 16 app (React 19, Tailwind 4, Base UI, Motion)
packages/tokens     colour, type and motion tokens, fonts (SIL OFL)
packages/ui         shared parts: button, menu, dialog, motion with the reduced-motion gate
packages/api-client the portal API: types, the HTTP adapter and an in-memory mock
tooling/eslint      shared lint rules
```

The app has no auth logic of its own. Account pages call the cloud's JSON API and the cloud decides who may do what. Details are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Run it locally

You need Node 24 and pnpm 12.

```sh
pnpm install
pnpm dev            # http://127.0.0.1:4400, on a mock of the cloud
```

No cloud is needed in development. Before a pull request, run `pnpm lint`, `pnpm typecheck` and `pnpm test`.

## Deployment

The `Dockerfile` builds a standalone server. The cloud runs it on the same host name as the API, using [`deploy/compose.web.yaml`](https://github.com/anyplaynet/cloud/blob/main/deploy/compose.web.yaml). The cloud's [deploy guide](https://github.com/anyplaynet/cloud/blob/main/docs/deploy.md#the-website) has the steps.

Every merge to `main` builds the image in CI ([`docker` workflow](.github/workflows/docker.yml)) and pushes it to `ghcr.io/anyplaynet/web`, tagged with the commit and as `main`, with an attestation of its digest. The server pulls it instead of building the website itself: `cloud/deploy/update.sh ... --web-image sha256:<digest>` (the digest is in the run's job summary; see the cloud's [deploy guide](https://github.com/anyplaynet/cloud/blob/main/docs/deploy.md#deploying-a-prebuilt-image)). Without it the server builds the image from the checkout, as before.

### Run your own AnyPlay website

This repository holds no personal data and nothing that belongs to one instance. Your instance says who it is through environment variables. They are read by the server on every request, not at build time, so one image serves any instance and you change them with a restart. [`apps/web/.env.example`](apps/web/.env.example) is a template.

| Variable | Required | Meaning |
| --- | --- | --- |
| `SITE_URL` | yes | Public address of your instance, for example `https://play.example.org`. Used for canonical links and named in the legal texts. |
| `LEGAL_OPERATOR_NAME` | yes | Full name of the person or company that runs the instance. |
| `LEGAL_OPERATOR_STREET` | yes | Street and number of the postal address. |
| `LEGAL_OPERATOR_CITY` | yes | Postcode and city. |
| `LEGAL_OPERATOR_COUNTRY` | yes | Country. |
| `LEGAL_CONTACT_EMAIL` | yes | General contact, also the point of contact under the EU Digital Services Act. |
| `LEGAL_PRIVACY_EMAIL` | yes | Address for data protection requests. |
| `LEGAL_ABUSE_EMAIL` | yes | Address for notices of illegal content. |
| `LEGAL_AUTHORITY_NAME`, `_STREET`, `_CITY`, `_SITE` | no | The data protection authority named in the privacy notice. Set all four or none. |
| `COMMUNITY_DISCORD_URL` | no | Invite link to your community. Without it every Discord link is hidden. |

Nothing has a default. Whatever you leave out is left out of the pages: without the operator details the legal notice says that this instance has not published them yet, the privacy notice and the terms drop the operator block, and a missing e-mail address or link is not shown. Visitors never see variable names. The server logs one warning at start-up that lists what is missing, and `pnpm dev` shows a small hint on the legal notice.

The legal texts (legal notice, privacy notice, terms) are written for the AnyPlay service, including the hosting and e-mail providers it uses and German law. Before you publish an instance, have them reviewed for your own situation and edit `apps/web/src/components/legal/` where they differ.

## Contribute

The web repository is limited to the AnyPlay team until 2027-04-25. Issues, ideas and bug reports are welcome on the [AnyPlay Discord](https://discord.gg/9zYqf8fEsh). The launcher and network repositories already take outside contributions; the shared rules are in [CONTRIBUTING.md](https://github.com/anyplaynet/.github/blob/main/CONTRIBUTING.md).

## License

[AGPL-3.0-only](LICENSE). Third-party code, icons and fonts are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
