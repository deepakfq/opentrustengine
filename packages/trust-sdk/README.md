# @ote/sdk

[![npm](https://img.shields.io/npm/v/@ote/sdk)](https://www.npmjs.com/package/@ote/sdk)
[![License: AGPLv3+Commercial](https://img.shields.io/badge/License-AGPLv3%20%2B%20Commercial-blue.svg)](LICENSE)

Official TypeScript / JavaScript SDK for [OpenTrustEngine](https://opentrustengine.com) and [OneTrustEngine](https://onetrustengine.com).

OpenTrustEngine is an explainable, multi-dimensional trust-scoring system that returns a 0–1200 score with an `AAA`–`DDD` band, computed from real commercial signals (payments, deliveries, disputes, reviews, KYC, and accounting filings).

## Install

```bash
npm install @ote/sdk
```

## Send trust events (free, public API)

```ts
import { OpenTrustEngine } from '@ote/sdk';

const ote = new OpenTrustEngine({
  apiKey: process.env.OTE_API_KEY!,
  apiSecret: process.env.OTE_API_SECRET!,
});

await ote.recordEvent({
  entityType: 'company',
  entityId: 'b1f2…',                // your internal UUID
  eventType: 'ESCROW_RELEASED',     // see types.ts for the full list
  role: 'seller',
  rawValue: 5000,
  metadata: { orderId: 'ord_123', isEscrowed: true },
});
```

## Read trust scores (paid, OneTrustEngine)

```ts
import { OneTrustEngine } from '@ote/sdk';

const one = new OneTrustEngine({
  apiKey: process.env.ONE_API_KEY!,
  apiSecret: process.env.ONE_API_SECRET!,
});

const profile = await one.getProfile('company', 'b1f2…');
console.log(profile.company.company_score);   // e.g. 872
console.log(profile.company.company_band);    // 'ABB' (Trusted)

const verify = await one.verify('company', 'b1f2…');
console.log(verify.verified, verify.score, verify.band);
```

## B2B trade credit

```ts
import { CreditEngine } from '@ote/sdk';

const credit = new CreditEngine({ apiKey: '…', apiSecret: '…' });
const recommendation = await credit.assessTradeCredit({
  buyerEntityId: '…',
  sellerEntityId: '…',
  proposedAmount: 50000,
  proposedTermsDays: 30,
});
```

## Webhooks

```ts
import { WebhookVerifier } from '@ote/sdk';

const verifier = new WebhookVerifier(process.env.OTE_WEBHOOK_SECRET!);

// Express
app.post('/webhooks/ote', verifier.middleware(), (req, res) => {
  // req.body is verified, typed as TrustWebhookEvent
  console.log(req.body.event);     // 'score.updated' | 'band.changed' | ...
  res.sendStatus(200);
});

// Manual
const isValid = verifier.verify(rawBody, req.headers['x-ote-signature']);
```

## Types

All events, roles, pillars, bands, and modes are strongly typed. See [`src/types.ts`](src/types.ts) for the full reference.

```ts
type TrustBand = 'AAA' | 'AAB' | 'ABB' | 'BBB' | 'BBC' | 'BCC' | 'CCC' | 'DDD';
type TrustRole = 'buyer' | 'seller' | 'employer' | 'worker' | 'freelancer' | 'organiser' | 'influencer' | 'investor';
```

## License

AGPL-3.0-or-later (or commercial) © Deepak Kumar Dwivedi, Freaquer
