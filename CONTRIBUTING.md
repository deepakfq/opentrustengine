# Contributing to OpenTrustEngine

Thanks for your interest. OpenTrustEngine is a fast-moving project; PRs and issues are welcome.

## Important: Contributor License Agreement (CLA)

OpenTrustEngine is **dual-licensed** — AGPL-3.0-or-later for the open-source community, and a commercial license for closed-source / proprietary SaaS use (see [LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md)).

To keep both licensing tracks viable, **every contribution must be licensed under both terms**. By opening a pull request you agree to the following:

> I represent that the contribution is my original work, or that I have the right to submit it under the project's license terms. I grant Freaquer (Deepak Kumar Dwivedi) a perpetual, irrevocable, worldwide, royalty-free licence to use, modify, sublicense, and distribute my contribution under (i) the AGPL-3.0-or-later, and (ii) any commercial licence offered by Freaquer.

The first time you open a PR, the **CLA bot** (or a maintainer) will ask you to confirm. Once accepted you will not be asked again.

This CLA is standard practice for projects with a commercial offering (MongoDB, Elastic, Sentry, Grafana, MariaDB, Tailscale, etc.) and is required so that the project can sustain itself by selling commercial licences to enterprises.

## Ground rules

- **Discussions before large PRs.** Open an issue first if your change touches the scoring math, the connector schema, or anything visible to integrators.
- **Stay backward compatible** in `@ote/sdk` minor versions.
- **Tests must pass.** Each package has its own test suite. Run `npm test` at the repo root.
- **No vendor lock-in in `connectors/`.** New connectors should follow the canonical event schema in `packages/trust-connectors/src/types.ts`.

## Local setup

```bash
git clone https://github.com/deepakfq/opentrustengine.git
cd opentrustengine
npm install
npm run build
```

## Project layout

```
opentrustengine/
├── packages/
│   ├── trust-sdk/            # TS client
│   ├── trust-widget/         # Embeddable badge
│   └── trust-connectors/     # Connector framework
├── plugins/
│   ├── opentrustengine-shopify/      # Shopify app
│   ├── opentrustengine-tally/        # Electron agent
│   └── opentrustengine-woocommerce/  # WordPress plugin
└── examples/
```

## Releasing

Maintainer-only:

```bash
npm version patch -w @ote/sdk
npm publish -w @ote/sdk
```

## Code of conduct

Be kind. Disagree about technical choices, never about people.
