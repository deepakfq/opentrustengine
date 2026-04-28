import { createHmac } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class InstamojoAdapter extends BaseAdapter {
  readonly platform = 'instamojo';
  readonly displayName = 'Instamojo';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true;

    // Instamojo uses a salt-based MAC or custom header verification
    const signature = headers['x-custom-header'] || headers['x-instamojo-signature'];
    if (!signature) return true; // Instamojo may not always send a signature header

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // Parse form data or JSON and create MAC from sorted payload fields
    let parsed: any;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Try URL-encoded form data
      parsed = Object.fromEntries(new URLSearchParams(body));
    }

    // Sort keys and create pipe-separated string, then HMAC with salt
    const sortedKeys = Object.keys(parsed).filter(k => k !== 'mac').sort();
    const dataString = sortedKeys.map(k => parsed[k]).join('|');
    const expectedMac = createHmac('sha1', this.config.webhookSecret)
      .update(dataString)
      .digest('hex');

    return signature === expectedMac;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      if (payload?.buyer) return payload.buyer;
      if (payload?.buyer_phone) return payload.buyer_phone;
      if (payload?.buyer_name) return payload.buyer_name;
      if (payload?.custom_fields?.entity_id) return payload.custom_fields.entity_id;
      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'payment.credited',
        trustEventType: 'payment_received',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.amount) || parseFloat(payload?.payment?.amount) || 0;
        },
        metadataExtractor: (payload: any) => ({
          payment_id: payload?.payment_id,
          payment_request_id: payload?.payment_request_id,
          amount: parseFloat(payload?.amount) || 0,
          currency: payload?.currency || 'INR',
          buyer: payload?.buyer,
          buyer_name: payload?.buyer_name,
          buyer_phone: payload?.buyer_phone,
          purpose: payload?.purpose,
          instrument_type: payload?.instrument_type,
          fees: parseFloat(payload?.fees) || 0,
          status: payload?.status,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'refund.initiated',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.refund_amount) || parseFloat(payload?.amount) || 0;
        },
        metadataExtractor: (payload: any) => ({
          refund_id: payload?.refund_id || payload?.id,
          payment_id: payload?.payment_id,
          refund_amount: parseFloat(payload?.refund_amount) || 0,
          currency: 'INR',
          status: payload?.status,
          type: payload?.type,
          body: payload?.body,
        }),
        entityIdExtractor: extractEntityId,
      },
    ];
  }

  protected extractSourceEventId(payload: any): string | undefined {
    return payload?.payment_id || payload?.payment_request_id || payload?.id || undefined;
  }
}
