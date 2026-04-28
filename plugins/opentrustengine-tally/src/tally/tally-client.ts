import { parseStringPromise } from 'xml2js';
import http from 'http';
import { parseCompanyList, parseVoucherList } from './tally-parser';

export interface TallyConfig {
  host: string;   // default: localhost
  port: number;   // default: 9000 (Tally Prime) or 9100 (ERP 9)
  company: string;
}

export interface TallyVoucher {
  voucherNumber: string;
  voucherType: string;
  date: string;
  partyName: string;
  amount: number;
  narration: string;
  ledgerEntries: Array<{ ledger: string; amount: number }>;
  isInvoice: boolean;
  guid: string;
}

export class TallyClient {
  private config: TallyConfig;

  constructor(config: TallyConfig) {
    this.config = config;
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.sendRequest(
        '<ENVELOPE>' +
          '<HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Data</TYPE><ID>List of Companies</ID></HEADER>' +
          '<BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY>' +
        '</ENVELOPE>'
      );
      return true;
    } catch {
      return false;
    }
  }

  async getCompanies(): Promise<string[]> {
    const xml =
      '<ENVELOPE>' +
        '<HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Data</TYPE><ID>List of Companies</ID></HEADER>' +
        '<BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY>' +
      '</ENVELOPE>';

    const result = await this.sendRequest(xml);
    return parseCompanyList(result);
  }

  async getVouchers(fromDate: string, toDate: string, voucherType?: string): Promise<TallyVoucher[]> {
    const xml = this.buildVoucherRequest(fromDate, toDate, voucherType);
    const result = await this.sendRequest(xml);
    return parseVoucherList(result);
  }

  async getSalesVouchers(fromDate: string, toDate: string): Promise<TallyVoucher[]> {
    return this.getVouchers(fromDate, toDate, 'Sales');
  }

  async getReceiptVouchers(fromDate: string, toDate: string): Promise<TallyVoucher[]> {
    return this.getVouchers(fromDate, toDate, 'Receipt');
  }

  async getCreditNotes(fromDate: string, toDate: string): Promise<TallyVoucher[]> {
    return this.getVouchers(fromDate, toDate, 'Credit Note');
  }

  async getDebitNotes(fromDate: string, toDate: string): Promise<TallyVoucher[]> {
    return this.getVouchers(fromDate, toDate, 'Debit Note');
  }

  private buildVoucherRequest(fromDate: string, toDate: string, voucherType?: string): string {
    const voucherTypeFilter = voucherType
      ? `<VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>`
      : '';

    return (
      '<ENVELOPE>' +
        '<HEADER>' +
          '<VERSION>1</VERSION>' +
          '<TALLYREQUEST>Export</TALLYREQUEST>' +
          '<TYPE>Data</TYPE>' +
          '<ID>Voucher Register</ID>' +
        '</HEADER>' +
        '<BODY><DESC>' +
          '<STATICVARIABLES>' +
            '<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>' +
            `<SVCURRENTCOMPANY>${this.config.company}</SVCURRENTCOMPANY>` +
            `<SVFROMDATE>${fromDate}</SVFROMDATE>` +
            `<SVTODATE>${toDate}</SVTODATE>` +
            voucherTypeFilter +
          '</STATICVARIABLES>' +
        '</DESC></BODY>' +
      '</ENVELOPE>'
    );
  }

  private async sendRequest(xmlBody: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: this.config.host,
          port: this.config.port,
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(xmlBody),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', async () => {
            try {
              const parsed = await parseStringPromise(data, {
                explicitArray: false,
                ignoreAttrs: false,
                trim: true,
              });
              resolve(parsed);
            } catch (e) {
              reject(e);
            }
          });
        },
      );

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Tally connection timeout'));
      });
      req.write(xmlBody);
      req.end();
    });
  }
}
