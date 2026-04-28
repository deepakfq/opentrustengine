import { AdapterRegistry } from '../adapter/adapter-registry';
import { RawPlatformEvent, NormalizedTrustEvent } from '../types';

export class EventNormalizer {
  private registry: AdapterRegistry;

  constructor(registry: AdapterRegistry) {
    this.registry = registry;
  }

  normalize(raw: RawPlatformEvent): NormalizedTrustEvent[] {
    const adapter = this.registry.get(raw.platform);
    if (!adapter) {
      throw new Error(`No adapter registered for platform: ${raw.platform}`);
    }
    return adapter.normalize(raw);
  }

  canHandle(platform: string): boolean {
    return this.registry.has(platform);
  }
}
