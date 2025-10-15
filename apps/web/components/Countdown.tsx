"use client";
import { useEffect, useState } from 'react';

function fmt(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n:number)=>n.toString().padStart(2,'0');
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
}

export default function Countdown({ to }: { to: Date }) {
  const [left, setLeft] = useState(to.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(to.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [to]);
  return <span className="muted">Còn {fmt(left)}</span>;
}

