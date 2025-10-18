import { expect } from 'chai';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(p: string) { return readFileSync(p, 'utf8'); }

describe('Web Frontend Core Screens (P1) TDD', () => {
  const root = process.cwd();
  const web = join(root, 'apps', 'web');

  it('App wired with wallet providers and buttons', () => {
    const layout = read(join(web, 'app', 'layout.tsx'));
    const providers = read(join(web, 'app', 'providers.tsx'));
    expect(layout).to.match(/WalletButton/);
    expect(layout).to.match(/WalletStatus/);
    expect(providers).to.match(/ConnectionProvider/);
    expect(providers).to.match(/WalletProvider/);
    expect(providers).to.match(/WalletModalProvider/);
  });

  it('Creators listing page exists and renders CreatorCard', () => {
    const txt = read(join(web, 'app', 'creators', 'page.tsx'));
    expect(txt).to.match(/Explore creators/);
    expect(txt).to.match(/CreatorCard/);
  });

  it('Creator profile page shows available slots calendar and Reserve CTA', () => {
    const txt = read(join(web, 'app', 'creator', '[pubkey]', 'page.tsx'));
    expect(txt).to.match(/Available slots/);
    expect(txt).to.match(/Reserve/);
  });

  it('Slot page supports Auction (BidRoom) and Fixed price Reserve', () => {
    const txt = read(join(web, 'app', 'slot', '[id]', 'page.tsx'));
    expect(txt).to.match(/BidRoom/);
    expect(txt).to.match(/Reserve now/);
  });

  it('Creator onboard page initializes profile via Anchor (mocked now)', () => {
    const txt = read(join(web, 'app', 'creator', 'onboard', 'page.tsx'));
    expect(txt).to.match(/Become a Creator/);
    expect(txt).to.match(/getProgram/);
  });

  it('Creator dashboard provides create slot form and revenue panel', () => {
    const txt = read(join(web, 'app', 'creator', 'dashboard', 'page.tsx'));
    expect(txt).to.match(/Creator Dashboard/);
    expect(txt).to.match(/New slot/);
    expect(txt).to.match(/Revenue/);
  });

  it('Ticket page supports check-in toggle', () => {
    const txt = read(join(web, 'app', 'ticket', '[id]', 'page.tsx'));
    expect(txt).to.match(/Ticket/);
    expect(txt).to.match(/Mark as checked-in|Undo check-in/);
  });

  it('Support complaints page exists', () => {
    const txt = read(join(web, 'app', 'support', 'complaints', 'page.tsx'));
    expect(txt).to.match(/Complaint Center/);
  });
});
