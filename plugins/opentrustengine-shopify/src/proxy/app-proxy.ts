import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { shopStore } from '../store/shop-store';

export const proxyRouter = Router();

/**
 * Verifies the Shopify App Proxy signature.
 * Shopify sends query parameters signed with the app's shared secret.
 */
function verifyAppProxySignature(query: Record<string, any>): boolean {
  const { signature, ...params } = query;
  if (!signature) return false;

  // Sort parameters and build the query string (key=value joined by nothing)
  const sortedKeys = Object.keys(params).sort();
  const message = sortedKeys.map((k) => `${k}=${params[k]}`).join('');

  const computed = crypto
    .createHmac('sha256', config.shopifyApiSecret)
    .update(message)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature as string),
    );
  } catch {
    return false;
  }
}

/**
 * GET /proxy/trust-score
 * Shopify App Proxy route — called from the storefront Liquid template
 * to fetch the trust score for display in the trust badge.
 */
proxyRouter.get('/trust-score', async (req: Request, res: Response) => {
  // Validate app proxy signature
  if (!verifyAppProxySignature(req.query as Record<string, any>)) {
    res.status(403).json({ error: 'Invalid signature' });
    return;
  }

  const shop = req.query.shop as string;
  if (!shop) {
    res.status(400).json({ error: 'Missing shop parameter' });
    return;
  }

  const mapping = shopStore.getEntityMapping(shop);
  if (!mapping) {
    res.status(404).json({ error: 'Shop not registered with OpenTrustEngine' });
    return;
  }

  try {
    // Fetch trust score from OpenTrustEngine API
    const response = await fetch(
      `${config.oteBaseUrl}/trust/score/${mapping.entityType}/${mapping.entityId}`,
      {
        headers: {
          'X-API-Key': config.oteApiKey,
          'X-API-Secret': config.oteApiSecret,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`OTE score fetch error for ${shop}: ${response.status} ${text}`);
      res.status(502).json({ error: 'Failed to fetch trust score' });
      return;
    }

    const scoreData = await response.json();

    // Return trust score data for the storefront widget
    res.json({
      shop,
      entityId: mapping.entityId,
      entityType: mapping.entityType,
      score: scoreData.score,
      tier: scoreData.tier,
      breakdown: scoreData.breakdown,
      lastUpdated: scoreData.lastUpdated,
    });
  } catch (err) {
    console.error(`Error fetching trust score for ${shop}:`, err);
    res.status(500).json({ error: 'Internal error fetching trust score' });
  }
});
