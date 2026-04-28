import { createHmac } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class ShopifyAdapter extends BaseAdapter {
  readonly platform = 'shopify';
  readonly displayName = 'Shopify';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true;

    const signature = headers['x-shopify-hmac-sha256'];
    if (!signature) return false;

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = createHmac('sha256', this.config.webhookSecret)
      .update(body)
      .digest('base64');

    return signature === expectedSignature;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      if (payload?.customer?.id) return String(payload.customer.id);
      if (payload?.email) return payload.email;
      if (payload?.note_attributes) {
        const entityAttr = payload.note_attributes.find((a: any) => a.name === 'entity_id');
        if (entityAttr) return entityAttr.value;
      }
      if (payload?.customer?.email) return payload.customer.email;
      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'orders/create',
        trustEventType: 'order_placed',
        role: 'buyer',
        pillar: 'transaction_discipline',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          return parseFloat(payload?.total_price) || 0;
        },
        metadataExtractor: (payload: any) => ({
          order_id: payload?.id,
          order_number: payload?.order_number,
          total_price: parseFloat(payload?.total_price) || 0,
          currency: payload?.currency,
          financial_status: payload?.financial_status,
          fulfillment_status: payload?.fulfillment_status,
          customer_email: payload?.customer?.email,
          customer_phone: payload?.customer?.phone,
          items_count: payload?.line_items?.length || 0,
          gateway: payload?.gateway,
          source_name: payload?.source_name,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'orders/fulfilled',
        trustEventType: 'order_completed',
        role: 'seller',
        pillar: 'transaction_discipline',
        outcome: 'positive',
        valueExtractor: () => 1,
        metadataExtractor: (payload: any) => ({
          order_id: payload?.id,
          order_number: payload?.order_number,
          total_price: parseFloat(payload?.total_price) || 0,
          currency: payload?.currency,
          fulfillment_status: payload?.fulfillment_status,
          customer_email: payload?.customer?.email,
          tracking_numbers: payload?.fulfillments?.map((f: any) => f.tracking_number).filter(Boolean),
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'orders/cancelled',
        trustEventType: 'order_cancelled',
        role: 'seller',
        pillar: 'transaction_discipline',
        outcome: 'negative',
        valueExtractor: () => -1,
        metadataExtractor: (payload: any) => ({
          order_id: payload?.id,
          order_number: payload?.order_number,
          total_price: parseFloat(payload?.total_price) || 0,
          currency: payload?.currency,
          cancel_reason: payload?.cancel_reason,
          cancelled_at: payload?.cancelled_at,
          customer_email: payload?.customer?.email,
        }),
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'refunds/create',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          const transactions = payload?.transactions || [];
          const totalRefund = transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
          return totalRefund || 0;
        },
        metadataExtractor: (payload: any) => ({
          refund_id: payload?.id,
          order_id: payload?.order_id,
          currency: payload?.currency,
          refund_line_items: payload?.refund_line_items?.length || 0,
          note: payload?.note,
          created_at: payload?.created_at,
        }),
        entityIdExtractor: extractEntityId,
      },
    ];
  }

  protected extractSourceEventId(payload: any): string | undefined {
    return payload?.id ? String(payload.id) : payload?.order_id ? String(payload.order_id) : undefined;
  }
}
