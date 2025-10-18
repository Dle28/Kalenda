/// <reference types="mocha" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('Program ID consistency (P0)', () => {
  const root = process.cwd();
  const anchorTomlPath = join(root, 'Anchor.toml');
  const idlPath = join(root, 'target', 'idl', 'timemarket.json');
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const sdkIndexPath = join(root, 'packages', 'ts-sdk', 'src', 'index.ts');

  function parseAnchorTomlProgramId(toml: string): string | undefined {
    const lines = toml.split(/\r?\n/);
    let section: string | undefined;
    const found: Record<string, string> = {};
    for (const raw of lines) {
      const line = raw.trim();
      const sec = line.match(/^\[(.+?)\]$/);
      if (sec) {
        section = sec[1];
        continue;
      }
      const kv = line.match(/^timemarket\s*=\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"$/);
      if (kv && section?.startsWith('programs.')) {
        found[section] = kv[1];
      }
    }
    // Prefer provider cluster if matches
    const providerCluster = (toml.match(/^[ \t]*cluster\s*=\s*"(\w+)"/m)?.[1] || '').toLowerCase();
    if (providerCluster && found[`programs.${providerCluster}`]) return found[`programs.${providerCluster}`];
    // Fallback priority
    return found['programs.devnet'] || found['programs.localnet'] || found['programs.mainnet'] || Object.values(found)[0];
  }

  function parseRustDeclareId(src: string): string | undefined {
    const m = src.match(/declare_id!\(\"([1-9A-HJ-NP-Za-km-z]{32,44})\"\)/);
    return m?.[1];
  }

  function parseSdkProgramId(src: string): string | undefined {
    const m = src.match(/export const PROGRAM_ID\s*=\s*'([1-9A-HJ-NP-Za-km-z]{32,44})'/);
    return m?.[1];
  }

  it('Anchor.toml, Rust declare_id!, IDL, and SDK PROGRAM_ID should match', () => {
    const anchorToml = readFileSync(anchorTomlPath, 'utf8');
    const rustSrc = readFileSync(rustLibPath, 'utf8');
    const idl = readJson(idlPath);
    const sdkSrc = readFileSync(sdkIndexPath, 'utf8');

  const fromToml = parseAnchorTomlProgramId(anchorToml);
    const fromRust = parseRustDeclareId(rustSrc);
    const fromIdl = idl.address as string | undefined;
    const fromSdk = parseSdkProgramId(sdkSrc);

    expect(fromToml, 'Program ID missing in Anchor.toml').to.be.a('string');
    expect(fromRust, 'declare_id! missing in Rust').to.be.a('string');
    expect(fromIdl, 'IDL missing address').to.be.a('string');
    expect(fromSdk, 'SDK PROGRAM_ID missing').to.be.a('string');

  // Debug prints
  const tomlFirstLines = anchorToml.split(/\r?\n/).slice(0, 50).join('\n');
  console.log({ fromToml, fromRust, fromIdl, fromSdk, anchorToml: tomlFirstLines });

    expect(fromRust).to.equal(fromToml);
    expect(fromIdl).to.equal(fromToml);
    expect(fromSdk).to.equal(fromToml);
  });
});
