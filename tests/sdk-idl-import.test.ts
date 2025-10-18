import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(p: string) { return readFileSync(p, 'utf8'); }

describe('SDK IDL import (P0) TDD', () => {
  const root = process.cwd();
  const sdkRoot = join(root, 'packages', 'ts-sdk');
  const idlIdx = join(sdkRoot, 'idl', 'index.ts');
  const idlJson = join(sdkRoot, 'idl', 'timemarket.json');
  const srcIdlIdx = join(sdkRoot, 'src', 'idl', 'index.ts');
  const srcIdlJson = join(sdkRoot, 'src', 'idl', 'timemarket.json');
  const srcIndex = join(sdkRoot, 'src', 'index.ts');

  it('idl/index.ts imports ./timemarket.json and exports it', () => {
    const txt = read(idlIdx);
    expect(txt).to.match(/import\s+.*from\s+"\.\/timemarket\.json"/);
    expect(txt).to.match(/export\s+\{\s*.*\s*\}/);
  });

  it('src/idl/index.ts imports ./timemarket.json and exports it', () => {
    const txt = read(srcIdlIdx);
    expect(txt).to.match(/import\s+.*from\s+"\.\/timemarket\.json"/);
    expect(txt).to.match(/export\s+\{\s*timemarketIdl\s*\}/);
  });

  it('IDL JSON exists in both idl/ and src/idl/ (placeholder acceptable)', () => {
    const raw1 = read(idlJson);
    const raw2 = read(srcIdlJson);
    expect(raw1.length).to.be.greaterThan(2);
    expect(raw2.length).to.be.greaterThan(2);
  });

  it('SDK exports PROGRAM_ID constant in src/index.ts with correct address', () => {
    const txt = read(srcIndex);
    expect(txt).to.match(/export\s+const\s+PROGRAM_ID\s*=\s*'Gz7jdgqsn3R8mBrthEx5thAFYdM369kHN7wMTY3PKhty'/);
  });
});
