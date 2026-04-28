import { createHash } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class PayUAdapter extends BaseAdapter {
  readonly platform = 'payu';
  readonly displayName = 'PayU';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true;

    // PayU uses SHA-512 hash: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // For webhook verification, compare the hash in the payload
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    let parsed: any;
    try {
      parsed = JSON.parse(body);
    } catch {
      return false;
    }

    const hash = parsed.hash;
    if (!hash) return false;

    const salt = this.config.webhookSecret;
    const hashString = [
      salt,
      parsed.status || '',
      '', '', '', '', '',
      parsed.udf5 || '',
      parsed.udf4 || '',
      parsed.udf3 || '',
      parsed.udf2 || '',
      parsed.udf1 || '',
      parsed.email || '',
      parsed.firstname || '',
      parsed.productinfo || '',
      parsed.amount || '',
      parsed.txnid || '',
      parsed.key || '',
    ].join('|');

    const expectedHash = createHash('sha512').update(hashString).digest('hex');
    return hash === expectedHash;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      if (payload?.udf1) return payload.udf1; // commonly used for entity_id
      if (payload?.email) return payload.email;
      if (payload?.phone) return payload.phone;
      if (payload?.customer_id) return payload.customer_id;
      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'payment_successful',
        trustEventType: 'payment_received',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.amount) || parseFloat(payload?.net_amount_debit) || 0;
        },
        metadataExtractor: (payload: any) => ({
          txnid: payload?.txnid,
          mihpayid: payload?.mihpayid,
          mode: payload?.mode,
          currency: 'INR',
          amount: parseFloat(payload?.amount) || 0,
          email: payload?.email,
          phone: payload?.phone,
          firstname: payload?.firstname,
          productinfo: payload?.productinfo,
          bank_ref_num: payload?.bank_ref_num,
          bankcode: payload?.bankcode,
          pg_type: payload?.PG_TYPE,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'payment_failed',
        trustEventType: 'payment_failed',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'negative',
        valueExtractor: () => -1,
        metadataExtractor: (payload: any) => ({
          txnid: payload?.txnid,
          mihpayid: payload?.mihpayid,
          mode: payload?.mode,
          currency: 'INR',
          error: payload?.error,
          error_Message: payload?.error_Message,
          email: payload?.email,
          phone: payload?.phone,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'refund_completed',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.refund_amount) || parseFloat(payload?.amount) || 0;
        },
        metadataExtractor: (payload: any) => ({
          txnid: payload?.txnid,
          mihpayid: payload?.mihpayid,
          refund_amount: parseFloat(payload?.refund_amount) || 0,
          currency: 'INR',
          email: payload?.email,
          refund_id: payload?.refund_id,
          request_id: payload?.request_id,
        }),
        entityIdExtractor: extractEntityId,
      },
    ];
  }
}
