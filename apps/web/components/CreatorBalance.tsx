"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export default function CreatorBalance({ creatorPubkey }: { creatorPubkey: string }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const isOwner = useMemo(() => publicKey?.toBase58() === creatorPubkey, [publicKey, creatorPubkey]);

  const [lamports, setLamports] = useState<number | null>(null);
  const [loadingSol, setLoadingSol] = useState(false);
  const [SOL, setSOL] = useState<number | null>(null);
  const [tokenBal, setTokenBal] = useState<number | null>(null);
  const [calBal, setCalBal] = useState<number | null>(null);
  const [customMint, setCustomMint] = useState<string>("");
  const [view, setView] = useState<"SOL" | "SOL" | "CAL" | "TOKEN">("SOL");
  const [solUsd, setSolUsd] = useState<number | null>(null);
  const PRICE_FETCH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PRICE_FETCH !== 'false';
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  async function refreshAll() {
    try {
      if (publicKey) {
        const bal = await connection.getBalance(publicKey);
        setLamports(bal);
      }
      if (publicKey) {
        const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "";
        const cluster = endpoint.includes("devnet") ? "devnet" : (endpoint.includes("testnet") ? "testnet" : "mainnet");
        const MINT = cluster === "mainnet" ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" : "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
        const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: tokenProgram });
        let total = 0;
        for (const it of resp.value) {
          const info = (it.account.data as any).parsed?.info;
          if (!info) continue;
          if (info.mint !== MINT) continue;
          const amt = info.tokenAmount?.uiAmount;
          total += Number(amt || 0);
        }
        setSOL(total);
      }
      try {
        const r = await fetch("https://price.jup.ag/v4/price?ids=SOL", { cache: "no-store" });
        const j = await r.json();
        const p = Number(j?.data?.SOL?.price);
        if (Number.isFinite(p)) setSolUsd(p);
      } catch {}
      if (publicKey && customMint) {
        try {
          const MINT = new PublicKey(customMint);
          const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
          const resp2 = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: tokenProgram });
          let sum = 0;
          for (const it of resp2.value) {
            const info = (it.account.data as any).parsed?.info;
            if (!info) continue;
            if (info.mint !== MINT.toBase58()) continue;
            const amt = info.tokenAmount?.uiAmount;
            sum += Number(amt || 0);
          }
          setTokenBal(sum);
        } catch {
          setTokenBal(null);
        }
      }
      // Refresh CAL token if configured
      const calMint = process.env.NEXT_PUBLIC_CAL_MINT || "";
      if (publicKey && calMint) {
        try {
          const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
          const r3 = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: tokenProgram });
          let sum2 = 0;
          for (const it of r3.value) {
            const info = (it.account.data as any).parsed?.info;
            if (!info) continue;
            if (info.mint !== calMint) continue;
            const amt = info.tokenAmount?.uiAmount;
            sum2 += Number(amt || 0);
          }
          setCalBal(sum2);
        } catch {
          setCalBal(null);
        }
      }
    } finally {
      setLastUpdated(Date.now());
    }
  }

  // SOL: initial load + subscribe
  useEffect(() => {
    let sub: number | null = null;
    let active = true;
    async function load() {
      try {
        if (!publicKey) return setLamports(null);
        setLoadingSol(true);
        const bal = await connection.getBalance(publicKey);
        if (!active) return;
        setLamports(bal);
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("Failed to get balance:", error);
        if (active) {
          setLamports(null);
        }
      } finally {
        if (active) setLoadingSol(false);
      }
    }
    load();
    if (publicKey) {
      try {
        sub = connection.onAccountChange(publicKey, (acc) => {
          setLamports(acc.lamports);
          setLastUpdated(Date.now());
        });
      } catch (error) {
        console.error("Failed to subscribe to account changes:", error);
      }
    }
    return () => { if (sub !== null) { try { connection.removeAccountChangeListener(sub); } catch {} } active = false; };
  }, [connection, publicKey]);

  // SOL polling (5s)
  useEffect(() => {
    let timer: any;
    let active = true;
    async function loadSOL() {
      try {
        if (!publicKey) return setSOL(null);
        const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "";
        const cluster = endpoint.includes("devnet") ? "devnet" : (endpoint.includes("testnet") ? "testnet" : "mainnet");
        const MINT = cluster === "mainnet" ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" : "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
        const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: tokenProgram });
        let total = 0;
        for (const it of resp.value) {
          const info = (it.account.data as any).parsed?.info;
          if (!info) continue;
          if (info.mint !== MINT) continue;
          const amt = info.tokenAmount?.uiAmount;
          total += Number(amt || 0);
        }
        if (active) { setSOL(total); setLastUpdated(Date.now()); }
      } catch {
        if (active) setSOL(null);
      }
    }
    loadSOL();
    timer = setInterval(loadSOL, 5000);
    return () => { if (timer) clearInterval(timer); active = false; };
  }, [connection, publicKey]);

  // SOL price polling with guard (reduce console noise when offline)
  useEffect(() => {
    if (!PRICE_FETCH_ENABLED) return;
    let timer: any;
    let active = true;
    let failures = 0;
    async function loadPrice() {
      try {
        if (typeof window !== 'undefined' && 'onLine' in navigator && !navigator.onLine) return;
        const r = await fetch("https://price.jup.ag/v4/price?ids=SOL", { cache: "no-store" });
        const j = await r.json();
        const p = Number(j?.data?.SOL?.price);
        if (!Number.isFinite(p)) return;
        failures = 0; // reset on success
        if (active) { setSolUsd(p); setLastUpdated(Date.now()); }
      } catch {
        failures += 1;
        // After repeated failures, back off by stopping the timer
        if (failures >= 3 && timer) {
          clearInterval(timer);
          timer = null;
        }
      }
    }
    loadPrice();
    timer = setInterval(loadPrice, 15000); // 15s to reduce noise
    return () => { if (timer) clearInterval(timer); active = false; };
  }, [PRICE_FETCH_ENABLED]);

  if (!isOwner) return null;

  const base58 = publicKey!.toBase58();
  const sol = typeof lamports === "number" ? lamports / LAMPORTS_PER_SOL : null;
  const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "";
  const cluster = endpoint.includes("devnet") ? "devnet" : (endpoint.includes("testnet") ? "testnet" : undefined);
  const explorer = `https://explorer.solana.com/address/${encodeURIComponent(base58)}${cluster ? `?cluster=${cluster}` : ""}`;

  const label = view === "SOL" ? "SOL balance" : (view === "SOL" ? "SOL balance" : (view === "CAL" ? "CAL balance" : "Token balance"));
  const value = view === "SOL" ? (sol !== null ? sol.toFixed(4) : "-") : (view === "SOL" ? (SOL !== null ? SOL.toFixed(2) : "-") : (view === "CAL" ? (calBal !== null ? calBal.toFixed(6) : "-") : (tokenBal !== null ? tokenBal.toFixed(6) : "-")));
  const rateLine = solUsd ? `1 SOL ~ ${solUsd.toFixed(2)} SOL | 1 SOL ~ ${(1 / solUsd).toFixed(6)} SOL` : "Fetching price...";

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Balance</h3>
      <div className="row" style={{ gap: 6, marginBottom: 8, alignItems: "center" }}>
        <button className="chip" onClick={() => setView("SOL")} style={{ color: "#fff", background: view === "SOL" ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)" }}>SOL</button>
        <button className="chip" onClick={() => setView("SOL")} style={{ color: "#fff", background: view === "SOL" ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)" }}>SOL</button>
        <button className="chip" onClick={() => setView("CAL")} style={{ color: "#fff", background: view === "CAL" ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)" }}>CAL</button>
        <button className="chip" onClick={() => setView("TOKEN")} style={{ color: "#fff", background: view === "TOKEN" ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)" }}>Token</button>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-"}</span>
        <button className="btn btn-outline" style={{ padding: "6px 10px" }} onClick={refreshAll}>Refresh</button>
      </div>
      {view === "CAL" && (
        <div className="row" style={{ gap: 8, margin: "4px 0 8px" }}>
          <span className="muted" style={{ fontSize: 12 }}>CAL mint: {process.env.NEXT_PUBLIC_CAL_MINT ? `${String(process.env.NEXT_PUBLIC_CAL_MINT).slice(0,6)}...${String(process.env.NEXT_PUBLIC_CAL_MINT).slice(-4)}` : '(set NEXT_PUBLIC_CAL_MINT)'}</span>
        </div>
      )}
      {view === "TOKEN" && (
        <div className="row" style={{ gap: 8, margin: "4px 0 8px" }}>
          <input placeholder="Paste token mint (SPL)" value={customMint} onChange={(e) => setCustomMint(e.target.value.trim())} style={{ flex: 1, background: "rgba(255,255,255,.06)", color: "#e5e7eb", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "6px 8px" }} />
          <button className="btn btn-outline" style={{ padding: "6px 10px" }} onClick={refreshAll}>Load</button>
        </div>
      )}
      {view !== "TOKEN" && (
        <div className="row" style={{ gap: 8, margin: "4px 0 8px" }}>
          <span className="muted" style={{ fontSize: 12 }}>{rateLine}</span>
        </div>
      )}
      <Link href={explorer} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }} title={base58}>
        <div className="stat" style={{ cursor: "pointer" }}>
          <span className="stat-label">{label}</span>
          <span className="stat-value">{(loadingSol && view === "SOL") ? "..." : value}</span>
          {solUsd && (
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {view === "SOL" && typeof sol === "number" ? `? ${(sol * solUsd).toFixed(2)} SOL` : null}
              {view === "SOL" && typeof SOL === "number" ? `? ${(SOL / solUsd).toFixed(6)} SOL` : null}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}



