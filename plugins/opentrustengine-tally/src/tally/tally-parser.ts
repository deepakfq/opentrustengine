import { TallyVoucher } from './tally-client';

/**
 * Parse company list from Tally XML response.
 * Handles both Tally Prime and ERP 9 response formats.
 */
export function parseCompanyList(data: any): string[] {
  const companies: string[] = [];

  try {
    // Tally Prime format: ENVELOPE > BODY > DATA > COLLECTION > COMPANY
    const collection =
      data?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COMPANY ||
      data?.ENVELOPE?.BODY?.DATA?.COLLECTION?.SVCURRENTCOMPANY;

    if (!collection) return companies;

    const items = Array.isArray(collection) ? collection : [collection];
    for (const item of items) {
      const name = typeof item === 'string' ? item : item?.NAME || item?._ || item?.['$']?.NAME;
      if (name) {
        companies.push(name);
      }
    }
  } catch {
    // ERP 9 fallback format: ENVELOPE > BODY > IMPORTDATA > REQUESTDATA > ...
    try {
      const body = data?.ENVELOPE?.BODY;
      if (body?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE?.COMPANY) {
        const items = Array.isArray(body.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.COMPANY)
          ? body.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.COMPANY
          : [body.IMPORTDATA.REQUESTDATA.TALLYMESSAGE.COMPANY];

        for (const item of items) {
          const name = item?.NAME || item?.['$']?.NAME;
          if (name) companies.push(name);
        }
      }
    } catch {
      // Couldn't parse
    }
  }

  return companies;
}

/**
 * Parse voucher list from Tally XML response.
 * Handles both Tally Prime and ERP 9 response formats.
 */
export function parseVoucherList(data: any): TallyVoucher[] {
  const vouchers: TallyVoucher[] = [];

  try {
    // Navigate to the voucher collection
    // Tally Prime: ENVELOPE > BODY > DATA > COLLECTION > VOUCHER
    // ERP 9:       ENVELOPE > BODY > DATA > TALLYMESSAGE > VOUCHER
    const rawVouchers =
      data?.ENVELOPE?.BODY?.DATA?.COLLECTION?.VOUCHER ||
      data?.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE?.VOUCHER ||
      data?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE?.VOUCHER;

    if (!rawVouchers) return vouchers;

    const items = Array.isArray(rawVouchers) ? rawVouchers : [rawVouchers];

    for (const raw of items) {
      const voucher = parseVoucher(raw);
      if (voucher) {
        vouchers.push(voucher);
      }
    }
  } catch (err) {
    console.error('[TallyParser] Failed to parse vouchers:', err);
  }

  return vouchers;
}

/**
 * Parse a single voucher from Tally XML.
 */
function parseVoucher(raw: any): TallyVoucher | null {
  try {
    const voucherNumber =
      raw?.VOUCHERNUMBER || raw?.['$']?.VCHNO || raw?.OLDAUDITENTRYIDS?.OLDAUDITENTRYID || '';
    const voucherType =
      raw?.VOUCHERTYPENAME || raw?.['$']?.VCHTYPE || '';
    const date = raw?.DATE || raw?.['$']?.DATE || '';
    const partyName =
      raw?.PARTYLEDGERNAME || raw?.BASICBUYERNAME || '';
    const amount = parseFloat(raw?.AMOUNT || raw?.['$']?.AMOUNT || '0');
    const narration = raw?.NARRATION || '';
    const guid =
      raw?.GUID || raw?.['$']?.REMOTEID || raw?.['$']?.GUID || `${voucherNumber}-${date}`;

    // Parse ledger entries
    const ledgerEntries: Array<{ ledger: string; amount: number }> = [];
    const allLedgerEntries = raw?.ALLLEDGERENTRIES?.LIST || raw?.LEDGERENTRIES?.LIST || raw?.ALLLEDGERENTRIES || [];
    const entryList = Array.isArray(allLedgerEntries) ? allLedgerEntries : [allLedgerEntries];

    for (const entry of entryList) {
      if (entry?.LEDGERNAME && entry?.AMOUNT) {
        ledgerEntries.push({
          ledger: entry.LEDGERNAME,
          amount: parseFloat(entry.AMOUNT),
        });
      }
    }

    // Determine if this is an invoice
    const isInvoice =
      voucherType === 'Sales' ||
      voucherType === 'Purchase' ||
      Boolean(raw?.ISINVOICE === 'Yes' || raw?.ISINVOICE === true);

    return {
      voucherNumber: String(voucherNumber),
      voucherType: String(voucherType),
      date: String(date),
      partyName: String(partyName),
      amount: Math.abs(amount),
      narration: String(narration),
      ledgerEntries,
      isInvoice,
      guid: String(guid),
    };
  } catch {
    return null;
  }
}

/**
 * Parse ledger list from Tally XML response.
 */
export interface TallyLedger {
  name: string;
  parent: string;
  openingBalance: number;
  closingBalance: number;
}

export function parseLedgerList(data: any): TallyLedger[] {
  const ledgers: TallyLedger[] = [];

  try {
    const rawLedgers =
      data?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER ||
      data?.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE?.LEDGER;

    if (!rawLedgers) return ledgers;

    const items = Array.isArray(rawLedgers) ? rawLedgers : [rawLedgers];

    for (const raw of items) {
      const name = raw?.NAME || raw?.['$']?.NAME || '';
      const parent = raw?.PARENT || '';
      const openingBalance = parseFloat(raw?.OPENINGBALANCE || '0');
      const closingBalance = parseFloat(raw?.CLOSINGBALANCE || '0');

      if (name) {
        ledgers.push({
          name: String(name),
          parent: String(parent),
          openingBalance,
          closingBalance,
        });
      }
    }
  } catch (err) {
    console.error('[TallyParser] Failed to parse ledgers:', err);
  }

  return ledgers;
}
