import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Providers from '../src/app/providers';

export const metadata: Metadata = {
  title: 'TimeMarket',
  description: 'Đặt lịch số thông minh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const WalletMultiButton = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
  );
  return (
    <html lang="vi">
      <body>
        <Providers>
          <header className="container">
            <nav className="nav">
              <Link href="/" className="brand">TimeMarket</Link>
              <div className="spacer" />
              <Link href="/creators" className="link">Khám phá Creator</Link>
              <Link href="/creator/onboard" className="link">Trở thành Creator</Link>
              <div style={{ marginLeft: 12 }}>
                <WalletMultiButton />
              </div>
            </nav>
          </header>
          <main className="container">{children}</main>
          <footer className="container muted">© {new Date().getFullYear()} TimeMarket</footer>
        </Providers>
      </body>
    </html>
  );
}

