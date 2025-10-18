#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync, cpSync } from 'fs';
import { dirname, join } from 'path';

// Sync IDL into SDK sources (src/idl and idl) and optionally into dist/idl after build.

const ROOT = process.cwd();
const SRC_IDL = join(ROOT, 'target', 'idl', 'timemarket.json');
const SDK_SRC_IDL = join(ROOT, 'packages', 'ts-sdk', 'src', 'idl', 'timemarket.json');
const SDK_PKG_IDL = join(ROOT, 'packages', 'ts-sdk', 'idl', 'timemarket.json');
const SDK_DIST_IDL_DIR = join(ROOT, 'packages', 'ts-sdk', 'dist', 'idl');
const MODE = process.argv[2] || 'copy-src'; // copy-src | copy-dist

function ensureDir(p) {
  try { mkdirSync(dirname(p), { recursive: true }); } catch {}
}

function copy(from, to) {
  ensureDir(to);
  const data = readFileSync(from, 'utf8');
  writeFileSync(to, data);
}

if (!existsSync(SRC_IDL)) {
  // Fallback: if target/idl doesn't exist (local dev), keep placeholders.
  process.exit(0);
}

if (MODE === 'copy-src') {
  copy(SRC_IDL, SDK_SRC_IDL);
  copy(SRC_IDL, SDK_PKG_IDL);
  console.log('[sync-idl] Copied IDL to src/idl and idl/.');
} else if (MODE === 'copy-dist') {
  ensureDir(join(SDK_DIST_IDL_DIR, 'x'));
  cpSync(join(ROOT, 'packages', 'ts-sdk', 'idl'), SDK_DIST_IDL_DIR, { recursive: true });
  console.log('[sync-idl] Copied IDL to dist/idl.');
} else {
  console.warn('[sync-idl] Unknown mode:', MODE);
}

