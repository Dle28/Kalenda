import type { Slot } from './mock';

export type SaleSummary = {
  headline: string;
  window?: string;
  mode: Slot['mode'];
  startISO: string;
  endISO: string;
  durationMinutes: number;
};

const MINUTE = 60 * 1000;

/**
 * Produce a human-readable summary for the next upcoming slot.
 * Falls back to the first slot if none are in the future.
 */
export function describeUpcomingSlot(slots: Slot[], now: Date = new Date()): SaleSummary | null {
  if (!Array.isArray(slots) || slots.length === 0) return null;
  const enriched = slots
    .map((slot) => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      return { slot, startDate, endDate };
    })
    .filter(({ endDate }) => !Number.isNaN(endDate.getTime()));

  if (enriched.length === 0) return null;

  const upcoming = enriched
    .filter(({ endDate }) => endDate.getTime() > now.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] ||
    enriched.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

  if (!upcoming) return null;

  const { slot, startDate, endDate } = upcoming;
  const durationMinutes = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / MINUTE));
  const amount = slot.mode === 'Stable' ? slot.price : slot.startPrice;

  // Fix hydration issue: use consistent timezone (UTC) for both server and client
  const formatTime = (date: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(date);

  const dayPart = formatTime(startDate, { month: 'short', day: 'numeric' });
  const startPart = formatTime(startDate, { hour: 'numeric', minute: '2-digit', hour12: true });
  const endPart = formatTime(endDate, { hour: 'numeric', minute: '2-digit', hour12: true });

  let headline: string;
  if (slot.mode === 'Stable') {
    headline = typeof amount === 'number'
      ? `Fixed price $${amount.toFixed(2)} for ${durationMinutes} min`
      : `Fixed session ${durationMinutes} min`;
  } else {
    headline = typeof amount === 'number'
      ? `Auction starting at $${amount.toFixed(2)} for ${durationMinutes} min`
      : `Auction session ${durationMinutes} min`;
  }

  const window = `${dayPart} • ${startPart}–${endPart}`;

  return {
    headline,
    window,
    mode: slot.mode,
    startISO: slot.start,
    endISO: slot.end,
    durationMinutes,
  };
}

export function groupSlotsByCreator(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const slot of slots || []) {
    const list = map.get(slot.creator) || [];
    list.push(slot);
    map.set(slot.creator, list);
  }
  return map;
}

export function summarizeSlotsByCreator(slots: Slot[]): Record<string, SaleSummary | null> {
  const map = groupSlotsByCreator(slots);
  const result: Record<string, SaleSummary | null> = {};
  for (const [creator, list] of map.entries()) {
    result[creator] = describeUpcomingSlot(list);
  }
  return result;
}

