import Link from 'next/link';

export default function CreatorCard(props: {
  pubkey: string;
  name: string;
  avatar: string;
  fields: string[];
  rating: number;
  bio?: string;
}) {
  const { pubkey, name, avatar, fields, rating, bio } = props;
  return (
    <div className="card">
      <div className="row">
        <img src={avatar} alt={name} width={48} height={48} style={{borderRadius:12}} />
        <div className="stack" style={{flex:1}}>
          <b>{name}</b>
          <div className="row" style={{gap:8, flexWrap:'wrap'}}>
            {fields.map((f) => (
              <span key={f} className="badge">{f}</span>
            ))}
          </div>
        </div>
        <span className="badge">★ {rating.toFixed(1)}</span>
      </div>
      {bio && <p className="muted" style={{marginTop:8}}>{bio}</p>}
      <div className="row" style={{justifyContent:'space-between', marginTop:8}}>
        <span className="muted" style={{fontSize:12}}>{pubkey.slice(0,6)}...{pubkey.slice(-4)}</span>
        <Link href={`/creator/${pubkey}`} className="btn btn-secondary">Xem lịch</Link>
      </div>
    </div>
  );
}

