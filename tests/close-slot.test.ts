/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('Close/Cancel slot by creator/admin (P2) TDD', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const escrowPath = join(root, 'programs', 'timemarket', 'src', 'escrow.rs');

  it('lib.rs exposes close_slot (SPL) and close_slot_sol (SOL) entrypoints', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/pub fn close_slot\(ctx: Context<CloseSlot>\) -> Result<\(\)>/);
    expect(lib).to.match(/pub fn close_slot_sol\(ctx: Context<CloseSlotSol>\) -> Result<\(\)>/);
  });

  it('CloseSlot accounts include authority, platform, mint, slot, escrow + buyer refund accounts', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct CloseSlot[\s\S]*authority: Signer<'info>[\s\S]*platform: Account<'info, Platform>[\s\S]*mint: InterfaceAccount<'info, Mint>[\s\S]*slot: Account<'info, TimeSlot>[\s\S]*escrow: Account<'info, Escrow>[\s\S]*escrow_vault: InterfaceAccount<'info, TokenAccount>[\s\S]*buyer_token: InterfaceAccount<'info, TokenAccount>/);
  });

  it('CloseSlotSol accounts include authority, platform, slot, escrow and buyer SystemAccount', () => {
    const lib = read(rustLibPath);
    expect(lib).to.match(/struct CloseSlotSol[\s\S]*authority: Signer<'info>[\s\S]*platform: Account<'info, Platform>[\s\S]*slot: Account<'info, TimeSlot>[\s\S]*escrow: Account<'info, Escrow>[\s\S]*buyer: SystemAccount<'info>/);
  });

  it('escrow.rs implements close_slot using transfer_checked and sets state to Closed', () => {
    const escrow = read(escrowPath);
    expect(escrow).to.match(/pub fn close_slot\(ctx: Context<CloseSlot>\) -> Result<\(\)>/);
    expect(escrow).to.match(/transfer_checked\(/);
    expect(escrow).to.match(/slot\.state\s*=\s*SlotState::Closed/);
  });

  it('escrow.rs implements close_slot_sol using lamports transfer and sets state to Closed', () => {
    const escrow = read(escrowPath);
    expect(escrow).to.match(/pub fn close_slot_sol\(ctx: Context<CloseSlotSol>\) -> Result<\(\)>/);
    expect(escrow).to.match(/try_borrow_mut_lamports\(\)/);
    expect(escrow).to.match(/slot\.state\s*=\s*SlotState::Closed/);
  });
});
