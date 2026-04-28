/**
 * Minimal end-to-end example: record an event and read the score back.
 *
 * Run:  npx tsx basic-usage.ts
 */
import { OpenTrustEngine, OneTrustEngine } from '@ote/sdk';

async function main() {
  // Free public API — write events
  const ote = new OpenTrustEngine({
    apiKey: process.env.OTE_API_KEY!,
    apiSecret: process.env.OTE_API_SECRET!,
  });

  await ote.recordEvent({
    entityType: 'company',
    entityId: '00000000-0000-4000-8000-000000000001',
    eventType: 'ESCROW_RELEASED',
    role: 'seller',
    rawValue: 5_000,
    metadata: { orderId: 'demo-1', isEscrowed: true },
  });
  console.log('✓ event recorded');

  // Paid OneTrust API — read profile + verification
  const one = new OneTrustEngine({
    apiKey: process.env.ONE_API_KEY!,
    apiSecret: process.env.ONE_API_SECRET!,
  });

  const profile = await one.getProfile('company', '00000000-0000-4000-8000-000000000001');
  console.log('profile:', profile.company.company_score, profile.company.company_band);

  const verify = await one.verify('company', '00000000-0000-4000-8000-000000000001');
  console.log('verify:', verify);
}

main().catch((e) => { console.error(e); process.exit(1); });
