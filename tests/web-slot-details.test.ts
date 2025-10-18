import { expect } from 'chai';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(p: string) { return readFileSync(p, 'utf8'); }

describe('Web Frontend Slot Rendering Details', () => {
  const root = process.cwd();
  const web = join(root, 'apps', 'web');

  it('Creator profile renders price labels for auction vs fixed', () => {
    const txt = read(join(web, 'app', 'creator', '[pubkey]', 'page.tsx'));
    // Auction shows Starting price
    expect(txt).to.match(/Starting price/);
    // Fixed shows Price label
    expect(txt).to.match(/'Price'|\{s\.mode === 'EnglishAuction' \? 'Starting price' : 'Price'\}/);
    // ReserveButton is used for Stable slots
    expect(txt).to.match(/ReserveButton/);
  });

  it('Slot detail exposes both BidRoom and Reserve now text', () => {
    const txt = read(join(web, 'app', 'slot', '[id]', 'page.tsx'));
    expect(txt).to.match(/BidRoom/);
    expect(txt).to.match(/Reserve now/);
  });
});
