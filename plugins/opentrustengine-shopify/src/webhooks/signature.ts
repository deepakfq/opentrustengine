import crypto from 'crypto';

/**
 * Verifies the HMAC-SHA256 signature on a Shopify webhook request.
 *
 * @param rawBody - The raw request body (Buffer or string)
 * @param hmacHeader - The value of the x-shopify-hmac-sha256 header (base64 encoded)
 * @param secret - The Shopify API secret
 * @returns true if the signature is valid
 */
export function verifyShopifyWebhook(
  rawBody: Buffer | string,
  hmacHeader: string,
  secret: string,
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmacHeader),
    );
  } catch {
    return false;
  }
}
