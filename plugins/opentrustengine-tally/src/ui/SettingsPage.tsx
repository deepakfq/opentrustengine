import React, { useState, useEffect } from 'react';

interface FormState {
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

const DEFAULT_FORM: FormState = {
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

export function SettingsPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    window.tallyAgent.getConfig().then((config) => {
      setForm({ ...DEFAULT_FORM, ...config });
    });
  }, []);

  const handleChange = (field: keyof FormState, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.tallyAgent.saveConfig(form);
      setTestResult('Settings saved successfully.');
    } catch (err) {
      setTestResult('Failed to save settings.');
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.tallyAgent.testConnection({
        host: form.tallyHost,
        port: form.tallyPort,
        company: form.tallyCompany,
      });
      if (result.success) {
        setTestResult('Connected to Tally successfully!');
        if (result.companies) {
          setCompanies(result.companies);
        }
      } else {
        setTestResult(`Connection failed: ${result.error}`);
      }
    } catch (err) {
      setTestResult(`Connection error: ${err}`);
    }
    setTesting(false);
  };

  return (
    <div>
      {/* Tally Connection */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Tally Connection</h2>
        <div style={styles.row}>
          <label style={styles.label}>
            Host
            <input
              style={styles.input}
              value={form.tallyHost}
              onChange={(e) => handleChange('tallyHost', e.target.value)}
              placeholder="localhost"
            />
          </label>
          <label style={styles.label}>
            Port
            <input
              style={{ ...styles.input, width: 100 }}
              type="number"
              value={form.tallyPort}
              onChange={(e) => handleChange('tallyPort', parseInt(e.target.value) || 9000)}
            />
          </label>
        </div>
        <label style={styles.label}>
          Company Name
          {companies.length > 0 ? (
            <select
              style={styles.input}
              value={form.tallyCompany}
              onChange={(e) => handleChange('tallyCompany', e.target.value)}
            >
              <option value="">Select a company...</option>
              {companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              style={styles.input}
              value={form.tallyCompany}
              onChange={(e) => handleChange('tallyCompany', e.target.value)}
              placeholder="Company name in Tally"
            />
          )}
        </label>
        <div style={styles.buttonRow}>
          <button style={styles.secondaryBtn} onClick={handleTestConnection} disabled={testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <span style={styles.hint}>
            Tally Prime uses port 9000, ERP 9 uses port 9100
          </span>
        </div>
      </section>

      {/* OpenTrustEngine Settings */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>OpenTrustEngine</h2>
        <label style={styles.label}>
          API Key
          <input
            style={styles.input}
            value={form.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="ote_key_..."
          />
        </label>
        <label style={styles.label}>
          API Secret
          <input
            style={styles.input}
            type="password"
            value={form.apiSecret}
            onChange={(e) => handleChange('apiSecret', e.target.value)}
            placeholder="ote_secret_..."
          />
        </label>
        <div style={styles.row}>
          <label style={styles.label}>
            Entity Type
            <select
              style={styles.input}
              value={form.entityType}
              onChange={(e) => handleChange('entityType', e.target.value)}
            >
              <option value="business">Business</option>
              <option value="seller">Seller</option>
              <option value="vendor">Vendor</option>
            </select>
          </label>
          <label style={styles.label}>
            Entity ID
            <input
              style={styles.input}
              value={form.entityId}
              onChange={(e) => handleChange('entityId', e.target.value)}
              placeholder="Your entity ID"
            />
          </label>
        </div>
      </section>

      {/* Sync Settings */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Sync Settings</h2>
        <div style={styles.row}>
          <label style={styles.label}>
            Poll Interval (seconds)
            <input
              style={{ ...styles.input, width: 100 }}
              type="number"
              min={10}
              value={form.pollIntervalSeconds}
              onChange={(e) => handleChange('pollIntervalSeconds', parseInt(e.target.value) || 60)}
            />
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.autoStart}
              onChange={(e) => handleChange('autoStart', e.target.checked)}
            />
            Auto-start sync on launch
          </label>
        </div>
      </section>

      {/* Actions */}
      <div style={styles.buttonRow}>
        <button style={styles.primaryBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {testResult && (
        <div style={{
          ...styles.resultBox,
          borderColor: testResult.includes('success') || testResult.includes('Connected')
            ? '#22c55e' : '#ef4444',
        }}>
          {testResult}
        </div>
      )}
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
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    gap: 4,
    marginBottom: 12,
    flex: 1,
  },
  input: {
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    padding: '8px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '8px 16px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#374151',
    marginBottom: 12,
  },
  resultBox: {
    marginTop: 16,
    padding: '10px 14px',
    borderLeft: '3px solid',
    background: '#f9fafb',
    fontSize: 13,
    borderRadius: 4,
  },
};
