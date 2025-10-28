import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import Providers from './providers';
import WalletButton from '../components/WalletButton';
import SearchBar from '../components/SearchBar';
import CombinedHeaderProfile from '../components/CombinedHeaderProfile';
import WalletStatus from '../components/WalletStatus';
export const metadata: Metadata = {
  title: 'Kalenda',
  description: 'Smart time booking on Solana',
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        {/* Fonts for display + body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta httpEquiv="Content-Language" content="en" />
        <Script id="no-translate-guard" strategy="beforeInteractive">{`
          try {
            document.documentElement.setAttribute('translate', 'no');
            document.documentElement.classList.add('notranslate');
            if (document.body) {
              document.body.setAttribute('translate', 'no');
              document.body.classList.add('notranslate');
            }
            const purge = () => {
              document.querySelectorAll('[class*="translate-tooltip"], [class*="hidden_translate"]').forEach((node) => {
                node.remove();
              });
            };
            purge();
            const observer = new MutationObserver((mutations) => {
              let changed = false;
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (
                    node.nodeType === 1 &&
                    typeof node.className === 'string' &&
                    (node.className.includes('translate-tooltip') || node.className.includes('hidden_translate'))
                  ) {
                    node.remove();
                    changed = true;
                  }
                });
              });
              if (changed) purge();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
          } catch (error) {
            console.warn('translate guard failed', error);
          }
        `}</Script>
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <header className="container">
            <nav className="nav nav-rounded">
              <Link href="/" className="brand">Kalenda</Link>
              <SearchBar />
              <div className="spacer" />
              <Link href="/creators" className="link">Explore creators</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                <CombinedHeaderProfile />
                <WalletButton />
              </div>
            </nav>
          </header>
          <main className="container">{children}</main>
          <footer className="container muted">&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> Kalenda</footer>
        </Providers>
      </body>
    </html>
  );
}

