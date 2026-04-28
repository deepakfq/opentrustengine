import { TallyVoucher } from '../tally/tally-client';

export interface TallyTrustEvent {
  entityType: string;
  entityId: string;
  eventType: string;
  role: string;
  rawValue: number;
  metadata: Record<string, any>;
}

/**
 * Maps a Tally voucher to an OpenTrustEngine trust event.
 * Returns null for unsupported voucher types.
 */
export function mapVoucherToTrustEvent(
  voucher: TallyVoucher,
  entityType: string,
  entityId: string,
): TallyTrustEvent | null {
  const baseMetadata = {
    voucherNumber: voucher.voucherNumber,
    amount: voucher.amount,
    partyName: voucher.partyName,
    date: voucher.date,
    narration: voucher.narration,
    guid: voucher.guid,
    source: 'tally',
  };

  switch (voucher.voucherType) {
    case 'Sales':
      return {
        entityType,
        entityId,
        eventType: 'invoice_created',
        role: 'seller',
        rawValue: 1,
        metadata: baseMetadata,
      };

    case 'Receipt':
      return {
        entityType,
        entityId,
        eventType: 'payment_received',
        role: 'seller',
        rawValue: 1,
        metadata: baseMetadata,
      };

    case 'Credit Note':
      return {
        entityType,
        entityId,
        eventType: 'credit_note_issued',
        role: 'seller',
        rawValue: -1,
        metadata: baseMetadata,
      };

    case 'Debit Note':
      return {
        entityType,
        entityId,
        eventType: 'debit_note_received',
        role: 'buyer',
        rawValue: -1,
        metadata: baseMetadata,
      };

    case 'Purchase':
      return {
        entityType,
        entityId,
        eventType: 'purchase_recorded',
        role: 'buyer',
        rawValue: 1,
        metadata: baseMetadata,
      };

    case 'Payment':
      return {
        entityType,
        entityId,
        eventType: 'payment_made',
        role: 'buyer',
        rawValue: 1,
        metadata: baseMetadata,
      };

    default:
      return null;
  }
}
