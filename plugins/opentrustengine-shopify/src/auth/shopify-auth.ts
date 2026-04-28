import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import https from 'https';
import { config } from '../config';
import { shopStore } from '../store/shop-store';

export const authRouter = Router();

/**
 * GET /auth
 * Redirects the merchant to the Shopify OAuth consent page.
 * Expects ?shop=mystore.myshopify.com
 */
authRouter.get('/', (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop || !isValidShopDomain(shop)) {
    res.status(400).json({ error: 'Missing or invalid shop parameter' });
    return;
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  shopStore.setNonce(shop, nonce);

  const redirectUri = `${config.appUrl}/auth/callback`;
  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${config.shopifyApiKey}` +
    `&scope=${config.shopifyScopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  res.redirect(installUrl);
});

/**
 * GET /auth/callback
 * Shopify redirects here after the merchant approves.
 * Exchanges the temporary code for a permanent access token,
 * stores it, and registers webhooks.
 */
authRouter.get('/callback', async (req: Request, res: Response) => {
  const { shop, hmac, code, state } = req.query as Record<string, string>;

  // Validate HMAC
  if (!verifyHmac(req.query as Record<string, string>)) {
    res.status(403).json({ error: 'HMAC validation failed' });
    return;
  }

  // Validate nonce
  const storedNonce = shopStore.getNonce(shop);
  if (!storedNonce || storedNonce !== state) {
    res.status(403).json({ error: 'Invalid state/nonce' });
    return;
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(shop, code);
    shopStore.setAccessToken(shop, accessToken);

    // Register webhooks
    await registerWebhooks(shop, accessToken);

    // Create OTE entity mapping for this shop
    shopStore.setEntityMapping(shop, {
      entityType: 'store',
      entityId: `shopify:${shop}`,
      shop,
    });

    res.send('OpenTrustEngine installed successfully! You can close this window.');
  } catch (err) {
    console.error('Auth callback error:', err);
    res.status(500).json({ error: 'Failed to complete installation' });
  }
});

/**
 * Verifies the HMAC signature on the OAuth callback query parameters.
 */
export function verifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...params } = query;
  if (!hmac) return false;

  // Sort and encode parameters
  const sortedKeys = Object.keys(params).sort();
  const message = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');

  const computed = crypto
    .createHmac('sha256', config.shopifyApiSecret)
    .update(message)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
  } catch {
    return false;
  }
}

/**
 * Exchanges the temporary authorization code for a permanent access token.
 */
function exchangeCodeForToken(shop: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: config.shopifyApiKey,
      client_secret: config.shopifyApiSecret,
      code,
    });

    const req = https.request(
      {
        hostname: shop,
        path: '/admin/oauth/access_token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.access_token) {
              resolve(parsed.access_token);
            } else {
              reject(new Error(`No access_token in response: ${data}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Registers webhooks with the Shopify store.
 */
async function registerWebhooks(shop: string, accessToken: string): Promise<void> {
  const topics = [
    'orders/create',
    'orders/fulfilled',
    'orders/cancelled',
    'refunds/create',
    'app/uninstalled',
  ];

  for (const topic of topics) {
    const webhookPath = `/webhooks/${topic.replace('/', '/')}`;
    await registerSingleWebhook(shop, accessToken, topic, `${config.appUrl}${webhookPath}`);
  }
}

function registerSingleWebhook(
  shop: string,
  accessToken: string,
  topic: string,
  address: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      webhook: {
        topic,
        address,
        format: 'json',
      },
    });

    const req = https.request(
      {
        hostname: shop,
        path: '/admin/api/2024-01/webhooks.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`Registered webhook: ${topic} for ${shop}`);
            resolve();
          } else {
            console.error(`Failed to register webhook ${topic}: ${data}`);
            // Don't reject — partial webhook registration shouldn't block install
            resolve();
          }
        });
      },
    );
    req.on('error', (err) => {
      console.error(`Webhook registration error for ${topic}:`, err);
      resolve(); // Don't block install
    });
    req.write(postData);
    req.end();
  });
}

function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}
