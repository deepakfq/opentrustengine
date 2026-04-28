import { createHmac } from 'crypto';
import { BaseAdapter } from '../../adapter/base-adapter';
import { AdapterConfig, PlatformEventMapping } from '../../types';

export class RazorpayAdapter extends BaseAdapter {
  readonly platform = 'razorpay';
  readonly displayName = 'Razorpay';

  constructor(config: AdapterConfig) {
    super(config);
  }

  verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) return true; // no secret configured, skip verification

    const signature = headers['x-razorpay-signature'];
    if (!signature) return false;

    const expectedSignature = createHmac('sha256', this.config.webhookSecret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');

    return signature === expectedSignature;
  }

  getEventMappings(): PlatformEventMapping[] {
    const extractEntityId = (payload: any): string => {
      // Try notes.entity_id first, then customer_id, then config fallback
      const entity = payload?.payload?.payment?.entity;
      if (entity?.notes?.entity_id) return entity.notes.entity_id;
      if (entity?.customer_id) return entity.customer_id;

      const order = payload?.payload?.order?.entity;
      if (order?.notes?.entity_id) return order.notes.entity_id;
      if (order?.customer_id) return order.customer_id;

      const refund = payload?.payload?.refund?.entity;
      if (refund?.notes?.entity_id) return refund.notes.entity_id;

      const dispute = payload?.payload?.dispute?.entity;
      if (dispute?.notes?.entity_id) return dispute.notes.entity_id;

      return this.config.entityMapping?.fallbackEntityId || '';
    };

    return [
      {
        platformEvent: 'payment.captured',
        trustEventType: 'payment_received',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'positive',
        valueExtractor: (payload: any) => {
          const amount = payload?.payload?.payment?.entity?.amount;
          return amount ? amount / 100 : 0;
        },
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.payment?.entity || {};
          return {
            payment_id: entity.id,
            order_id: entity.order_id,
            method: entity.method,
            currency: entity.currency,
            amount_inr: entity.amount ? entity.amount / 100 : 0,
            email: entity.email,
            contact: entity.contact,
            vpa: entity.vpa,
            bank: entity.bank,
            wallet: entity.wallet,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'payment.failed',
        trustEventType: 'payment_failed',
        role: 'seller',
        pillar: 'payment_reliability',
        outcome: 'negative',
        valueExtractor: () => -1,
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.payment?.entity || {};
          return {
            payment_id: entity.id,
            order_id: entity.order_id,
            method: entity.method,
            currency: entity.currency,
            error_code: entity.error_code,
            error_description: entity.error_description,
            error_reason: entity.error_reason,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'order.paid',
        trustEventType: 'order_completed',
        role: 'seller',
        pillar: 'transaction_discipline',
        outcome: 'positive',
        valueExtractor: () => 1,
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.order?.entity || {};
          return {
            order_id: entity.id,
            amount_inr: entity.amount ? entity.amount / 100 : 0,
            currency: entity.currency,
            receipt: entity.receipt,
            status: entity.status,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'refund.processed',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          const amount = payload?.payload?.refund?.entity?.amount;
          return amount ? amount / 100 : 0;
        },
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.refund?.entity || {};
          return {
            refund_id: entity.id,
            payment_id: entity.payment_id,
            amount_inr: entity.amount ? entity.amount / 100 : 0,
            currency: entity.currency,
            speed: entity.speed,
            receipt_number: entity.receipt_number,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'refund.created',
        trustEventType: 'refund_processed',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'neutral',
        valueExtractor: (payload: any) => {
          const amount = payload?.payload?.refund?.entity?.amount;
          return amount ? amount / 100 : 0;
        },
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.refund?.entity || {};
          return {
            refund_id: entity.id,
            payment_id: entity.payment_id,
            amount_inr: entity.amount ? entity.amount / 100 : 0,
            currency: entity.currency,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'dispute.created',
        trustEventType: 'dispute_raised',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'negative',
        valueExtractor: () => -1,
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.dispute?.entity || {};
          return {
            dispute_id: entity.id,
            payment_id: entity.payment_id,
            amount_deducted: entity.amount_deducted,
            reason_code: entity.reason_code,
            phase: entity.phase,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'dispute.won',
        trustEventType: 'dispute_resolved',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'positive',
        valueExtractor: () => 1,
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.dispute?.entity || {};
          return {
            dispute_id: entity.id,
            payment_id: entity.payment_id,
            amount_deducted: entity.amount_deducted,
            reason_code: entity.reason_code,
          };
        },
        entityIdExtractor: extractEntityId,
      },
      {
        platformEvent: 'dispute.lost',
        trustEventType: 'dispute_lost',
        role: 'seller',
        pillar: 'dispute_resolution',
        outcome: 'negative',
        valueExtractor: () => -2,
        metadataExtractor: (payload: any) => {
          const entity = payload?.payload?.dispute?.entity || {};
          return {
            dispute_id: entity.id,
            payment_id: entity.payment_id,
            amount_deducted: entity.amount_deducted,
            reason_code: entity.reason_code,
          };
        },
        entityIdExtractor: extractEntityId,
      },
    ];
  }
}
