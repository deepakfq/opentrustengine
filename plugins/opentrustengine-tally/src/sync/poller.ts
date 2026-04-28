import { TallyClient, TallyVoucher } from '../tally/tally-client';

export class TallyPoller {
  private client: TallyClient;
  private interval: NodeJS.Timeout | null = null;
  private lastSyncAt: Date;
  private onVouchers: (vouchers: TallyVoucher[]) => Promise<void>;
  private pollIntervalMs: number;
  private isPolling = false;

  constructor(
    client: TallyClient,
    onVouchers: (v: TallyVoucher[]) => Promise<void>,
    intervalMs = 60000,
  ) {
    this.client = client;
    this.onVouchers = onVouchers;
    this.pollIntervalMs = intervalMs;
    this.lastSyncAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Start from 24h ago
  }

  start(): void {
    if (this.interval) return;
    console.log('[TallyPoller] Starting with interval:', this.pollIntervalMs, 'ms');
    this.poll(); // Initial poll
    this.interval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('[TallyPoller] Stopped');
  }

  async poll(): Promise<void> {
    if (this.isPolling) {
      console.log('[TallyPoller] Skipping — previous poll still in progress');
      return;
    }

    this.isPolling = true;
    const now = new Date();
    const fromDate = this.formatDate(this.lastSyncAt);
    const toDate = this.formatDate(now);

    console.log(`[TallyPoller] Polling vouchers from ${fromDate} to ${toDate}`);

    try {
      // Check if Tally is running first
      const connected = await this.client.isConnected();
      if (!connected) {
        console.log('[TallyPoller] Tally is not running or not reachable');
        this.isPolling = false;
        return;
      }

      const vouchers = await this.client.getVouchers(fromDate, toDate);
      console.log(`[TallyPoller] Found ${vouchers.length} voucher(s)`);

      if (vouchers.length > 0) {
        await this.onVouchers(vouchers);
      }

      this.lastSyncAt = now;
    } catch (err) {
      console.error('[TallyPoller] Poll error:', err);
      // Don't update lastSyncAt on error so we retry the same window
    } finally {
      this.isPolling = false;
    }
  }

  setLastSyncAt(date: Date): void {
    this.lastSyncAt = date;
  }

  getLastSyncAt(): Date {
    return this.lastSyncAt;
  }

  private formatDate(d: Date): string {
    // Tally uses YYYYMMDD format
    return (
      `${d.getFullYear()}` +
      `${String(d.getMonth() + 1).padStart(2, '0')}` +
      `${String(d.getDate()).padStart(2, '0')}`
    );
  }
}
