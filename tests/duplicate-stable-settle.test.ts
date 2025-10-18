/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Duplicate stable_settle logic (P2) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('lib.rs stable_settle delegates to escrow::stable_settle (no duplicated logic)', () => {
    const lib = read(rustLibPath);
    // Exactly one definition in lib.rs
    const defs = lib.match(/pub fn stable_settle\(ctx: Context<StableSettle>\)/g) || [];
    expect(defs.length).to.equal(1);
    // Body delegates to escrow::stable_settle(ctx)
    expect(lib).to.match(/pub fn stable_settle\(ctx: Context<StableSettle>\) -> Result<\(\)>[\s\S]*?\{[\s\S]*?escrow::stable_settle\(ctx\)[\s\S]*?\}/);
  });

  it('escrow.rs owns the settlement logic and uses transfer_checked', () => {
    const escrow = read(escrowPath);
    expect(escrow).to.match(/pub fn stable_settle\(ctx: Context<StableSettle>\) -> Result<\(\)>/);
    expect(escrow).to.match(/transfer_checked\(/);
  });
});
