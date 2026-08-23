import './globals.css';
import AuthProvider from './AuthProvider';

export const metadata = {
  title: 'BY DRIVE',
  description: 'Aggregator System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}