export interface RawPlatformEvent {
  platform: string;
  eventType: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  receivedAt: Date;
}

export interface NormalizedTrustEvent {
  entityType: string;
  entityId: string;
  eventType: string;
  role: string;
  rawValue: number;
  metadata: Record<string, any>;
  source: string;
  sourceEventId?: string;
  idempotencyKey?: string;
}

export interface AdapterConfig {
  platform: string;
  webhookSecret?: string;
  entityMapping?: EntityMappingConfig;
  customFields?: Record<string, string>;
}

export interface EntityMappingConfig {
  entityType: string;
  entityIdField: string;  // path in payload to extract entity ID
  fallbackEntityId?: string;
}

export interface ConnectorEngineConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  deduplicationTTL?: number;
  onError?: (error: Error, event: RawPlatformEvent) => void;
  onBatchSent?: (count: number) => void;
}

export interface IngestionResult {
  accepted: boolean;
  eventCount: number;
  deduplicated: boolean;
  error?: string;
}

export interface PlatformEventMapping {
  platformEvent: string;
  trustEventType: string;
  role: string;
  pillar: string;
  outcome: 'positive' | 'negative' | 'neutral';
  valueExtractor: (payload: any) => number;
  metadataExtractor: (payload: any) => Record<string, any>;
  entityIdExtractor: (payload: any) => string;
}
