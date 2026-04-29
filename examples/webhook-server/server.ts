/**
 * webhook-server — receive Razorpay webhooks, score the seller.
 */
import 'dotenv/config';
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { OpenTrustEngine } from '@ote/sdk';

const ote = new OpenTrustEngine({
  apiKey: process.env.OTE_API_KEY!,
  apiSecret: process.env.OTE_API_SECRET!,
});

function verifyRazorpaySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

interface RazorpayPayload {
  event: string;
  payload: {
    payment?: { entity: { id: string; amount: number; notes?: Record<string, string> } };
  };
}

const app = express();

app.post(
  '/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.header('x-razorpay-signature');
    if (!sig) return res.status(401).send('missing signature');
    if (!verifyRazorpaySignature(req.body, sig, process.env.RAZORPAY_WEBHOOK_SECRET!)) {
      return res.status(401).send('bad signature');
    }

    const body: RazorpayPayload = JSON.parse(req.body.toString());
    const payment = body.payload.payment?.entity;
    if (!payment) return res.status(400).send('no payment entity');

    // Convention: the seller's company UUID is stamped into payment.notes.seller_id
    const sellerId = payment.notes?.seller_id;
    if (!sellerId) return res.status(202).send('no seller_id, ignored');

    const eventType =
      body.event === 'payment.captured' ? 'ESCROW_RELEASED'
      : body.event === 'payment.failed' ? 'PAYMENT_LATE'
      : null;
    if (!eventType) return res.status(202).send(`unhandled event ${body.event}`);

    try {
      const result = await ote.recordEvent({
        entityType: 'company',
        entityId: sellerId,
        eventType,
        role: 'seller',
        rawValue: payment.amount / 100,         // Razorpay amount is paise
        metadata: { paymentId: payment.id },
      });
      console.log(
        `[ote] ${body.event} → ${eventType} for ${sellerId.slice(0, 8)}…`,
        `delta=${result.delta} score=${result.newScore} band=${result.newBand}`,
      );
      res.status(200).send('ok');
    } catch (err) {
      console.error('[ote] recordEvent failed', err);
      res.status(500).send('upstream error');                  // Razorpay will retry
    }
  },
);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

const PORT = parseInt(process.env.PORT ?? '7700', 10);
app.listen(PORT, () => console.log(`▶ webhook-server listening on :${PORT}`));
