import { NormalizedTrustEvent } from '../types';

export class EventBatcher {
  private queue: NormalizedTrustEvent[] = [];
  private batchSize: number;
  private flushIntervalMs: number;
  private flushCallback: (events: NormalizedTrustEvent[]) => Promise<void>;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    batchSize: number,
    flushIntervalMs: number,
    flushCallback: (events: NormalizedTrustEvent[]) => Promise<void>
  ) {
    this.batchSize = batchSize;
    this.flushIntervalMs = flushIntervalMs;
    this.flushCallback = flushCallback;
  }

  add(event: NormalizedTrustEvent): void {
    this.queue.push(event);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    try {
      await this.flushCallback(batch);
    } catch (err) {
      // Re-add to front of queue on failure
      this.queue.unshift(...batch);
      throw err;
    }
  }

  get pending(): number { return this.queue.length; }

  async destroy(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.queue.length > 0) await this.flush();
  }
}
