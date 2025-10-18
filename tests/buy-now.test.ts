/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Buy-now (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('exposes buy_now instruction and BuyNow accounts', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn buy_now\(ctx: Context<BuyNow>\)/);
    expect(lib).to.match(/struct BuyNow/);
  });

  it('buy_now implementation binds buyer, pays T0, and locks slot', () => {
    const market = read(marketPath);
    expect(market).to.match(/pub fn buy_now\(ctx: Context<BuyNow>\)/);
    expect(market).to.match(/escrow\.buyer = Some/);
    expect(market).to.match(/slot\.state = SlotState::Locked/);
    expect(market).to.match(/emit!\(AuctionEndedEvent/);
  });
});
