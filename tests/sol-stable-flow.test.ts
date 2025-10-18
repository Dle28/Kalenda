/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('SOL Stable flow (P2 optional) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('lib.rs exposes SOL stable entrypoints', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn stable_reserve_sol\(ctx: Context<StableReserveSol>\) -> Result<\(\)>/);
    expect(lib).to.match(/pub fn stable_cancel_sol\(ctx: Context<StableCancelSol>\) -> Result<\(\)>/);
    expect(lib).to.match(/pub fn stable_settle_sol\(ctx: Context<StableSettleSol>\) -> Result<\(\)>/);
  });

  it('escrow.rs implements SOL stable reserve/cancel/settle using lamports logic', () => {
    const escrow = read(escrowPath);
    // Reserve transfers via system_program::transfer
    expect(escrow).to.match(/stable_reserve_sol\(ctx: Context<StableReserveSol>\)/);
    expect(escrow).to.match(/system_program::transfer\(/);
    // Cancel moves lamports back via lamports borrows
    expect(escrow).to.match(/stable_cancel_sol\(ctx: Context<StableCancelSol>\)/);
    expect(escrow).to.match(/try_borrow_mut_lamports\(\)/);
    // Settle performs T0 and T1 branches and updates state
    expect(escrow).to.match(/stable_settle_sol\(ctx: Context<StableSettleSol>\)/);
    expect(escrow).to.match(/SettledT0Event/);
    expect(escrow).to.match(/SettledT1Event/);
  });
});
