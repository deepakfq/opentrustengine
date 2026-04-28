import { SDKConfig, TrustProfile, TrustVerification, TrustRoleScore, TrustPillarScore, TrustBadge, TrustEndorsement } from './types';

export class OneTrustEngine {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: SDKConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'https://api.onetrustengine.com';
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
          throw new Error(`OneTrustEngine API error ${response.status}: ${error.message || response.statusText}`);
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

  // ── Profile ──

  /** Get full trust profile for an entity */
  async getProfile(entityType: string, entityId: string): Promise<TrustProfile> {
    return this.request('GET', `/v1/one/profile?entityType=${entityType}&entityId=${entityId}`);
  }

  /** Get just the trust score */
  async getScore(entityType: string, entityId: string): Promise<{ score: number; band: string; confidence: number }> {
    return this.request('GET', `/v1/one/score?entityType=${entityType}&entityId=${entityId}`);
  }

  // ── Verification ──

  /** Verify an entity's trust score (like a credit check) */
  async verify(entityType: string, entityId: string): Promise<TrustVerification> {
    return this.request('GET', `/v1/one/verify?entityType=${entityType}&entityId=${entityId}`);
  }

  /** Get a detailed trust report */
  async getReport(entityType: string, entityId: string): Promise<any> {
    return this.request('GET', `/v1/one/report?entityType=${entityType}&entityId=${entityId}`);
  }

  // ── Roles ──

  /** Get all role scores for an entity */
  async getRoles(entityType: string, entityId: string): Promise<TrustRoleScore[]> {
    return this.request('GET', `/v1/one/roles?entityType=${entityType}&entityId=${entityId}`);
  }

  /** Get pillar breakdown for a specific role */
  async getRolePillars(entityType: string, entityId: string, role: string): Promise<TrustPillarScore[]> {
    return this.request('GET', `/v1/one/roles/${role}/pillars?entityType=${entityType}&entityId=${entityId}`);
  }

  // ── Badges ──

  /** Get earned badges for an entity */
  async getBadges(entityType: string, entityId: string): Promise<TrustBadge[]> {
    return this.request('GET', `/v1/one/badges?entityType=${entityType}&entityId=${entityId}`);
  }

  // ── Endorsements ──

  /** Get endorsements for an entity */
  async getEndorsements(entityType: string, entityId: string): Promise<TrustEndorsement[]> {
    return this.request('GET', `/v1/one/endorsements?entityType=${entityType}&entityId=${entityId}`);
  }

  // ── Leaderboard ──

  /** Get trust leaderboard */
  async getLeaderboard(entityType: string, options?: { role?: string; limit?: number }): Promise<any[]> {
    const params = new URLSearchParams({ entityType });
    if (options?.role) params.set('role', options.role);
    if (options?.limit) params.set('limit', options.limit.toString());
    return this.request('GET', `/v1/one/leaderboard?${params}`);
  }

  // ── Health ──

  /** Check API health */
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('GET', '/v1/health');
  }
}
