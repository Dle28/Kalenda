"use client";
import React from 'react';

export type CatItem = { key: string; label: string; icon?: React.ReactNode };

export default function CategoryBar({ items, active, onChange }: { items: CatItem[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="catbar">
      <div className="cat-track">
        {items.map((it) => {
          const sel = active === it.key;
          return (
            <button key={it.key} className={`cat-item ${sel ? 'active' : ''}`} onClick={() => onChange(it.key)}>
              <span className="cat-ico" aria-hidden>{it.icon}</span>
              <span className="cat-label">{it.label}</span>
              {sel && <span className="cat-underline" />}
            </button>
          );
        })}
      </div>
      <style>{`
        .catbar { position: relative; padding: 8px 0 2px; margin: 6px 0 8px; overflow: hidden }
        .cat-track { display: flex; gap: 18px; align-items: center; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none }
        .cat-track::-webkit-scrollbar { display: none }
        .cat-item { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.04); color: #e5e7eb; cursor: pointer }
        .cat-item:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.16) }
        .cat-item.active { background: rgba(239,132,189,.12); border-color: rgba(239,132,189,.35) }
        .cat-ico { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; filter: saturate(1.1) }
        .cat-label { font-size: 14px; white-space: nowrap }
        .cat-underline { position:absolute; left:10px; right:10px; bottom:-6px; height:2px; background: linear-gradient(90deg, rgba(239,132,189,.9), rgba(59,130,246,.8)); border-radius: 999px }
        @media (max-width: 960px) { .cat-item { padding: 6px 8px } .cat-label { font-size: 13px } }
      `}</style>
    </div>
  );
}


