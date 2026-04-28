import Store from 'electron-store';

interface AgentConfig {
  tallyHost: string;
  tallyPort: number;
  tallyCompany: string;
  apiKey: string;
  apiSecret: string;
  entityType: string;
  entityId: string;
  pollIntervalSeconds: number;
  autoStart: boolean;
}

interface EventLogEntry {
  timestamp: string;
  eventType: string;
  voucherNumber: string;
  partyName: string;
  amount: number;
  status: 'sent' | 'error';
  error?: string;
}

interface SyncStoreSchema {
  config: AgentConfig;
  lastSyncAt: string | null;
  processedGuids: string[];
  totalEventsSent: number;
  recentErrors: string[];
  eventLog: EventLogEntry[];
}

const DEFAULT_CONFIG: AgentConfig = {
  tallyHost: 'localhost',
  tallyPort: 9000,
  tallyCompany: '',
  apiKey: '',
  apiSecret: '',
  entityType: 'business',
  entityId: '',
  pollIntervalSeconds: 60,
  autoStart: false,
};

const MAX_PROCESSED_GUIDS = 10000;
const MAX_ERRORS = 50;
const MAX_EVENT_LOG = 500;

export class SyncState {
  private store: Store<SyncStoreSchema>;

  constructor() {
    this.store = new Store<SyncStoreSchema>({
      name: 'opentrustengine-tally-state',
      defaults: {
        config: DEFAULT_CONFIG,
        lastSyncAt: null,
        processedGuids: [],
        totalEventsSent: 0,
        recentErrors: [],
        eventLog: [],
      },
    });
  }

  // Config
  getConfig(): AgentConfig {
    return this.store.get('config');
  }

  saveConfig(config: Partial<AgentConfig>): void {
    const current = this.getConfig();
    this.store.set('config', { ...current, ...config });
  }

  // Sync timestamp
  getLastSyncAt(): string | null {
    return this.store.get('lastSyncAt');
  }

  recordSync(eventsSent: number): void {
    this.store.set('lastSyncAt', new Date().toISOString());
    const total = this.store.get('totalEventsSent') + eventsSent;
    this.store.set('totalEventsSent', total);
  }

  getTotalEventsSent(): number {
    return this.store.get('totalEventsSent');
  }

  // Deduplication
  isVoucherProcessed(guid: string): boolean {
    const guids = this.store.get('processedGuids');
    return guids.includes(guid);
  }

  markVoucherProcessed(guid: string): void {
    const guids = this.store.get('processedGuids');
    guids.push(guid);

    // Trim old GUIDs to prevent unbounded growth
    if (guids.length > MAX_PROCESSED_GUIDS) {
      guids.splice(0, guids.length - MAX_PROCESSED_GUIDS);
    }

    this.store.set('processedGuids', guids);
  }

  // Error log
  logError(message: string): void {
    const errors = this.store.get('recentErrors');
    errors.push(`[${new Date().toISOString()}] ${message}`);

    if (errors.length > MAX_ERRORS) {
      errors.splice(0, errors.length - MAX_ERRORS);
    }

    this.store.set('recentErrors', errors);
  }

  getRecentErrors(): string[] {
    return this.store.get('recentErrors');
  }

  clearErrors(): void {
    this.store.set('recentErrors', []);
  }

  // Event log
  addEventLogEntry(entry: EventLogEntry): void {
    const log = this.store.get('eventLog');
    log.push(entry);

    if (log.length > MAX_EVENT_LOG) {
      log.splice(0, log.length - MAX_EVENT_LOG);
    }

    this.store.set('eventLog', log);
  }

  getEventLog(): EventLogEntry[] {
    return this.store.get('eventLog');
  }

  clearEventLog(): void {
    this.store.set('eventLog', []);
  }

  // Stats
  getStats(): { totalEventsSent: number; lastSyncAt: string | null; processedCount: number } {
    return {
      totalEventsSent: this.store.get('totalEventsSent'),
      lastSyncAt: this.store.get('lastSyncAt'),
      processedCount: this.store.get('processedGuids').length,
    };
  }
}
