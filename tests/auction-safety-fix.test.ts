/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Auction safety fix (superseded by refund queue) TDD', () => {
  const root = process.cwd();
  const libPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('BidBook struct does NOT contain pending_refund fields', () => {
    const lib = read(libPath);
    expect(lib).to.match(/struct BidBook[\s\S]*pub slot: Pubkey[\s\S]*pub highest_bid: u64[\s\S]*pub highest_bidder: Pubkey/);
    expect(lib).to.not.match(/pending_refund_amount|pending_refund_bidder/);
  });

  it('bid_place enqueues outbid refunds to RefundQueue and does not have the old guard', () => {
    const market = read(marketPath);
    // no guard requiring pending_refund_amount == 0
    expect(market).to.not.match(/pending_refund_amount\s*==\s*0/);
    // enqueues refund into refund_queue
    expect(market).to.match(/q\.entries\.push\(RefundEntry\s*\{/);
    expect(market).to.match(/q\.count\s*=\s*q\.count\.saturating_add\(1\)/);
  });

  it('BidOutbidRefund consumes the refund queue entries', () => {
    const market = read(marketPath);
    expect(market).to.match(/pub fn bid_outbid_refund\(ctx: Context<BidOutbidRefund>\)/);
    expect(market).to.match(/let idx = q\.cursor as usize/);
    expect(market).to.match(/q\.cursor\s*=\s*q\.cursor\.saturating_add\(1\)/);
    expect(market).to.match(/q\.count\s*=\s*q\.count\.saturating_sub\(1\)/);
  });
});
