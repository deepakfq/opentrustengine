import { createHmac } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class CashfreeAdapter extends BaseAdapter {
  readonly platform = 'cashfree';
  readonly displayName = 'Cashfree Payments';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true;

    const timestamp = headers['x-cashfree-timestamp'] || headers['x-webhook-timestamp'];
    const signature = headers['x-cashfree-signature'] || headers['x-webhook-signature'];
    if (!timestamp || !signature) return false;

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const signedPayload = timestamp + body;
    const expectedSignature = createHmac('sha256', this.config.webhookSecret)
      .update(signedPayload)
      .digest('base64');

    return signature === expectedSignature;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      const data = payload?.data || payload;
      if (data?.customer_details?.customer_id) return data.customer_details.customer_id;
      if (data?.customer_details?.customer_phone) return data.customer_details.customer_phone;
      if (data?.payment?.customer_id) return data.payment.customer_id;
      if (data?.order?.tags?.entity_id) return data.order.tags.entity_id;
      if (data?.order?.order_id) return data.order.order_id;
      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'PAYMENT_SUCCESS_WEBHOOK',
        trustEventType: 'payment_received',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          const data = payload?.data || payload;
          return data?.payment?.payment_amount || data?.order?.order_amount || 0;
        },
        metadataExtractor: (payload: any) => {
          const data = payload?.data || payload;
          const payment = data?.payment || {};
          const order = data?.order || {};
          return {
            cf_payment_id: payment.cf_payment_id,
            order_id: order.order_id,
            payment_method: payment.payment_group,
            currency: order.order_currency || 'INR',
            amount: payment.payment_amount || order.order_amount,
            customer_phone: data?.customer_details?.customer_phone,
            customer_email: data?.customer_details?.customer_email,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'PAYMENT_FAILED_WEBHOOK',
        trustEventType: 'payment_failed',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'negative',
        valueExtractor: () => -1,
        metadataExtractor: (payload: any) => {
          const data = payload?.data || payload;
          const payment = data?.payment || {};
          const order = data?.order || {};
          return {
            cf_payment_id: payment.cf_payment_id,
            order_id: order.order_id,
            payment_method: payment.payment_group,
            currency: order.order_currency || 'INR',
            error_message: payment.payment_message,
            error_code: payment.error_details?.error_code,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'REFUND_STATUS_WEBHOOK',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          const data = payload?.data || payload;
          return data?.refund?.refund_amount || 0;
        },
        metadataExtractor: (payload: any) => {
          const data = payload?.data || payload;
          const refund = data?.refund || {};
          return {
            cf_refund_id: refund.cf_refund_id,
            refund_id: refund.refund_id,
            order_id: data?.order?.order_id,
            refund_amount: refund.refund_amount,
            refund_status: refund.refund_status,
            currency: 'INR',
            refund_mode: refund.refund_mode,
          };
        },
        entityIdExtractor: extractEntityId,
      },
    ];
  }
}
