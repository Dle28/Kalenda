/**
 * Appointment and calendar utility functions
 * Handles date calculations, timezone conversions, and slot grouping
 */

export interface TimeSlot {
  id: string;
  creator: string;
  start: string; // ISO string
  end: string; // ISO string
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
}

export interface CreatorInfo {
  pubkey: string;
  name: string;
  timezone?: string;
  avatar?: string;
  fields?: string[];
}

/**
 * Get slots within the next N days
 */
export function getUpcomingSlots(slots: TimeSlot[], daysAhead: number = 7): TimeSlot[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return slots
    .filter((s) => {
      const slotStart = new Date(s.start);
      return slotStart >= now && slotStart <= futureDate;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Group slots by date (YYYY-MM-DD)
 */
export function groupSlotsByDate(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const grouped = new Map<string, TimeSlot[]>();

  slots.forEach((slot) => {
    const date = new Date(slot.start);
    const key = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(slot);
  });

  return grouped;
}

/**
 * Check if a time is within business hours (8 AM - 8 PM)
 */
export function isBusinessHours(isoString: string): boolean {
  const date = new Date(isoString);
  const hour = date.getHours();
  return hour >= 8 && hour < 20;
}

/**
 * Format a date as a friendly string
 */
export function formatDateFriendly(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  // Check if within 7 days
  const daysAhead = Math.floor((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (daysAhead > 0 && daysAhead <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

/**
 * Format time in 12-hour format
 */
export function formatTime12Hour(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Calculate duration in minutes
 */
export function calculateDuration(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Get a human-readable duration string
 */
export function formatDuration(startISO: string, endISO: string): string {
  const minutes = calculateDuration(startISO, endISO);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Generate calendar days for a given month
 */
export function generateCalendarDays(date: Date = new Date()): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from the first Sunday before the month starts
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarDays: (Date | null)[] = [];
  let current = new Date(startDate);

  // Fill the calendar grid (up to 6 rows)
  while (current <= lastDay || calendarDays.length % 7 !== 0) {
    if (current.getMonth() === month) {
      calendarDays.push(new Date(current));
    } else if (calendarDays.length < 42) {
      calendarDays.push(null);
    }
    current.setDate(current.getDate() + 1);
  }

  return calendarDays;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Convert time from one timezone to another (simplified version)
 * Note: Real implementation would use proper timezone library like date-fns-tz
 */
export function convertTimezone(isoString: string, fromTz?: string, toTz?: string): string {
  // For now, return the time as-is
  // In production, use date-fns-tz or similar library
  return isoString;
}

/**
 * Get time until a slot starts
 */
export function getTimeUntilSlot(startISO: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUpcoming: boolean;
} {
  const now = new Date();
  const slotStart = new Date(startISO);
  const diff = slotStart.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUpcoming: false };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isUpcoming: true };
}

/**
 * Get countdowns for multiple slots
 */
export function getCountdownsForSlots(slots: TimeSlot[]): Record<string, ReturnType<typeof getTimeUntilSlot>> {
  const countdowns: Record<string, ReturnType<typeof getTimeUntilSlot>> = {};

  slots.forEach((slot) => {
    countdowns[slot.id] = getTimeUntilSlot(slot.start);
  });

  return countdowns;
}
