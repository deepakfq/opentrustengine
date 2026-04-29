import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenTrustEngine widget demo',
  description: 'A live trust badge embedded in a Next.js app.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Load the OTE widget from CDN */}
        <script src="https://cdn.opentrustengine.com/widget.min.js" defer />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, "Segoe UI", Inter, system-ui, sans-serif',
          background:
            'radial-gradient(circle at 20% 30%, #142342 0%, #0a1628 60%, #060d1f 100%)',
          color: '#f8f9fc',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
