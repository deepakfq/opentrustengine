# @ote/connectors

[![npm](https://img.shields.io/npm/v/@ote/connectors)](https://www.npmjs.com/package/@ote/connectors)
[![License: AGPLv3+Commercial](https://img.shields.io/badge/License-AGPLv3%20%2B%20Commercial-blue.svg)](LICENSE)

Universal connector framework for [OpenTrustEngine](https://opentrustengine.com). Normalises events from any platform — payment gateways, marketplaces, accounting software — into a single `TrustEvent` schema.

## Built-in adapters

| Source       | Status | Events emitted |
|---|---|---|
| Razorpay     | ✓ | `ESCROW_RELEASED`, `PAYMENT_LATE`, `CHARGEBACK` |
| Cashfree     | ✓ | `ESCROW_FUNDED`, `ESCROW_RELEASED`, `CHARGEBACK` |
| PayU         | ✓ | `ESCROW_RELEASED`, `REFUND` |
| Shopify      | ✓ | `ORDER`, `DISPATCH`, `RETURN` |
| WooCommerce  | ✓ | `ORDER`, `REVIEW_VERIFIED` |
| Tally ERP    | ✓ | `GST_FILED`, `INVOICE_PAID` |

## Install

```bash
npm install @ote/sdk @ote/connectors
```

## Use a built-in adapter

```ts
import express from 'express';
import { OpenTrustEngine } from '@ote/sdk';
import { razorpayAdapter } from '@ote/connectors';

const app = express();
const ote = new OpenTrustEngine({ apiKey: '…', apiSecret: '…' });

app.post('/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  razorpayAdapter({
    webhookSecret: process.env.RAZORPAY_SECRET!,
    onEvent: async (canonicalEvent) => {
      await ote.recordEvent(canonicalEvent);
    },
  })
);
```

## Write a custom adapter

```ts
import { defineAdapter, type CanonicalEvent } from '@ote/connectors';

export const myAdapter = defineAdapter({
  name: 'my-platform',
  verify: (rawBody, signature, secret) => /* HMAC verification */ true,
  toCanonical: (rawPayload): CanonicalEvent[] => {
    return [{
      entityType: 'company',
      entityId: rawPayload.merchant_id,
      eventType: 'ESCROW_RELEASED',
      role: 'seller',
      rawValue: rawPayload.amount_inr,
    }];
  },
});
```

## License

AGPL-3.0-or-later (or commercial) © Deepak Kumar Dwivedi, Freaquer
