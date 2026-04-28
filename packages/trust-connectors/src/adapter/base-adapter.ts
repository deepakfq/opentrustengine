import { RawPlatformEvent, NormalizedTrustEvent, AdapterConfig, PlatformEventMapping } from '../types';

export abstract class BaseAdapter {
  abstract readonly platform: string;
  abstract readonly displayName: string;
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  abstract verifySignature(rawBody: string | Buffer, headers: Record<string, string>): boolean;
  abstract getEventMappings(): PlatformEventMapping[];

  normalize(raw: RawPlatformEvent): NormalizedTrustEvent[] {
    const mappings = this.getEventMappings();
    const matching = mappings.filter(m => m.platformEvent === raw.eventType);

    if (matching.length === 0) return [];

    return matching.map(mapping => {
      const entityId = mapping.entityIdExtractor(raw.payload);
      const entityType = this.config.entityMapping?.entityType || 'user';

      return {
        entityType,
        entityId,
        eventType: mapping.trustEventType,
        role: mapping.role,
        rawValue: mapping.valueExtractor(raw.payload),
        metadata: {
          ...mapping.metadataExtractor(raw.payload),
          _source: this.platform,
          _sourceEvent: raw.eventType,
          _receivedAt: raw.receivedAt.toISOString(),
        },
        source: this.platform,
        sourceEventId: this.extractSourceEventId(raw.payload),
      };
    }).filter(e => e.entityId);  // skip events without entity ID
  }

  supportedEvents(): string[] {
    return this.getEventMappings().map(m => m.platformEvent);
  }

  protected extractSourceEventId(payload: any): string | undefined {
    return payload.id || payload.event_id || payload.order_id || undefined;
  }
}
