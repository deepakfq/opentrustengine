import { SDKConfig, TrustEvent, TrustEventResult, WebhookEndpointConfig } from './types';

export class OpenTrustEngine {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: SDKConfig) {
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
          throw new Error(`OpenTrustEngine API error ${response.status}: ${error.message || response.statusText}`);
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

  // ── Events (Data Intake) ──

  /** Record a single trust event */
  async recordEvent(event: TrustEvent): Promise<TrustEventResult> {
    return this.request<TrustEventResult>('POST', '/v1/open/events', event);
  }

  /** Record multiple trust events in batch */
  async recordEvents(events: TrustEvent[]): Promise<{ results: TrustEventResult[] }> {
    return this.request('POST', '/v1/open/events/batch', { events });
  }

  /** Get event history for an entity */
  async getEvents(entityType: string, entityId: string, limit = 50): Promise<any[]> {
    return this.request('GET', `/v1/open/events?entityType=${entityType}&entityId=${entityId}&limit=${limit}`);
  }

  // ── Config ──

  /** Get trust engine configuration (pillars, caps, bands) */
  async getConfig(): Promise<any> {
    return this.request('GET', '/v1/open/config');
  }

  // ── Endorsements ──

  /** Create an endorsement */
  async createEndorsement(params: {
    endorserType: string;
    endorserId: string;
    endorseeType: string;
    endorseeId: string;
    category: string;
    message?: string;
    riskShareBps?: number;
  }): Promise<any> {
    return this.request('POST', '/v1/open/endorsements', params);
  }

  // ── Webhooks ──

  /** Register a webhook endpoint */
  async registerWebhook(config: WebhookEndpointConfig): Promise<any> {
    return this.request('POST', '/v1/webhooks', config);
  }

  /** List registered webhooks */
  async listWebhooks(): Promise<any[]> {
    return this.request('GET', '/v1/webhooks');
  }

  /** Delete a webhook */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request('DELETE', `/v1/webhooks/${webhookId}`);
  }

  /** Send a test webhook */
  async testWebhook(webhookId: string): Promise<any> {
    return this.request('POST', `/v1/webhooks/${webhookId}/test`);
  }

  // ── Health ──

  /** Check API health */
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('GET', '/v1/health');
  }
}
