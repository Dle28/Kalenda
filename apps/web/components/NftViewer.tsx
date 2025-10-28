"use client";
import { useEffect, useMemo, useState } from 'react';

type Cluster = 'mainnet' | 'mainnet-beta' | 'devnet' | 'testnet';

export default function NftViewer(props: { nftMint?: string; nftUri?: string; cluster?: Cluster }) {
  const { nftMint, nftUri, cluster: inputCluster } = props;
  const cluster: Cluster = (inputCluster || (process.env.NEXT_PUBLIC_CLUSTER as Cluster) || 'devnet');
  const [meta, setMeta] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!nftUri) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(nftUri, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
        const json = await res.json();
        if (!cancelled) setMeta(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load metadata');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [nftUri]);

  const explorerLinks = useMemo(() => {
    if (!nftMint) return [] as { label: string; href: string }[];
    const clusterParam = cluster && cluster !== 'mainnet' && cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : '';
    return [
      { label: 'Solscan', href: `https://solscan.io/token/${nftMint}${clusterParam}` },
      { label: 'SolanaFM', href: `https://solana.fm/address/${nftMint}${clusterParam}` },
    ];
  }, [nftMint, cluster]);

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <b>NFT Ticket</b>
        {nftMint && (
          <code style={{ fontSize: 12 }}>{nftMint.slice(0, 6)}...{nftMint.slice(-4)}</code>
        )}
      </div>

      {nftUri ? (
        loading ? (
          <span className="muted">Loading metadata…</span>
        ) : error ? (
          <span className="muted">{error}</span>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {meta?.image ? (
              <img src={meta.image} alt={meta?.name || 'NFT'} style={{ width: '100%', borderRadius: 8 }} />
            ) : (
              <div className="card muted">No image in metadata</div>
            )}
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{meta?.name || 'Unnamed NFT'}</b>
              <span className="muted" style={{ fontSize: 12 }}>{meta?.symbol || ''}</span>
            </div>
            {meta?.description && <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{meta.description}</div>}
            {Array.isArray(meta?.attributes) && meta.attributes.length > 0 && (
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {meta.attributes.map((a: any, i: number) => (
                  <div key={i} className="card" style={{ padding: 8 }}>
                    <div className="muted" style={{ fontSize: 12 }}>{a?.trait_type || 'Trait'}</div>
                    <div>{String(a?.value ?? '')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="card muted">NFT sẽ hiển thị ở đây sau khi check-in (chưa có metadata).</div>
      )}

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button
          className="btn btn-outline"
          style={{ padding: '6px 10px' }}
          disabled={!nftMint}
          onClick={() => {
            if (!nftMint) return;
            navigator.clipboard.writeText(nftMint);
          }}
        >
          Copy mint
        </button>
        {explorerLinks.map((l) => (
          <a key={l.href} className="btn btn-outline" href={l.href} target="_blank" rel="noreferrer" style={{ padding: '6px 10px' }}>
            Open {l.label}
          </a>
        ))}
        {meta && (
          <a
            className="btn btn-outline"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(meta, null, 2))}`}
            download={(meta?.name || 'metadata').replace(/\s+/g, '_') + '.json'}
            style={{ padding: '6px 10px' }}
          >
            Download JSON
          </a>
        )}
      </div>
    </div>
  );
}


