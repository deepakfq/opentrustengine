/**
 * basic-usage — record an event, read the profile.
 *
 * Get your free API key at https://opentrustengine.com
 * Then:  cp .env.example .env  &&  npm start
 */
import 'dotenv/config';
import { OpenTrustEngine, OneTrustEngine } from '@ote/sdk';

const COMPANY_ID = '00000000-0000-4000-8000-000000000001';

async function main() {
  // Free public API — write events
  const ote = new OpenTrustEngine({
    apiKey: process.env.OTE_API_KEY!,
    apiSecret: process.env.OTE_API_SECRET!,
  });

  const result = await ote.recordEvent({
    entityType: 'company',
    entityId: COMPANY_ID,
    eventType: 'ESCROW_RELEASED',
    role: 'seller',
    rawValue: 5_000,
    metadata: { orderId: 'demo-1', isEscrowed: true },
  });
  console.log('✓ event recorded',
    `delta=${result.delta >= 0 ? '+' : ''}${result.delta}`,
    `newScore=${result.newScore}`,
    `newBand=${result.newBand}`);

  // Paid OneTrust API — read profile + verification
  // (you can use the same OTE_API_KEY if you only have free-tier access)
  const one = new OneTrustEngine({
    apiKey: process.env.ONE_API_KEY ?? process.env.OTE_API_KEY!,
    apiSecret: process.env.ONE_API_SECRET ?? process.env.OTE_API_SECRET!,
  });

  const profile = await one.getProfile('company', COMPANY_ID);
  console.log('profile:', {
    company_score: profile.company.company_score,
    company_band: profile.company.company_band,
    confidence: profile.company.company_confidence,
    pillars: profile.roles[0]?.pillars.length ?? 0,
  });

  const verify = await one.verify('company', COMPANY_ID);
  console.log('verify: ', { verified: verify.verified, score: verify.score, band: verify.band });
}

main().catch((e) => { console.error(e); process.exit(1); });
