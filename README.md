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

## Contribute

The web repository is limited to the AnyPlay team until 2027-04-25. Issues, ideas and bug reports are welcome on the [AnyPlay Discord](https://discord.gg/9zYqf8fEsh). The launcher and network repositories already take outside contributions; the shared rules are in [CONTRIBUTING.md](https://github.com/anyplaynet/.github/blob/main/CONTRIBUTING.md).

## License

[AGPL-3.0-only](LICENSE). Third-party code, icons and fonts are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
