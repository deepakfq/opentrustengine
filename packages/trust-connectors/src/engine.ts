import { BaseAdapter } from './adapter/base-adapter';
import { AdapterRegistry } from './adapter/adapter-registry';
import { EventNormalizer } from './pipeline/normalizer';
import { Deduplicator } from './pipeline/deduplicator';
import { EventBatcher } from './pipeline/batcher';
import { EventValidator } from './pipeline/validator';
import { ConnectorEngineConfig, RawPlatformEvent, NormalizedTrustEvent, IngestionResult } from './types';

export class ConnectorEngine {
  private registry: AdapterRegistry;
  private normalizer: EventNormalizer;
  private deduplicator: Deduplicator;
  private batcher: EventBatcher;
  private validator: EventValidator;
  private config: ConnectorEngineConfig;
  private stats = { ingested: 0, deduplicated: 0, invalid: 0, sent: 0, errors: 0 };

  constructor(config: ConnectorEngineConfig, adapters: BaseAdapter[] = []) {
    this.config = config;
    this.registry = new AdapterRegistry();
    this.validator = new EventValidator();
    this.deduplicator = new Deduplicator(10000, (config.deduplicationTTL || 86400) * 1000);
    this.normalizer = new EventNormalizer(this.registry);

    adapters.forEach(a => this.registry.register(a));

    this.batcher = new EventBatcher(
      config.batchSize || 50,
      config.flushIntervalMs || 5000,
      async (events) => this.sendBatch(events),
    );
  }

  registerAdapter(adapter: BaseAdapter): void {
    this.registry.register(adapter);
  }

  async ingest(platform: string, payload: any, headers: Record<string, string> = {}): Promise<IngestionResult> {
    const raw: RawPlatformEvent = {
      platform,
      eventType: this.extractEventType(platform, payload, headers),
      payload,
      headers,
      receivedAt: new Date(),
    };

    // Verify signature
    const adapter = this.registry.get(platform);
    if (!adapter) return { accepted: false, eventCount: 0, deduplicated: false, error: `Unknown platform: ${platform}` };

    if (adapter.verifySignature && headers) {
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      if (!adapter.verifySignature(rawBody, headers)) {
        return { accepted: false, eventCount: 0, deduplicated: false, error: 'Invalid signature' };
      }
    }

    // Normalize
    let normalized: NormalizedTrustEvent[];
    try {
      normalized = this.normalizer.normalize(raw);
    } catch (err) {
      this.stats.errors++;
      this.config.onError?.(err as Error, raw);
      return { accepted: false, eventCount: 0, deduplicated: false, error: (err as Error).message };
    }

    if (normalized.length === 0) {
      return { accepted: true, eventCount: 0, deduplicated: false };
    }

    let deduplicated = false;
    let accepted = 0;

    for (const event of normalized) {
      // Deduplicate
      if (this.deduplicator.isDuplicate(platform, event.sourceEventId, event.entityId)) {
        this.stats.deduplicated++;
        deduplicated = true;
        continue;
      }

      // Validate
      const validation = this.validator.validate(event);
      if (!validation.valid) {
        this.stats.invalid++;
        continue;
      }

      // Queue for batch send
      this.batcher.add(event);
      this.stats.ingested++;
      accepted++;
    }

    return { accepted: accepted > 0, eventCount: accepted, deduplicated };
  }

  private extractEventType(platform: string, payload: any, headers: Record<string, string>): string {
    // Different platforms put event type in different places
    return payload.event || payload.event_type || payload.type ||
           headers['x-razorpay-event-id'] || headers['x-webhook-event'] ||
           payload.action || 'unknown';
  }

  private async sendBatch(events: NormalizedTrustEvent[]): Promise<void> {
    const url = `${this.config.baseUrl || 'https://api.sttiz.com'}/v1/open/events/batch`;

    const body = events.map(e => ({
      entityType: e.entityType,
      entityId: e.entityId,
      eventType: e.eventType,
      role: e.role,
      rawValue: e.rawValue,
      metadata: e.metadata,
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-API-Secret': this.config.apiSecret,
      },
      body: JSON.stringify({ events: body }),
    });

    if (!res.ok) {
      throw new Error(`Batch send failed: ${res.status} ${res.statusText}`);
    }

    this.stats.sent += events.length;
    this.config.onBatchSent?.(events.length);
  }

  getStats() { return { ...this.stats, pending: this.batcher.pending, adapters: this.registry.list() }; }
  async flush(): Promise<void> { await this.batcher.flush(); }
  async destroy(): Promise<void> { await this.batcher.destroy(); }
}
