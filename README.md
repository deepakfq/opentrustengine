# OpenTrustEngine

> Open multi-dimensional trust scoring infrastructure for commerce, workforce, and compliance.

[![npm](https://img.shields.io/npm/v/@ote/sdk?label=%40ote%2Fsdk)](https://www.npmjs.com/package/@ote/sdk)
[![License: AGPLv3+Commercial](https://img.shields.io/badge/License-AGPLv3%20%2B%20Commercial-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/site-opentrustengine.com-blue)](https://opentrustengine.com)

OpenTrustEngine (OTE) is an explainable, mathematically rigorous trust-scoring system that unifies signals from payment gateways, marketplaces, accounting software, and HR systems into a single 0–1200 score with an `AAA`–`DDD` band.

It is designed for the real world: small businesses, lenders, marketplaces, and government tenders that need a portable, verifiable, and legally admissible reputation signal.

## What's in this repo

| Package | What it does |
|---|---|
| [`@ote/sdk`](packages/trust-sdk) | TypeScript/JavaScript client for the OTE REST API |
| [`@ote/widget`](packages/trust-widget) | Embeddable trust badge widget (drop a single `<script>` on any site) |
| [`@ote/connectors`](packages/trust-connectors) | Universal connector framework — Razorpay, Cashfree, PayU, Shopify, WooCommerce, Tally |
| [`@ote/shopify`](plugins/opentrustengine-shopify) | Shopify app — automatic trust scoring for Shopify stores |
| [`@ote/tally-agent`](plugins/opentrustengine-tally) | Electron desktop agent — sync Tally ERP into OTE |
| [`opentrustengine-woocommerce`](plugins/opentrustengine-woocommerce) | WordPress / WooCommerce plugin |

## Quick start

```bash
npm install @ote/sdk
```

```ts
import { OpenTrustClient } from '@ote/sdk';

const ote = new OpenTrustClient({
  apiKey: process.env.OTE_API_KEY!,
  baseUrl: 'https://api.opentrustengine.com',
});

// Record a positive event
await ote.events.create({
  entityType: 'company',
  entityId: '<uuid>',
  eventType: 'ESCROW_RELEASED',
  role: 'seller',
  rawValue: 5000,
});

// Get the current trust profile
const profile = await ote.profile.get('company', '<uuid>');
console.log(profile.score, profile.band); // e.g. 872, 'ABB'
```

## Drop-in trust badge

```html
<script src="https://cdn.opentrustengine.com/widget.min.js"></script>
<div data-ote-widget data-entity-type="company" data-entity-id="<uuid>"></div>
```

## The model in one paragraph

OTE computes a trust score across **five pillars** with capped maximum points:

| Pillar | Cap |
|---|---:|
| Transaction discipline | 400 |
| Payment reliability | 300 |
| Consistency & volume | 250 |
| Dispute resolution | 150 |
| Peer feedback | 100 |
| **Total** | **1200** |

Each pillar uses the **Wilson lower bound** (binary outcomes), **Beta-shrunk mean** (ratings), and **exponential time decay** to compute a conservative rate, multiplied by a coverage factor `1 - exp(-n_eff / 20)` so cold-start entities cannot inflate. Scores map to triple-letter bands at expert-prescribed cutoffs (`AAA ≥ 1100`, `AAB ≥ 1000`, …, `DDD < 100`).

A composite **Overall Trust Score (OTS)** combines four sub-scores:

```
OTS = 1200 · ( 0.55·BTS̃ + 0.15·WTS̃ + 0.10·CTS̃ + 0.20·ITS̃ )
```

where `BTS` is business, `WTS` workforce, `CTS` compliance, `ITS` individual.

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Connectors  │───▶│  Trust API   │───▶│  Postgres +  │
│ (Razorpay,   │    │  (NestJS)    │    │   Redis      │
│  Shopify,    │    │              │    │              │
│  Tally, ...) │    └──────┬───────┘    └──────────────┘
└──────────────┘           │
                           ▼
                    ┌──────────────┐
                    │   SDK +      │
                    │   Widget     │
                    └──────────────┘
```

## Documentation

- API reference: <https://docs.opentrustengine.com>
- Hosted dashboard: <https://onetrustengine.com>
- Free public API: <https://api.opentrustengine.com>

## Contributing

Pull requests welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

OpenTrustEngine is **dual-licensed**:

- **[AGPL-3.0-or-later](LICENSE)** — free for open-source, internal, research, and AGPL-compliant SaaS use.
- **[Commercial license](LICENSE-COMMERCIAL.md)** — required for closed-source distribution or SaaS use without source disclosure. Contact **deepak@freaquer.com**.

If you call our hosted API at `api.opentrustengine.com` from your application via the SDK, you do **not** need a commercial license — the SDK is a network client.

Copyright © 2026 **Deepak Kumar Dwivedi, Freaquer**.
