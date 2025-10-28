"use client";
import { useCallback, useMemo, useRef, useState } from 'react';

export type WeeklyAvailability = Record<number, number[]>; // day 0-6 -> hours (0-23)

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScheduler({
  value,
  onChange,
  startHour = 8,
  endHour = 20,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: {
  value: WeeklyAvailability;
  onChange: (next: WeeklyAvailability) => void;
  startHour?: number;
  endHour?: number;
  timezone?: string;
}) {
  const [dragging, setDragging] = useState<null | { add: boolean; day: number }>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const hours = useMemo(() => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i), [startHour, endHour]);

  const isSelected = useCallback(
    (d: number, h: number) => Array.isArray(value[d]) && value[d].includes(h),
    [value],
  );

  const toggle = useCallback(
    (d: number, h: number, force?: boolean) => {
      const current = new Set(value[d] || []);
      const willAdd = force ?? !current.has(h);
      if (willAdd) current.add(h);
      else current.delete(h);
      onChange({ ...value, [d]: Array.from(current).sort((a, b) => a - b) });
      return willAdd;
    },
    [value, onChange],
  );

  const onCellDown = (d: number, h: number) => {
    const added = toggle(d, h);
    setDragging({ add: added, day: d });
  };
  const onCellEnter = (d: number, h: number) => {
    if (!dragging) return;
    toggle(d, h, dragging.add);
  };
  const endDrag = () => setDragging(null);

  return (
    <div className="scheduler" ref={ref} onMouseUp={endDrag} onMouseLeave={endDrag}>
      <div className="scheduler-head">
        <div className="scheduler-cell muted" />
        {DAY_LABELS.map((d) => (
          <div key={d} className="scheduler-cell muted" style={{ textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div className="scheduler-body">
        {hours.map((h) => (
          <div className="scheduler-row" key={h}>
            <div className="scheduler-time muted">{String(h).padStart(2, '0')}:00</div>
            {DAY_LABELS.map((_, dayIdx) => {
              const active = isSelected(dayIdx, h);
              return (
                <button
                  key={`${dayIdx}-${h}`}
                  className={`scheduler-slot ${active ? 'active' : ''}`}
                  onMouseDown={() => onCellDown(dayIdx, h)}
                  onMouseEnter={() => onCellEnter(dayIdx, h)}
                  onClick={(e) => e.preventDefault()}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <span className="muted">Timezone: {timezone}</span>
        <span className="muted">Drag to select hours</span>
      </div>
      <style>{`
        .scheduler { background: rgba(12,13,18,.6); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 8px; }
        .scheduler-head { display: grid; grid-template-columns: 80px repeat(7, 1fr); gap: 6px; margin-bottom: 6px }
        .scheduler-body { display: grid; gap: 6px }
        .scheduler-row { display: grid; grid-template-columns: 80px repeat(7, 1fr); gap: 6px; align-items: center }
        .scheduler-time { font-size: 12px; text-align: right; padding-right: 6px }
        .scheduler-slot { height: 28px; border-radius: 8px; border: 1px dashed rgba(255,255,255,.12); background: rgba(255,255,255,.03) }
        .scheduler-slot.active { background: rgba(239,132,189,.18); border-color: rgba(239,132,189,.45) }
        .scheduler-cell { height: 24px; display:flex; align-items:center; justify-content:center }
      `}</style>
    </div>
  );
}

