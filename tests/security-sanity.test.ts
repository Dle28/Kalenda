/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Security sanity (P2) TDD', () => {
  const root = process.cwd();
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');
  const libPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');

  it('guards critical actions when slot.frozen == true', () => {
    const market = read(marketPath);
    expect(market).to.match(/buy_now[\s\S]*?require!\(!slot\.frozen, ErrorCode::Frozen\)/);
    expect(market).to.match(/bid_outbid_refund[\s\S]*?require!\(!slot\.frozen, ErrorCode::Frozen\)/);
    expect(market).to.match(/auction_end[\s\S]*?require!\(!slot\.frozen, ErrorCode::Frozen\)/);
    expect(market).to.match(/sealed_auction_end[\s\S]*?require!\(!slot\.frozen, ErrorCode::Frozen\)/);
  });

  it('CloseSlot account constrains buyer_token mint and logic checks owner + uses mint.decimals', () => {
    const lib = read(libPath);
    const escrow = read(escrowPath);
    expect(lib).to.match(/struct CloseSlot[\s\S]*buyer_token: InterfaceAccount<'info, TokenAccount>/);
    expect(lib).to.match(/constraint\s*=\s*buyer_token\.mint\s*==\s*mint\.key\(\)/);
    expect(escrow).to.match(/require!\(ctx\.accounts\.buyer_token\.owner\s*==\s*buyer_key, ErrorCode::UnauthorizedBuyer\)/);
    expect(escrow).to.match(/let decimals = ctx\.accounts\.mint\.decimals;/);
  });
});
