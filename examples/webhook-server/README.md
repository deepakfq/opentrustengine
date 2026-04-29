# webhook-server — Express + @ote/connectors

Receives Razorpay webhooks, verifies the HMAC signature, normalises the event with `@ote/connectors`, and forwards it to OpenTrustEngine.

## Run

```bash
cp .env.example .env
# Edit .env with your real keys
npm install
npm start
# server on http://localhost:7700
```

In Razorpay dashboard, set webhook URL to `https://<your-tunnel>/webhooks/razorpay` and copy the signing secret into `RAZORPAY_WEBHOOK_SECRET`.

## What it does

1. Verifies `x-razorpay-signature` against `RAZORPAY_WEBHOOK_SECRET`
2. Maps `payment.captured` / `payment.failed` to canonical `TrustEvent`
3. Calls `ote.recordEvent(...)` to update the seller's score
4. Responds `200` only after a successful score update (Razorpay retry-friendly)

## Production hardening

This example skips: rate-limiting, raw-body parsing edge cases, retry queues, dead-letter handling. See `packages/trust-connectors/src/adapters/razorpay/` for the production adapter.
