import { expect } from 'chai';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('SDK higher-level client helpers (P2) TDD', () => {
  const root = process.cwd();
  const idx = readFileSync(join(root, 'packages', 'ts-sdk', 'src', 'index.ts'), 'utf8');
  const pdas = readFileSync(join(root, 'packages', 'ts-sdk', 'src', 'helpers', 'pdas.ts'), 'utf8');

  it('SDK exports pdas helpers from index.ts', () => {
    expect(idx).to.match(/export\s*\*\s*as\s*pdas\s*from\s*['"]\.\/helpers\/pdas['"]/);
  });

  it('PDA helpers include expected seed derivations', () => {
    expect(pdas).to.match(/findProgramAddressSync\(\[/);
    expect(pdas).to.match(/'platform'/);
    expect(pdas).to.match(/'fee'/);
    expect(pdas).to.match(/'creator'/);
    expect(pdas).to.match(/'slot'/);
    expect(pdas).to.match(/'escrow'/);
    expect(pdas).to.match(/'bidbook'/);
    expect(pdas).to.match(/'refund'/);
    expect(pdas).to.match(/'commit'/);
    expect(pdas).to.match(/'autobid'/);
    expect(pdas).to.match(/'nft_auth'/);
  });
});
