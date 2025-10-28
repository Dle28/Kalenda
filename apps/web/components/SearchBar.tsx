"use client";
import { useEffect, useMemo, useState } from 'react';
import { creators, slots } from '@/lib/mock';
import { summarizeSlotsByCreator } from '@/lib/slotSummary';

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const summaryIndex = useMemo(() => summarizeSlotsByCreator(slots as any), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.key.toLowerCase() === 'k') && (e.metaKey || e.ctrlKey);
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (open && e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return creators;
    return creators.filter((c) =>
      c.name.toLowerCase().includes(term) ||
      (c.fields || []).some((f) => f.toLowerCase().includes(term)) ||
      (c.bio || '').toLowerCase().includes(term)
    );
  }, [q]);

  return (
    <>
      <button
        className="search-trigger"
        aria-label="Search (Ctrl/⌘ K)"
        onClick={() => setOpen(true)}
      >
        <span className="muted">Search</span>
        <span className="kbd">⌘ K</span>
      </button>

      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ alignItems: 'center', gap: 8 }}>
              <input
                className="search-input"
                placeholder="Search creators, fields..."
                value={q}
                autoFocus
                onChange={(e) => setQ(e.target.value)}
              />
              <span className="kbd">Esc</span>
            </div>
            <div className="search-results">
              {results.length === 0 ? (
                <div className="muted" style={{ padding: 10 }}>No results</div>
              ) : (
                results.map((c) => (
                  <a key={c.pubkey} className="search-item" href={`/creator/${encodeURIComponent(c.pubkey)}`}>
                    <img src={c.avatar || 'https://placehold.co/48x48'} alt={c.name} width={36} height={36} style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,.12)' }} />
                    <div className="stack" style={{ minWidth: 0 }}>
                      <b className="one-line">{c.name}</b>
                      <span className="muted one-line" style={{ fontSize: 12 }}>{c.bio || (c.fields || []).join(', ')}</span>
                    </div>
                    {summaryIndex[c.pubkey]?.headline ? (
                      <span className="badge">{summaryIndex[c.pubkey]?.headline}</span>
                    ) : (
                      <span className="badge">Schedule coming soon</span>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


