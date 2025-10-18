/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Sealed-bid End/Settle TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('lib.rs exposes sealed_auction_end and sealed_auction_settle entrypoints', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn sealed_auction_end\(/);
    expect(lib).to.match(/pub fn sealed_auction_settle\(/);
    expect(lib).to.match(/struct SealedAuctionEnd/);
    expect(lib).to.match(/struct SealedAuctionSettle/);
  });

  it('market.rs implements sealed_auction_end and sealed_auction_settle and allows checkin for SealedBid', () => {
    const market = read(marketPath);
    expect(market).to.match(/pub fn sealed_auction_end\(ctx: Context<SealedAuctionEnd>\)/);
    expect(market).to.match(/pub fn sealed_auction_settle\(ctx: Context<SealedAuctionSettle>\)/);
    // auction_checkin should accept SealedBid as well
    expect(market).to.match(/matches!\(slot\.mode, Mode::EnglishAuction \| Mode::SealedBid\)/);
  });
});
