# basic-usage — Node.js script

Records a positive trust event and reads the resulting profile back.

## Run

```bash
cp .env.example .env
# Edit .env with your real keys from https://opentrustengine.com
npm install
npm start
```

Expected output:

```
✓ event recorded   delta=+12  newScore=872  newBand=ABB
profile: { company_score: 872, company_band: 'ABB', confidence: 0.74, ... }
verify:  { verified: true, score: 872, band: 'ABB' }
```

## What it does

1. Records an `ESCROW_RELEASED` event for a sample company UUID
2. Fetches the resulting trust profile (5 pillars + bands + badges)
3. Calls the public `verify` endpoint (no auth required for verification)
