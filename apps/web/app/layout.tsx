import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Providers from '../src/app/providers';
import WalletButton from '../components/WalletButton';
import WalletStatus from '../components/WalletStatus';

export const metadata: Metadata = {
  title: 'TimeMarket',
  description: 'Smart time booking on Solana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="container">
            <nav className="nav">
              <Link href="/" className="brand">TimeMarket</Link>
              <div className="spacer" />
              <Link href="/creators" className="link">Explore creators</Link>
              <Link href="/creator/onboard" className="link">Become a creator</Link>
              <div style={{ marginLeft: 12 }}>
                <WalletButton />
                <WalletStatus />
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

