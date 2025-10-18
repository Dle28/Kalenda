"use client";
import { useState } from 'react';

type Complaint = {
  id: string;
  subject: string;
  status: 'Open' | 'Under review' | 'Resolved';
  createdAt: string;
};

export default function ComplaintsCenter() {
  const [list, setList] = useState<Complaint[]>([]);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  function submit() {
    if (!subject.trim()) return;
    const now = new Date().toISOString();
    setList((prev) => [{ id: now, subject, status: 'Open', createdAt: now }, ...prev]);
    setSubject('');
    setDetails('');
    setFiles([]);
  }

  return (
    <section className="container" style={{ padding: '20px 0 40px' }}>
      <h1 className="title" style={{ fontSize: 28 }}>Complaint Center</h1>
      <p className="muted">Submit evidence and track processing.</p>

      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <label className="stack">
          <span className="muted">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject..." />
        </label>
        <label className="stack">
          <span className="muted">Details</span>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe your issue..." rows={4} />
        </label>
        <label className="stack">
          <span className="muted">Evidence files (optional)</span>
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          {files.length > 0 && <span className="muted">{files.length} file(s) selected</span>}
        </label>
        <button className="btn btn-secondary" onClick={submit} style={{ width: 'fit-content' }}>Submit complaint</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 className="section-title">My complaints</h3>
        <div className="grid" style={{ marginTop: 12 }}>
          {list.length === 0 ? (
            <div className="card muted">No complaints yet.</div>
          ) : (
            list.map((c) => (
              <div key={c.id} className="card" style={{ display: 'grid', gap: 6 }}>
                <b>{c.subject}</b>
                <span className="muted">Created: {new Date(c.createdAt).toLocaleString()}</span>
                <span className="badge">{c.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

