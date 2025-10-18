/// <reference types="mocha" />
/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

function read(path: string) { return readFileSync(path, 'utf8'); }

describe('CommitStore capacity TDD (P0)', () => {
  const root = process.cwd();
  const rustLibPath = join(root, 'programs', 'timemarket', 'src', 'lib.rs');
  const marketPath = join(root, 'programs', 'timemarket', 'src', 'market.rs');

  it('CommitStore has persisted max_entries and space accounts for entries', () => {
    const lib = read(rustLibPath);
    // Struct fields
    expect(lib).to.match(/pub struct CommitStore[\s\S]*?pub max_entries: u16,/);
    expect(lib).to.match(/impl CommitStore[\s\S]*?pub fn space_for\(max_entries: u16\)/);
  });

  it('init_commit_store sets max_entries and reserves Vec capacity', () => {
    const market = read(marketPath);
    // Ensure we assign max_entries and use Vec::with_capacity
    expect(market).to.match(/store\.max_entries\s*=\s*max_entries;/);
    expect(market).to.match(/store\.entries\s*=\s*Vec::with_capacity\(max_entries as usize\)/);
  });

  it('bid_commit enforces store.count < store.max_entries (not Vec capacity)', () => {
    const market = read(marketPath);
    // Should use the persisted field
    expect(market).to.match(/require!\(store\.count\s*<\s*store\.max_entries,\s*ErrorCode::InvalidCapacity\)/);
    // And should not reference entries.capacity() in the check anymore
    expect(market).to.not.match(/entries\.capacity\(\)/);
  });
});
