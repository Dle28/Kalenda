/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Auction end update (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('exposes auction_update_end entrypoint and accounts', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn auction_update_end\(ctx: Context<AuctionUpdateEnd>, new_end_ts: i64\)/);
    expect(lib).to.match(/struct AuctionUpdateEnd/);
  });

  it('implements logic to set or extend end time and emits event', () => {
    const market = read(marketPath);
    expect(market).to.match(/pub fn auction_update_end\(ctx: Context<AuctionUpdateEnd>, new_end_ts: i64\)/);
    expect(market).to.match(/slot\.auction_end_ts = Some\(new_end_ts\)/);
    expect(market).to.match(/emit!\(AuctionExtendedEvent/);
  });
});
