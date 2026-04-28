import { createHash } from 'crypto';

export class Deduplicator {
  private cache: Map<string, number> = new Map();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 10000, ttlMs = 86400000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  isDuplicate(platform: string, sourceEventId: string | undefined, entityId: string): boolean {
    if (!sourceEventId) return false;
    const key = this.hash(platform, sourceEventId, entityId);
    const existing = this.cache.get(key);
    if (existing && Date.now() - existing < this.ttlMs) return true;
    this.cache.set(key, Date.now());
    this.evict();
    return false;
  }

  private hash(platform: string, eventId: string, entityId: string): string {
    return createHash('sha256').update(`${platform}:${eventId}:${entityId}`).digest('hex').slice(0, 16);
  }

  private evict(): void {
    if (this.cache.size <= this.maxSize) return;
    const now = Date.now();
    for (const [key, time] of this.cache) {
      if (now - time > this.ttlMs || this.cache.size > this.maxSize) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number { return this.cache.size; }
  clear(): void { this.cache.clear(); }
}
