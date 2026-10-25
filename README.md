# AnyPlay Web

The website and account web of [AnyPlay](https://anyplaynet.com): the landing page, sign-in and sign-up, account pages and public player profiles. It is the browser side of the [AnyPlay cloud](https://github.com/anyplaynet/cloud); the [launcher](https://github.com/anyplaynet/launcher) is the place to play.

## Use it

Open **[anyplaynet.com](https://anyplaynet.com)**. The landing page links the latest launcher download. Sign in or create an account with a passkey or a code by e-mail; the launcher's own sign-in opens the same pages.

## What's inside

| Path | What it is |
|---|---|
| `/` | The landing page, with a download menu for the latest [launcher release](https://github.com/anyplaynet/launcher/releases) |
| `/sign-in`, `/create` | Sign-in and sign-up |
| `/account` | Profile, friends, trophies, security (passkeys, launchers, browsers), privacy, connections (Discord, Steam) and your data (export, deletion) |
| `/u/{handle}` | A player's public profile, showing only what that player lets the visitor see |
| `/legal`, `/privacy`, `/terms` | The legal notice, the privacy notice and the terms of use |

## Status

Live, and being redesigned.

## Build and contribute

You need Node 24 and pnpm 12.

```sh
pnpm install
pnpm dev            # http://127.0.0.1:4400, on a mock of the cloud
```

Before a pull request run `pnpm lint`, `pnpm typecheck` and `pnpm test`. How the app is built, the mock states, the browser tests and how to deploy it are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Until the network is live, only the AnyPlay team opens issues and pull requests; see [CONTRIBUTING.md](https://github.com/anyplaynet/.github/blob/main/CONTRIBUTING.md).

## Community

Questions and ideas: the [AnyPlay Discord](https://discord.gg/9zYqf8fEsh).

## License

[AGPL-3.0-only](LICENSE). Third-party code, icons and fonts are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
