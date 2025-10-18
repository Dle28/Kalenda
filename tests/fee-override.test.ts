/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Fee override (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('defines effective_fee_bps helper', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn effective_fee_bps\(platform: &Platform, profile: &CreatorProfile\) -> u16/);
  });

  it('stable_settle uses effective_fee_bps for total_fee and T1 fee', () => {
    const escrow = read(escrowPath);
    expect(escrow).to.match(/let eff_bps = effective_fee_bps\(platform, &ctx\.accounts\.profile\)/);
  });

  it('auction_end and buy_now use effective_fee_bps for T0 fees; sealed-bid uses it for T0/T1', () => {
    const market = read(marketPath);
    expect(market).to.match(/effective_fee_bps\(&ctx\.accounts\.platform, &ctx\.accounts\.profile\)/);
    expect(market).to.match(/effective_fee_bps\(platform, &ctx\.accounts\.profile\)/);
  });
});
