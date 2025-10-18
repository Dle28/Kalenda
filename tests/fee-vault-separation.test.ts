/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Separate fee vault vs dispute vault (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('Platform struct has fee_vault and InitPlatform creates fee_vault via fee_authority PDA', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct Platform[\s\S]*fee_vault[\s\S]*dispute_vault/);
    expect(lib).to.match(/struct InitPlatform[\s\S]*fee_authority[\s\S]*fee_vault/);
  });

  it('AuctionEnd/BuyNow/Sealed flows route fees to fee_vault', () => {
    const lib = read(rustLibPath);
    const market = read(marketPath);
    // Account contexts reference fee_vault
    expect(lib).to.match(/struct AuctionEnd[\s\S]*fee_vault/);
    expect(lib).to.match(/struct BuyNow[\s\S]*fee_vault/);
    expect(lib).to.match(/struct SealedAuctionEnd[\s\S]*fee_vault/);
    expect(lib).to.match(/struct SealedAuctionSettle[\s\S]*fee_vault/);
    expect(lib).to.match(/struct AuctionSettle[\s\S]*fee_vault/);
    // Handler logic transfers to fee_vault instead of dispute vault
    expect(market).to.match(/to: fee_vault/);
  });

  it('Retained T1 amounts go to dispute_vault, not fee_vault', () => {
    const market = read(marketPath);
    const escrow = read(escrowPath);
    expect(market).to.match(/t1_withhold[\s\S]*to:\s*ctx\.accounts\.dispute_vault/);
    expect(escrow).to.match(/t1_withhold[\s\S]*to:\s*dispute_vault/);
  });
});
