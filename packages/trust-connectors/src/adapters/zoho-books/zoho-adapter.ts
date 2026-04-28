import { createHmac } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class ZohoBooksAdapter extends BaseAdapter {
  readonly platform = 'zoho-books';
  readonly displayName = 'Zoho Books';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true;

    // Zoho uses a webhook token for validation — compare against configured secret
    // The token is sent as a query param or in the payload itself
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    let parsed: any;
    try {
      parsed = JSON.parse(body);
    } catch {
      return false;
    }

    // Check the organization-level token or HMAC-based signature
    const zohoToken = headers['x-zoho-webhook-token'] || parsed?.webhook_token;
    if (zohoToken) {
      return zohoToken === this.config.webhookSecret;
    }

    // Fallback: HMAC-SHA256 on the raw body
    const signature = headers['x-zoho-signature'];
    if (signature) {
      const expectedSignature = createHmac('sha256', this.config.webhookSecret)
        .update(body)
        .digest('hex');
      return signature === expectedSignature;
    }

    return false;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      if (payload?.customer_id) return String(payload.customer_id);
      if (payload?.contact_id) return String(payload.contact_id);
      if (payload?.customer?.customer_id) return String(payload.customer.customer_id);
      if (payload?.invoice?.customer_id) return String(payload.invoice.customer_id);
      if (payload?.payment?.customer_id) return String(payload.payment.customer_id);
      if (payload?.creditnote?.customer_id) return String(payload.creditnote.customer_id);
      if (payload?.contact_persons?.[0]?.email) return payload.contact_persons[0].email;
      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'invoice.created',
        trustEventType: 'invoice_created',
        role: 'seller',
        pillar: 'transaction_discipline',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          const invoice = payload?.invoice || payload;
          return parseFloat(invoice?.total) || 0;
        },
        metadataExtractor: (payload: any) => {
          const invoice = payload?.invoice || payload;
          return {
            invoice_id: invoice?.invoice_id,
            invoice_number: invoice?.invoice_number,
            total: parseFloat(invoice?.total) || 0,
            currency_code: invoice?.currency_code || 'INR',
            customer_name: invoice?.customer_name,
            date: invoice?.date,
            due_date: invoice?.due_date,
            status: invoice?.status,
            balance: parseFloat(invoice?.balance) || 0,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'payment.received',
        trustEventType: 'payment_received',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          const payment = payload?.payment || payload;
          return parseFloat(payment?.amount) || 0;
        },
        metadataExtractor: (payload: any) => {
          const payment = payload?.payment || payload;
          return {
            payment_id: payment?.payment_id,
            payment_number: payment?.payment_number,
            amount: parseFloat(payment?.amount) || 0,
            currency_code: payment?.currency_code || 'INR',
            customer_name: payment?.customer_name,
            date: payment?.date,
            payment_mode: payment?.payment_mode,
            invoice_numbers: payment?.invoices?.map((i: any) => i.invoice_number),
            reference_number: payment?.reference_number,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'creditnote.created',
        trustEventType: 'credit_note_issued',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          const cn = payload?.creditnote || payload;
          return parseFloat(cn?.total) || 0;
        },
        metadataExtractor: (payload: any) => {
          const cn = payload?.creditnote || payload;
          return {
            creditnote_id: cn?.creditnote_id,
            creditnote_number: cn?.creditnote_number,
            total: parseFloat(cn?.total) || 0,
            currency_code: cn?.currency_code || 'INR',
            customer_name: cn?.customer_name,
            date: cn?.date,
            status: cn?.status,
            balance: parseFloat(cn?.balance) || 0,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'invoice.overdue',
        trustEventType: 'payment_overdue',
        role: 'buyer',
        pillar: 'payment_reliability',
        outcome: 'negative',
        valueExtractor: (payload: any) => {
          const invoice = payload?.invoice || payload;
          return -(parseFloat(invoice?.balance) || parseFloat(invoice?.total) || 1);
        },
        metadataExtractor: (payload: any) => {
          const invoice = payload?.invoice || payload;
          return {
            invoice_id: invoice?.invoice_id,
            invoice_number: invoice?.invoice_number,
            total: parseFloat(invoice?.total) || 0,
            balance: parseFloat(invoice?.balance) || 0,
            currency_code: invoice?.currency_code || 'INR',
            customer_name: invoice?.customer_name,
            due_date: invoice?.due_date,
            days_overdue: invoice?.days_overdue,
          };
        },
        entityIdExtractor: extractEntityId,
      },
    ];
  }

  protected extractSourceEventId(payload: any): string | undefined {
    const invoice = payload?.invoice;
    const payment = payload?.payment;
    const cn = payload?.creditnote;
    return invoice?.invoice_id || payment?.payment_id || cn?.creditnote_id || payload?.id || undefined;
  }
}
