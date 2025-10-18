import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';
import { execSync } from 'child_process';

describe('SDK build distribution (P1) TDD', () => {
  const root = process.cwd();
  const sdkRoot = join(root, 'packages', 'ts-sdk');

  it('pnpm build produces dist outputs and dist/idl/timemarket.json', function() {
    this.timeout(20000);
    // Build only the ts-sdk package to keep it fast
    execSync('pnpm -s --filter @starter/ts-sdk run build', { cwd: root, stdio: 'inherit' });

  const distIdx = join(sdkRoot, 'dist', 'src', 'index.js');
  const distDts = join(sdkRoot, 'dist', 'src', 'index.d.ts');
    const distIdlIdx = join(sdkRoot, 'dist', 'idl', 'index.js');
    const distIdlDts = join(sdkRoot, 'dist', 'idl', 'index.d.ts');
    const distIdlJson = join(sdkRoot, 'dist', 'idl', 'timemarket.json');

    expect(existsSync(distIdx)).to.eq(true);
    expect(existsSync(distDts)).to.eq(true);
    expect(existsSync(distIdlIdx)).to.eq(true);
    expect(existsSync(distIdlDts)).to.eq(true);
    expect(existsSync(distIdlJson)).to.eq(true);
    const json = JSON.parse(readFileSync(distIdlJson, 'utf8'));
    expect(json.address).to.eq('Gz7jdgqsn3R8mBrthEx5thAFYdM369kHN7wMTY3PKhty');
  });
});
