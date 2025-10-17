// Simple IDL sync script
// Copies target/idl/timemarket.json into apps/web/idl/timemarket.json
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'target', 'idl', 'timemarket.json');
const dst = join(root, 'apps', 'web', 'idl', 'timemarket.json');

async function main() {
  try {
    const data = await fs.readFile(src);
    await fs.mkdir(dirname(dst), { recursive: true });
    await fs.writeFile(dst, data);
    console.log(`IDL synced to ${dst}`);
  } catch (e) {
    console.error('Failed to sync IDL:', e?.message || e);
    process.exit(1);
  }
}

main();

