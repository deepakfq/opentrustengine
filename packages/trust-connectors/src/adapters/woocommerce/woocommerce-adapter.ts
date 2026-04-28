import { createHmac } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class WooCommerceAdapter extends BaseAdapter {
  readonly platform = 'woocommerce';
  readonly displayName = 'WooCommerce';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true;

    const signature = headers['x-wc-webhook-signature'];
    if (!signature) return false;

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = createHmac('sha256', this.config.webhookSecret)
      .update(body)
      .digest('base64');

    return signature === expectedSignature;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      if (payload?.meta_data) {
        const entityMeta = payload.meta_data.find((m: any) => m.key === 'entity_id');
        if (entityMeta) return String(entityMeta.value);
      }
      if (payload?.customer_id && payload.customer_id !== 0) return String(payload.customer_id);
      if (payload?.billing?.email) return payload.billing.email;
      if (payload?.billing?.phone) return payload.billing.phone;
      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'order.completed',
        trustEventType: 'order_completed',
        role: 'seller',
        pillar: 'transaction_discipline',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.total) || 0;
        },
        metadataExtractor: (payload: any) => ({
          order_id: payload?.id,
          order_number: payload?.number,
          total: parseFloat(payload?.total) || 0,
          currency: payload?.currency,
          payment_method: payload?.payment_method,
          payment_method_title: payload?.payment_method_title,
          customer_email: payload?.billing?.email,
          customer_phone: payload?.billing?.phone,
          items_count: payload?.line_items?.length || 0,
          date_completed: payload?.date_completed,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'order.refunded',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          return Math.abs(parseFloat(payload?.total) || 0);
        },
        metadataExtractor: (payload: any) => ({
          order_id: payload?.id,
          order_number: payload?.number,
          refund_total: payload?.total,
          currency: payload?.currency,
          refund_reason: payload?.refunds?.[0]?.reason,
          customer_email: payload?.billing?.email,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'order.created',
        trustEventType: 'order_placed',
        role: 'buyer',
        pillar: 'transaction_discipline',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.total) || 0;
        },
        metadataExtractor: (payload: any) => ({
          order_id: payload?.id,
          order_number: payload?.number,
          total: parseFloat(payload?.total) || 0,
          currency: payload?.currency,
          payment_method: payload?.payment_method,
          payment_method_title: payload?.payment_method_title,
          customer_email: payload?.billing?.email,
          customer_phone: payload?.billing?.phone,
          items_count: payload?.line_items?.length || 0,
          status: payload?.status,
        }),
        entityIdExtractor: extractEntityId,
      },
    ];
  }

  protected extractSourceEventId(payload: any): string | undefined {
    return payload?.id ? String(payload.id) : undefined;
  }
}
