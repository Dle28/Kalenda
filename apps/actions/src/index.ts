import { Hono } from 'hono';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const app = new Hono();
const endpoint = process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com';

app.get('/health', c => c.text('ok'));

app.post('/actions/airdrop', async c => {
  try {
    const { address, lamports } = await c.req.json();
    const conn = new Connection(endpoint);
    const pubkey = new PublicKey(address);

    const tx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: pubkey,
      toPubkey: pubkey,
      lamports: lamports ?? 1_000_000,
    }));
    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
    return c.json({ transaction: serialized });
  } catch (e: any) {
    return c.json({ error: e?.message ?? 'failed' }, 400);
  }
});

export default app;

// If run directly (Node), start a local server on port 8787
if (typeof Bun === 'undefined' && typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'test') {
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port: Number(process.env.PORT || 8787) });
  // eslint-disable-next-line no-console
  console.log(`Actions server listening on http://localhost:${process.env.PORT || 8787}`);
}
