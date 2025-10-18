/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Refund queue for auctions (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('defines RefundEntry and RefundQueue with space_for and InitRefundQueue accounts', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct RefundEntry[\s\S]*bidder[\s\S]*amount/);
    expect(lib).to.match(/struct RefundQueue[\s\S]*max_entries[\s\S]*count[\s\S]*cursor[\s\S]*entries/);
    expect(lib).to.match(/impl RefundQueue[\s\S]*space_for/);
    expect(lib).to.match(/struct InitRefundQueue/);
  });

  it('wires refund_queue into BidPlace, BidOutbidRefund, and AuctionEnd accounts', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct BidPlace[\s\S]*refund_queue/);
    expect(lib).to.match(/struct BidOutbidRefund[\s\S]*refund_queue/);
    expect(lib).to.match(/struct AuctionEnd[\s\S]*refund_queue/);
  });

  it('has init_refund_queue handler and enqueues/consumes refunds in market.rs', () => {
    const market = read(marketPath);
    expect(market).to.match(/fn init_refund_queue/);
    expect(market).to.match(/q\.entries\.push\(RefundEntry/);
    expect(market).to.match(/bid_outbid_refund\([\s\S]*q\.cursor/);
  });

  it('removes direct pending_refund fields usage in market.rs init_bid_book and guards', () => {
    const market = read(marketPath);
    expect(market).to.not.match(/pending_refund_amount/);
    expect(market).to.not.match(/pending_refund_bidder/);
  });
});
