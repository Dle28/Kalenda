import TimezoneControl from '@/components/TimezoneControl';
import SlotCard from '@/components/SlotCard';
import { creators, slots } from '@/lib/mock';

function getCreator(pubkey: string) {
  return creators.find((c) => c.pubkey === pubkey);
}

function getCreatorSlots(pubkey: string) {
  return slots.filter((s) => s.creator === pubkey);
}

export default function CreatorPage({ params }: { params: { pubkey: string } }) {
  const c = getCreator(params.pubkey);
  if (!c) return <div>Không tìm thấy creator.</div>;

  // Note: TZ conversion is not persisted here; this is a static page (server component)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <section>
      <div className="row" style={{gap:16, alignItems:'flex-start'}}>
        <img src={c.avatar} alt={c.name} width={80} height={80} style={{borderRadius:16}} />
        <div className="stack" style={{flex:1}}>
          <h1 className="title" style={{fontSize:32, margin:0}}>{c.name}</h1>
          <div className="row" style={{gap:8, flexWrap:'wrap'}}>
            {c.fields.map((f) => (<span key={f} className="badge">{f}</span>))}
          </div>
          <p className="muted" style={{marginTop:8}}>{c.bio}</p>
          <div className="row" style={{gap:12}}>
            {c.socials.web && <a className="link" href={c.socials.web} target="_blank" rel="noreferrer">Website</a>}
            {c.socials.x && <a className="link" href={c.socials.x} target="_blank" rel="noreferrer">X</a>}
            {c.socials.ig && <a className="link" href={c.socials.ig} target="_blank" rel="noreferrer">Instagram</a>}
          </div>
        </div>
      </div>

      <div style={{marginTop:24}}>
        <TimezoneControl initial={tz} />
        <div className="calendar">
          {[0,1,2,3,4,5,6].map((d) => (
            <div key={d} className="day">
              <b>Ngày {d+1}</b>
              {getCreatorSlots(c.pubkey)
                .filter((s) => new Date(s.start).getDay() === d)
                .map((s) => (
                  <SlotCard
                    key={s.id}
                    id={s.id}
                    mode={s.mode}
                    start={new Date(s.start)}
                    end={new Date(s.end)}
                    price={s.price}
                    startPrice={s.startPrice}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
