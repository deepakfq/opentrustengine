import { Router, Request, Response } from 'express';
import { config } from '../config';
import { shopStore } from '../store/shop-store';
import { verifyShopifyWebhook } from './signature';
import { mapShopifyEvent } from './event-mapper';

export const webhookRouter = Router();

/**
 * Middleware: verify Shopify webhook HMAC signature.
 * The raw body is available because we use express.raw() on the /webhooks path in index.ts.
 */
function verifyWebhookMiddleware(req: Request, res: Response, next: Function): void {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
  if (!hmacHeader) {
    res.status(401).json({ error: 'Missing HMAC header' });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!verifyShopifyWebhook(rawBody, hmacHeader, config.shopifyApiSecret)) {
    res.status(401).json({ error: 'Invalid HMAC signature' });
    return;
  }

  // Parse the raw body into JSON and attach to request
  try {
    req.body = JSON.parse(rawBody.toString('utf-8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  next();
}

webhookRouter.use(verifyWebhookMiddleware);

/**
 * POST /webhooks/orders/create
 * Fired when a new order is placed.
 */
webhookRouter.post('/orders/create', async (req: Request, res: Response) => {
  // Return 200 immediately — Shopify expects a fast response
  res.status(200).send();

  await processWebhook('orders/create', req);
});

/**
 * POST /webhooks/orders/fulfilled
 * Fired when an order is fulfilled.
 */
webhookRouter.post('/orders/fulfilled', async (req: Request, res: Response) => {
  res.status(200).send();

  await processWebhook('orders/fulfilled', req);
});

/**
 * POST /webhooks/orders/cancelled
 * Fired when an order is cancelled.
 */
webhookRouter.post('/orders/cancelled', async (req: Request, res: Response) => {
  res.status(200).send();

  await processWebhook('orders/cancelled', req);
});

/**
 * POST /webhooks/refunds/create
 * Fired when a refund is created.
 */
webhookRouter.post('/refunds/create', async (req: Request, res: Response) => {
  res.status(200).send();

  await processWebhook('refunds/create', req);
});

/**
 * POST /webhooks/app/uninstalled
 * Fired when the merchant uninstalls the app.
 */
webhookRouter.post('/app/uninstalled', (req: Request, res: Response) => {
  res.status(200).send();

  const shop = req.headers['x-shopify-shop-domain'] as string;
  if (shop) {
    console.log(`App uninstalled from ${shop}, cleaning up`);
    shopStore.removeShop(shop);
  }
});

/**
 * Processes a webhook by mapping it to an OTE trust event and recording it.
 */
async function processWebhook(topic: string, req: Request): Promise<void> {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const payload = req.body;

  if (!shop) {
    console.error(`Webhook ${topic}: missing shop domain header`);
    return;
  }

  const mapping = shopStore.getEntityMapping(shop);
  if (!mapping) {
    console.error(`Webhook ${topic}: no entity mapping for ${shop}`);
    return;
  }

  const trustEvent = mapShopifyEvent(topic, payload);
  if (!trustEvent) {
    console.warn(`Webhook ${topic}: no event mapping found`);
    return;
  }

  try {
    // Record trust event via OpenTrustEngine API
    const response = await fetch(`${config.oteBaseUrl}/trust/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.oteApiKey,
        'X-API-Secret': config.oteApiSecret,
      },
      body: JSON.stringify({
        entityType: mapping.entityType,
        entityId: mapping.entityId,
        ...trustEvent,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`OTE API error for ${topic} (${shop}): ${response.status} ${text}`);
    } else {
      console.log(`Recorded trust event: ${trustEvent.eventType} for ${shop}`);
    }
  } catch (err) {
    console.error(`Failed to record trust event for ${topic} (${shop}):`, err);
  }
}
