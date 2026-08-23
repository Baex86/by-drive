import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from './AuthProvider';

export const metadata: Metadata = {
  title: 'BY Drive',
  description: 'Super Drive Aggregator System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}