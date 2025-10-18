/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Multi-capacity slots (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('TimeSlot has capacity_total and capacity_sold; LEN updated', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct TimeSlot[\s\S]*capacity_total[\s\S]*capacity_sold/);
    expect(lib).to.match(/CapacityExhausted/);
    expect(lib).to.match(/MultiCapacityUnsupported/);
  });

  it('create_time_slot maps params.capacity to capacity_total and guards auctions', () => {
    const market = read(marketPath);
    expect(market).to.match(/slot\.capacity_total\s*=\s*params\.capacity/);
    expect(market).to.match(/slot\.capacity_sold\s*=\s*0/);
    expect(market).to.match(/require!\(params\.capacity\s*==\s*1,\s*ErrorCode::MultiCapacityUnsupported\)/);
  });

  it('stable_reserve enforces remaining capacity and check-in increments sold', () => {
    const escrow = read(escrowPath);
    expect(escrow).to.match(/require!\(slot\.capacity_sold\s*<\s*slot\.capacity_total,\s*ErrorCode::CapacityExhausted\)/);
    expect(escrow).to.match(/slot\.capacity_sold\s*=\s*slot\.capacity_sold\.saturating_add\(1\)/);
  });

  it('auction paths guard capacity_total == 1', () => {
    const market = read(marketPath);
    expect(market).to.match(/auction_start[\s\S]*require!\(slot\.capacity_total\s*==\s*1,\s*ErrorCode::MultiCapacityUnsupported\)/);
    expect(market).to.match(/buy_now[\s\S]*require!\(slot\.capacity_total\s*==\s*1,\s*ErrorCode::MultiCapacityUnsupported\)/);
    expect(market).to.match(/bid_place[\s\S]*require!\(slot\.capacity_total\s*==\s*1,\s*ErrorCode::MultiCapacityUnsupported\)/);
    expect(market).to.match(/sealed_auction_end[\s\S]*require!\(slot\.capacity_total\s*==\s*1,\s*ErrorCode::MultiCapacityUnsupported\)/);
    expect(market).to.match(/sealed_auction_settle[\s\S]*require!\(slot\.capacity_total\s*==\s*1,\s*ErrorCode::MultiCapacityUnsupported\)/);
  });
});
