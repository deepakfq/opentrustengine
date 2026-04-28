import { contextBridge, ipcRenderer } from 'electron';

export interface TallyAgentAPI {
  getConfig: () => Promise<AgentConfig>;
  saveConfig: (config: AgentConfig) => Promise<{ success: boolean }>;
  getStatus: () => Promise<AgentStatus>;
  syncNow: () => Promise<{ success: boolean; error?: string }>;
  getEventLog: () => Promise<EventLogEntry[]>;
  testConnection: (config: { host: string; port: number; company: string }) => Promise<{ success: boolean; companies?: string[]; error?: string }>;
  onTriggerSync: (callback: () => void) => void;
}

export interface AgentConfig {
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

export interface AgentStatus {
  tallyConnected: boolean;
  lastSyncAt: string | null;
  totalEventsSent: number;
  recentErrors: string[];
  isPolling: boolean;
}

export interface EventLogEntry {
  timestamp: string;
  eventType: string;
  voucherNumber: string;
  partyName: string;
  amount: number;
  status: 'sent' | 'error';
  error?: string;
}

const api: TallyAgentAPI = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getStatus: () => ipcRenderer.invoke('get-status'),
  syncNow: () => ipcRenderer.invoke('sync-now'),
  getEventLog: () => ipcRenderer.invoke('get-event-log'),
  testConnection: (config) => ipcRenderer.invoke('test-connection', config),
  onTriggerSync: (callback) => {
    ipcRenderer.on('trigger-sync', () => callback());
  },
};

contextBridge.exposeInMainWorld('tallyAgent', api);
