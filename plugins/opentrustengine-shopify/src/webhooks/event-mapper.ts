export interface TrustEventInput {
  eventType: string;
  role: string;
  rawValue: number;
  metadata: Record<string, any>;
}

/**
 * Maps a Shopify webhook topic and payload to an OTE trust event.
 * Returns null for unrecognized topics.
 */
export function mapShopifyEvent(topic: string, payload: any): TrustEventInput | null {
  switch (topic) {
    case 'orders/create':
      return {
        eventType: 'order_placed',
        role: 'seller',
        rawValue: 1,
        metadata: {
          orderId: payload.id,
          orderValue: parseFloat(payload.total_price),
          currency: payload.currency,
          items: payload.line_items?.length || 0,
          source: 'shopify',
        },
      };

    case 'orders/fulfilled':
      return {
        eventType: 'order_completed',
        role: 'seller',
        rawValue: 1,
        metadata: {
          orderId: payload.id,
          orderValue: parseFloat(payload.total_price),
          currency: payload.currency,
          fulfillmentStatus: payload.fulfillment_status,
          source: 'shopify',
        },
      };

    case 'orders/cancelled':
      return {
        eventType: 'order_cancelled',
        role: 'seller',
        rawValue: -1,
        metadata: {
          orderId: payload.id,
          cancelReason: payload.cancel_reason,
          source: 'shopify',
        },
      };

    case 'refunds/create':
      return {
        eventType: 'refund_processed',
        role: 'seller',
        rawValue: 1,
        metadata: {
          orderId: payload.order_id,
          refundAmount:
            payload.transactions?.reduce(
              (sum: number, t: any) => sum + parseFloat(t.amount),
              0,
            ) || 0,
          source: 'shopify',
        },
      };

    default:
      return null;
  }
}
