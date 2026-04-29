export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '6rem 1.5rem' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, margin: 0 }}>
        Acme Trading Co.
      </h1>
      <p style={{ color: '#a8b3d1', fontSize: 18, marginTop: '0.75rem' }}>
        ISO 9001 manufacturer · 12 yrs in business · GST verified
      </p>

      <div
        style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5d6c8e', letterSpacing: 1.5 }}>
            VERIFIED TRUST SCORE
          </div>
          <div style={{ fontSize: 14, color: '#cdd5e8', marginTop: 8 }}>
            Independently scored by OpenTrustEngine — see live profile and audit log.
          </div>
        </div>

        {/* The OTE widget — replace with a real entityId from api.opentrustengine.com */}
        <div
          data-ote-widget
          data-entity-type="company"
          data-entity-id="00000000-0000-4000-8000-000000000001"
          data-theme="dark"
          data-size="lg"
        />
      </div>

      <p style={{ marginTop: '3rem', color: '#5d6c8e', fontSize: 13 }}>
        Powered by{' '}
        <a
          href="https://opentrustengine.com"
          style={{ color: '#f0c14b', textDecoration: 'none' }}
        >
          OpenTrustEngine
        </a>
      </p>
    </main>
  );
}
