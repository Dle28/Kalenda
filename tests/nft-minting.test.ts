/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('NFT minting integration (P1) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('extends StableCheckin with NFT accounts and uses mint_to', () => {
    const lib = read(rustLibPath);
    const escrow = read(escrowPath);
    expect(lib).to.match(/struct StableCheckin[\s\S]*nft_mint[\s\S]*buyer_nft_ata[\s\S]*nft_auth/);
    expect(escrow).to.match(/mint_to\(/);
  });

  it('extends AuctionEnd/BuyNow/SealedAuctionEnd with NFT accounts and uses mint_to', () => {
    const lib = read(rustLibPath);
    const market = read(marketPath);
    expect(lib).to.match(/struct AuctionEnd[\s\S]*nft_mint[\s\S]*winner_nft_ata[\s\S]*nft_auth/);
    expect(lib).to.match(/struct BuyNow[\s\S]*nft_mint[\s\S]*buyer_nft_ata[\s\S]*nft_auth/);
    expect(lib).to.match(/struct SealedAuctionEnd[\s\S]*nft_mint[\s\S]*winner_nft_ata[\s\S]*nft_auth/);
    expect(market).to.match(/mint_to\(/);
  });
});
