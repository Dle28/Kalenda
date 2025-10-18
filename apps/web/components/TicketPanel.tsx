"use client";
import { useMemo, useState } from 'react';
import QRCode from 'qrcode.react';
import NftViewer from './NftViewer';

export default function TicketPanel(props: { slotId: string; creator: string; status?: string; nftMint?: string; nftUri?: string; cluster?: 'devnet' | 'testnet' | 'mainnet' | 'mainnet-beta' }) {
  const { slotId, creator, status = 'Not checked-in', nftMint, nftUri, cluster } = props;
  const [open, setOpen] = useState(false);
  const [openNft, setOpenNft] = useState(false);

  const qrValue = useMemo(() => {
    const nonce = Math.random().toString(36).slice(2, 10);
    const payload = {
      type: 'ticket_checkin',
      slot: slotId,
      creator,
      ts: Date.now(),
      nonce,
    };
    return JSON.stringify(payload);
  }, [slotId, creator]);

  return (
    <div className="ticket">
      <b>Ticket & Check-in</b>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <div className="qr" aria-label="QR preview" style={{ display: 'grid', placeItems: 'center' }}>
          <span className="muted">QR</span>
        </div>
        <div className="stack">
          <span className="muted">NFT Ticket preview</span>
          <span className="badge">Status: {status}</span>
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpenNft(true)}>View NFT</button>
        <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpen(true)}>Show QR</button>
      </div>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ display: 'grid', gap: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Event QR</b>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpen(false)}>Close</button>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <QRCode value={qrValue} size={220} includeMargin />
            </div>
            <span className="muted" style={{ wordBreak: 'break-all', fontSize: 12 }}>Payload: {qrValue}</span>
          </div>
        </div>
      )}

      {openNft && (
        <div className="modal" onClick={() => setOpenNft(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ display: 'grid', gap: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>View NFT</b>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpenNft(false)}>Close</button>
            </div>
            <NftViewer nftMint={nftMint} nftUri={nftUri} cluster={cluster} />
          </div>
        </div>
      )}
    </div>
  );
}
