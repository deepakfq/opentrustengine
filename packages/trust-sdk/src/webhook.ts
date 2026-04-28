import * as crypto from 'crypto';

export class WebhookVerifier {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Verify a webhook signature
   * @param rawBody - The raw request body as string
   * @param signature - The X-OTE-Signature header value (e.g. "sha256=abc123...")
   * @param timestamp - The X-OTE-Timestamp header value
   * @param tolerance - Max age in seconds (default 300 = 5 minutes)
   */
  verify(rawBody: string, signature: string, timestamp?: string, tolerance = 300): boolean {
    // Check timestamp tolerance (replay attack prevention)
    if (timestamp) {
      const ts = parseInt(timestamp);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - ts) > tolerance) {
        throw new Error(`Webhook timestamp too old. Received: ${ts}, Current: ${now}, Tolerance: ${tolerance}s`);
      }
    }

    // Compute expected signature
    const expectedSig = this.computeSignature(rawBody);
    const receivedSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;

    // Constant-time comparison
    if (expectedSig.length !== receivedSig.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig, 'hex'),
      Buffer.from(receivedSig, 'hex')
    );
  }

  /**
   * Compute HMAC-SHA256 signature for a payload
   */
  computeSignature(payload: string): string {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  /**
   * Express/Connect middleware for webhook verification
   */
  middleware() {
    const verifier = this;
    return (req: any, res: any, next: any) => {
      const signature = req.headers['x-ote-signature'];
      const timestamp = req.headers['x-ote-timestamp'];

      if (!signature) {
        return res.status(401).json({ error: 'Missing X-OTE-Signature header' });
      }

      // Need raw body - ensure express.raw() or body-parser with verify is used
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      try {
        const valid = verifier.verify(rawBody, signature, timestamp);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
        next();
      } catch (err: any) {
        return res.status(401).json({ error: err.message });
      }
    };
  }
}
