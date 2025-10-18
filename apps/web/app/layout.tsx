import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import Providers from './providers';
import WalletButton from '../components/WalletButton';
import WalletStatus from '../components/WalletStatus';

export const metadata: Metadata = {
  title: 'TimeMarket',
  description: 'Smart time booking on Solana',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
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
          <footer className="container muted">© <span suppressHydrationWarning>{new Date().getFullYear()}</span> TimeMarket</footer>
        </Providers>
      </body>
    </html>
  );
}
