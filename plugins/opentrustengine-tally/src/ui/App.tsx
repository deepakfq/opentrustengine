import React, { useState, useEffect } from 'react';
import { SettingsPage } from './SettingsPage';
import { StatusPage } from './StatusPage';

type Tab = 'settings' | 'status';

declare global {
  interface Window {
    tallyAgent: {
      getConfig: () => Promise<any>;
      saveConfig: (config: any) => Promise<{ success: boolean }>;
      getStatus: () => Promise<any>;
      syncNow: () => Promise<{ success: boolean; error?: string }>;
      getEventLog: () => Promise<any[]>;
      testConnection: (config: { host: string; port: number; company: string }) => Promise<{ success: boolean; companies?: string[]; error?: string }>;
      onTriggerSync: (callback: () => void) => void;
    };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  useEffect(() => {
    // Listen for tray "Sync Now" trigger
    window.tallyAgent.onTriggerSync(() => {
      window.tallyAgent.syncNow();
    });
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>OpenTrustEngine Tally Agent</h1>
        <nav style={styles.nav}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'settings' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'status' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('status')}
          >
            Status
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'status' && <StatusPage />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 640,
    margin: '0 auto',
    padding: 20,
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 12px 0',
  },
  nav: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    borderRadius: 6,
    color: '#6b7280',
  },
  tabActive: {
    background: '#f3f4f6',
    color: '#1a1a1a',
    fontWeight: 500,
  },
  main: {
    minHeight: 400,
  },
};
