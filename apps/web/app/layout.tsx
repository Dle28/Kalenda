import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'TimeMarket',
  description: 'Đặt lịch số thông minh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <header className="container">
          <nav className="nav">
            <Link href="/" className="brand">TimeMarket</Link>
            <div className="spacer" />
            <Link href="/creators" className="link">Khám phá Creator</Link>
            <Link href="/creator/onboard" className="btn btn-secondary">Trở thành Creator</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="container muted">© {new Date().getFullYear()} TimeMarket</footer>
      </body>
    </html>
  );
}

