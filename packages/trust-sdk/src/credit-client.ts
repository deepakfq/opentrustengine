import type {
  CreditRelationship,
  CreditEvent,
  CreditLimitResult,
  CreditReport,
  ExtendCreditParams,
  RecordRepaymentParams,
  RecordDefaultParams,
  SDKConfig,
} from './types';

export interface CreditClientConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class CreditEngine {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: CreditClientConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'https://api.opentrustengine.com';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
    };

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          const error: any = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`CreditEngine API error ${response.status}: ${error.message || response.statusText}`);
        }

        return await response.json() as T;
      } catch (err: any) {
        lastError = err;
        if (attempt < this.retries && (err.name === 'AbortError' || err.code === 'ECONNRESET')) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('Request failed after retries');
  }

  // ── Record Credit Events ──

  /** Extend credit from creditor to debtor */
  async extendCredit(params: ExtendCreditParams): Promise<any> {
    return this.request('POST', '/v1/credit/extend', params);
  }

  /** Record a full repayment */
  async recordRepayment(params: RecordRepaymentParams): Promise<any> {
    return this.request('POST', '/v1/credit/repay', params);
  }

  /** Record a default on outstanding credit */
  async recordDefault(params: RecordDefaultParams): Promise<any> {
    return this.request('POST', '/v1/credit/default', params);
  }

  /** Record a partial payment toward outstanding credit */
  async recordPartialPayment(params: RecordRepaymentParams): Promise<any> {
    return this.request('POST', '/v1/credit/partial', params);
  }

  // ── Query Credit Data ──

  /** Get the suggested credit limit for an entity */
  async getCreditLimit(entityType: string, entityId: string): Promise<CreditLimitResult> {
    return this.request('GET', `/v1/credit/limit?entityType=${entityType}&entityId=${entityId}`);
  }

  /** Get a full credit report for an entity */
  async getCreditReport(entityType: string, entityId: string): Promise<CreditReport> {
    return this.request('GET', `/v1/credit/report?entityType=${entityType}&entityId=${entityId}`);
  }

  /** Get credit history between a creditor and debtor */
  async getCreditHistory(
    creditorType: string, creditorId: string,
    debtorType: string, debtorId: string,
    limit = 50, offset = 0,
  ): Promise<{ relationship: CreditRelationship; events: CreditEvent[]; summary: any }> {
    const params = new URLSearchParams({
      creditorType, creditorId, debtorType, debtorId,
      limit: String(limit), offset: String(offset),
    });
    return this.request('GET', `/v1/credit/history?${params}`);
  }

  /** Get all credit relationships for an entity */
  async getRelationships(
    entityType: string, entityId: string,
    role: 'creditor' | 'debtor' = 'creditor',
    limit = 50, offset = 0,
  ): Promise<{ relationships: CreditRelationship[]; total: number }> {
    const params = new URLSearchParams({
      entityType, entityId, role,
      limit: String(limit), offset: String(offset),
    });
    return this.request('GET', `/v1/credit/relationships?${params}`);
  }
}
