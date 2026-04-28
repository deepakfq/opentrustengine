import React, { useState, useEffect, useCallback } from 'react';

interface Status {
  tallyConnected: boolean;
  lastSyncAt: string | null;
  totalEventsSent: number;
  recentErrors: string[];
  isPolling: boolean;
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

export function StatusPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [s, log] = await Promise.all([
      window.tallyAgent.getStatus(),
      window.tallyAgent.getEventLog(),
    ]);
    setStatus(s);
    setEventLog(log);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSyncNow = async () => {
    setSyncing(true);
    await window.tallyAgent.syncNow();
    await refresh();
    setSyncing(false);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div>
      {/* Connection Status */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Connection Status</h2>
        <div style={styles.statusGrid}>
          <StatusBadge
            label="Tally"
            connected={status?.tallyConnected ?? false}
          />
          <StatusBadge
            label="Sync Engine"
            connected={status?.isPolling ?? false}
          />
        </div>
      </section>

      {/* Sync Stats */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Sync Statistics</h2>
        <div style={styles.statsRow}>
          <StatBox label="Last Sync" value={formatTime(status?.lastSyncAt ?? null)} />
          <StatBox label="Events Sent" value={String(status?.totalEventsSent ?? 0)} />
        </div>
        <button
          style={styles.syncBtn}
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </section>

      {/* Recent Errors */}
      {status?.recentErrors && status.recentErrors.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Errors</h2>
          <div style={styles.errorList}>
            {status.recentErrors.slice(-5).reverse().map((err, i) => (
              <div key={i} style={styles.errorItem}>{err}</div>
            ))}
          </div>
        </section>
      )}

      {/* Event Log */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Event Log</h2>
        {eventLog.length === 0 ? (
          <p style={styles.empty}>No events recorded yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Voucher</th>
                <th style={styles.th}>Party</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {eventLog.slice(-20).reverse().map((entry, i) => (
                <tr key={i}>
                  <td style={styles.td}>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  <td style={styles.td}>{entry.eventType}</td>
                  <td style={styles.td}>{entry.voucherNumber}</td>
                  <td style={styles.td}>{entry.partyName}</td>
                  <td style={styles.td}>{entry.amount.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      color: entry.status === 'sent' ? '#22c55e' : '#ef4444',
                      fontWeight: 500,
                    }}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div style={styles.badge}>
      <div style={{
        ...styles.dot,
        background: connected ? '#22c55e' : '#ef4444',
      }} />
      <span style={styles.badgeLabel}>{label}</span>
      <span style={{ ...styles.badgeStatus, color: connected ? '#22c55e' : '#9ca3af' }}>
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#6b7280',
    marginBottom: 12,
  },
  statusGrid: {
    display: 'flex',
    gap: 16,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },
  badgeStatus: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a1a',
  },
  syncBtn: {
    padding: '8px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  errorItem: {
    padding: '6px 10px',
    background: '#fef2f2',
    borderLeft: '3px solid #ef4444',
    fontSize: 12,
    color: '#991b1b',
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  empty: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    color: '#6b7280',
    fontSize: 11,
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '6px 8px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
  },
};
