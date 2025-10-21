"use client";
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import styles from './UpcomingAppointments.module.css';
import {
  getUpcomingSlots,
  groupSlotsByDate,
  formatTime12Hour,
  formatDuration,
  generateCalendarDays,
  formatDateFriendly,
  getTimeUntilSlot,
} from '@/lib/appointmentUtils';

export interface Slot {
  id: string;
  creator: string;
  start: string;
  end: string;
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
}

export interface Creator {
  pubkey: string;
  name: string;
  avatar?: string;
  timezone?: string;
  fields?: string[];
  rating?: number;
}

interface UpcomingAppointmentsProps {
  slots: Slot[];
  creators: Creator[];
}

export default function UpcomingAppointments({ slots, creators }: UpcomingAppointmentsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [countdowns, setCountdowns] = useState<Record<string, any>>({});

  // Build creator map for quick lookup
  const creatorMap = useMemo(() => {
    const map = new Map<string, Creator>();
    creators.forEach((c) => map.set(c.pubkey, c));
    return map;
  }, [creators]);

  // Get upcoming slots and group by date
  const { upcomingSlots, slotsByDate, calendarDays } = useMemo(() => {
    const upcoming = getUpcomingSlots(slots, 7);
    const byDate = groupSlotsByDate(upcoming);
    const calDays = generateCalendarDays(new Date());

    return { upcomingSlots: upcoming, slotsByDate: byDate, calendarDays: calDays };
  }, [slots]);

  // Update countdowns every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, any> = {};
      upcomingSlots.forEach((slot) => {
        newCountdowns[slot.id] = getTimeUntilSlot(slot.start);
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [upcomingSlots]);

  // Get slot count for a specific date
  const getSlotCountForDate = (date: Date): number => {
    const key = date.toISOString().split('T')[0];
    return slotsByDate.get(key)?.length ?? 0;
  };

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Slot[]> = {};
    upcomingSlots.forEach((slot) => {
      const dateStr = slot.start.split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(slot);
    });
    return grouped;
  }, [upcomingSlots]);

  const allDates = Object.keys(appointmentsByDate).sort();

  // Format countdown for display
  const formatCountdown = (slotId: string): string => {
    const cd = countdowns[slotId];
    if (!cd || !cd.isUpcoming) return '';
    if (cd.days > 0) return `in ${cd.days}d`;
    if (cd.hours > 0) return `in ${cd.hours}h`;
    return `in ${cd.minutes}m`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Upcoming Appointments</h2>
        <p className={styles.subtitle}>Browse and manage your scheduled sessions</p>
      </div>

      <div className={styles.grid}>
        {/* Mini Calendar */}
        <div className={styles.calendarPanel}>
          <div className={styles.calendarHeader}>
            <h3 className={styles.calendarTitle}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>

          {/* Weekday headers */}
          <div className={styles.weekdayRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className={styles.weekdayCell}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={styles.calendarGrid}>
            {calendarDays.map((date, idx) => {
              const isCurrentMonth = date && date.getMonth() === selectedDate.getMonth();
              const isToday = date && date.toDateString() === new Date().toDateString();
              const slotCount = date ? getSlotCountForDate(date) : 0;

              return (
                <button
                  key={idx}
                  className={`${styles.dateCell} ${!isCurrentMonth ? styles.otherMonth : ''} ${
                    isToday ? styles.today : ''
                  } ${slotCount > 0 ? styles.hasAppointments : ''}`}
                  onClick={() => date && setSelectedDate(date)}
                  disabled={!isCurrentMonth}
                  type="button"
                  title={date ? date.toLocaleDateString() : undefined}
                >
                  {date && <span className={styles.dateNumber}>{date.getDate()}</span>}
                  {slotCount > 0 && <span className={styles.dotIndicator} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointments List */}
        <div className={styles.appointmentsPanel}>
          {allDates.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📅</div>
              <p className={styles.emptyText}>No upcoming appointments yet</p>
              <p className={styles.emptySubtext}>Browse creators and book your first session</p>
              <Link href="/creators" className={styles.exploreLink}>
                Explore Creators
              </Link>
            </div>
          ) : (
            <div className={styles.appointmentsList}>
              {allDates.map((dateStr) => {
                const dateAppointments = appointmentsByDate[dateStr];
                return (
                  <div key={dateStr} className={styles.dateGroup}>
                    <div className={styles.dateGroupHeader}>
                      {formatDateFriendly(dateStr)}
                      <span className={styles.slotCount}>{dateAppointments.length}</span>
                    </div>

                    <div className={styles.appointmentCards}>
                      {dateAppointments.map((slot) => {
                        const creator = creatorMap.get(slot.creator);
                        if (!creator) return null;

                        const countdown = formatCountdown(slot.id);

                        return (
                          <Link
                            key={slot.id}
                            href={`/creator/${encodeURIComponent(slot.creator)}`}
                            className={styles.appointmentCard}
                          >
                            {/* Creator Avatar */}
                            <div className={styles.avatar}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={creator.avatar || 'https://placehold.co/48x48'}
                                alt={creator.name}
                                width={48}
                                height={48}
                              />
                            </div>

                            {/* Appointment Details */}
                            <div className={styles.appointmentDetails}>
                              <div className={styles.creatorName}>{creator.name}</div>
                              <div className={styles.field}>
                                {creator.fields?.[0] || 'Expert consultation'}
                              </div>
                              <div className={styles.timeBlock}>
                                <span className={styles.time}>
                                  {formatTime12Hour(slot.start)} · {formatDuration(slot.start, slot.end)}
                                </span>
                                {countdown && <span className={styles.countdown}>{countdown}</span>}
                              </div>
                            </div>

                            {/* Price & Mode */}
                            <div className={styles.appointmentMeta}>
                              <div className={styles.priceTag}>
                                {slot.mode === 'EnglishAuction' ? (
                                  <>
                                    <span className={styles.label}>Auction</span>
                                    <span className={styles.price}>${slot.startPrice?.toFixed(2)}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={styles.label}>Fixed</span>
                                    <span className={styles.price}>${slot.price?.toFixed(2)}</span>
                                  </>
                                )}
                              </div>
                              <span className={styles.arrow}>→</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
