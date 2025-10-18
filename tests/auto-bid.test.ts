/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Auto-bid (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('defines AutoBidEntry and AutoBidStore with max_entries and space_for', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct AutoBidEntry/);
    expect(lib).to.match(/struct AutoBidStore/);
    expect(lib).to.match(/pub max_entries: u16,/);
    expect(lib).to.match(/impl AutoBidStore[\s\S]*pub fn space_for\(max_entries: u16\)/);
  });

  it('exposes init_auto_bid_store instruction and accounts', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn init_auto_bid_store\(ctx: Context<InitAutoBidStore>, max_entries: u16\)/);
    expect(lib).to.match(/struct InitAutoBidStore/);
  });

  it('BidPlace includes auto_bid_store account and bid_place uses _max_auto_bid to register/update', () => {
    const lib = read(rustLibPath);
    const market = read(marketPath);
    expect(lib).to.match(/struct BidPlace[\s\S]*auto_bid_store: Account<'info, AutoBidStore>/);
    expect(market).to.match(/pub fn bid_place\(ctx: Context<BidPlace>, bid_amount: u64, _max_auto_bid: Option<u64>\)/);
    expect(market).to.match(/if let Some\(max\) = _max_auto_bid \{/);
    expect(market).to.match(/store\.count < store\.max_entries/);
  });

  it('bid_place computes next_min and loops over auto bidders to outbid up to their max', () => {
    const market = read(marketPath);
    expect(market).to.match(/loop \{/);
    expect(market).to.match(/competitor: Option/);
    expect(market).to.match(/counter = next_min\.min\(comp_max\)/);
    expect(market).to.match(/book\.highest_bid = counter/);
    expect(market).to.match(/book\.highest_bidder = comp_bidder/);
  });
});
