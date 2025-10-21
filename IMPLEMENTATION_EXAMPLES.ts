/**
 * UPCOMING APPOINTMENTS - IMPLEMENTATION EXAMPLES
 * 
 * This file contains real-world examples of how to use and customize
 * the UpcomingAppointments component and appointment utilities.
 */

// ============================================================================
// EXAMPLE 1: Basic Usage (as implemented in page.tsx)
// ============================================================================

import UpcomingAppointments from '@/components/UpcomingAppointments';
import { creators, slots } from '@/lib/mock';

export default function HomePage() {
  return (
    <section>
      <h1>Home</h1>
      
      {/* Basic usage with mock data */}
      <UpcomingAppointments slots={slots} creators={creators} />
    </section>
  );
}


// ============================================================================
// EXAMPLE 2: Using Utility Functions for Custom Calendar Display
// ============================================================================

import { generateCalendarDays, formatDateFriendly, getUpcomingSlots, groupSlotsByDate } from '@/lib/appointmentUtils';
import { useState } from 'react';

export function CustomCalendarView({ slots }) {
  const [month, setMonth] = useState(new Date());
  const calendarDays = generateCalendarDays(month);
  const upcomingSlots = getUpcomingSlots(slots);
  const slotsByDate = groupSlotsByDate(upcomingSlots);

  return (
    <div className="custom-calendar">
      <div className="month-header">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>←</button>
        <h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>→</button>
      </div>

      <div className="calendar">
        {calendarDays.map((date, idx) => {
          const dateKey = date?.toISOString().split('T')[0];
          const slotsForDate = dateKey ? slotsByDate.get(dateKey)?.length ?? 0 : 0;
          
          return (
            <div key={idx} className={`day ${slotsForDate > 0 ? 'has-slots' : ''}`}>
              {date && (
                <>
                  <span className="date">{date.getDate()}</span>
                  {slotsForDate > 0 && <span className="count">{slotsForDate}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================================
// EXAMPLE 3: Real-Time Countdown Display Component
// ============================================================================

import { getTimeUntilSlot } from '@/lib/appointmentUtils';
import { useEffect, useState } from 'react';

export function CountdownBadge({ slotId, startTime }) {
  const [countdown, setCountdown] = useState(getTimeUntilSlot(startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilSlot(startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!countdown.isUpcoming) {
    return <span className="badge expired">Past</span>;
  }

  let text = '';
  if (countdown.days > 0) {
    text = `${countdown.days}d ${countdown.hours}h`;
  } else if (countdown.hours > 0) {
    text = `${countdown.hours}h ${countdown.minutes}m`;
  } else {
    text = `${countdown.minutes}m ${countdown.seconds}s`;
  }

  return (
    <span className={`badge countdown ${countdown.minutes < 5 ? 'urgent' : ''}`}>
      {text}
    </span>
  );
}


// ============================================================================
// EXAMPLE 4: API Integration with SWR (replace mock data)
// ============================================================================

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

export function HomePage() {
  // Fetch slots from backend
  const { data: slotsData, error: slotsError } = useSWR('/api/slots/upcoming?days=7', fetcher);
  
  // Fetch creators from backend
  const { data: creatorsData, error: creatorsError } = useSWR('/api/creators', fetcher);

  if (slotsError || creatorsError) return <div>Error loading appointments</div>;
  if (!slotsData || !creatorsData) return <div>Loading...</div>;

  return (
    <UpcomingAppointments 
      slots={slotsData.slots || []} 
      creators={creatorsData.creators || []} 
    />
  );
}


// ============================================================================
// EXAMPLE 5: API Integration with React Query (alternative)
// ============================================================================

import { useQuery } from '@tanstack/react-query';

export function HomePageWithReactQuery() {
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['upcoming-slots'],
    queryFn: () => fetch('/api/slots/upcoming?days=7').then(r => r.json()),
  });

  const { data: creators = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: () => fetch('/api/creators').then(r => r.json()),
  });

  if (slotsLoading || creatorsLoading) return <LoadingSpinner />;

  return <UpcomingAppointments slots={slots} creators={creators} />;
}


// ============================================================================
// EXAMPLE 6: Extended Component with Filtering
// ============================================================================

import { getUpcomingSlots, groupSlotsByDate } from '@/lib/appointmentUtils';
import { useMemo, useState } from 'react';

export function FilteredAppointments({ slots, creators }) {
  const [filter, setFilter] = useState('all'); // 'all', 'stable', 'auction'
  const [priceMax, setPriceMax] = useState(100);

  const filteredSlots = useMemo(() => {
    let result = getUpcomingSlots(slots);

    // Filter by mode
    if (filter !== 'all') {
      const mode = filter === 'stable' ? 'Stable' : 'EnglishAuction';
      result = result.filter(s => s.mode === mode);
    }

    // Filter by price
    result = result.filter(s => {
      const price = s.mode === 'Stable' ? s.price : s.startPrice;
      return price && price <= priceMax;
    });

    return result;
  }, [slots, filter, priceMax]);

  return (
    <div>
      <div className="filters">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Appointments</option>
          <option value="stable">Fixed Price Only</option>
          <option value="auction">Auctions Only</option>
        </select>
        
        <input 
          type="range" 
          min="0" 
          max="1000" 
          value={priceMax}
          onChange={e => setPriceMax(Number(e.target.value))}
        />
        <span>Max ${priceMax}</span>
      </div>

      <UpcomingAppointments slots={filteredSlots} creators={creators} />
    </div>
  );
}


// ============================================================================
// EXAMPLE 7: Slot Duration Formatting
// ============================================================================

import { formatDuration, calculateDuration } from '@/lib/appointmentUtils';

export function SlotDurationBadge({ start, end }) {
  return (
    <div className="duration-info">
      <span className="label">Duration:</span>
      <span className="value">{formatDuration(start, end)}</span>
      <span className="minutes">({calculateDuration(start, end)} minutes)</span>
    </div>
  );
}


// ============================================================================
// EXAMPLE 8: Business Hours Check
// ============================================================================

import { isBusinessHours, formatTime12Hour } from '@/lib/appointmentUtils';

export function SlotWarning({ slot }) {
  const inBusinessHours = isBusinessHours(slot.start);

  return (
    <div className={`slot-time ${inBusinessHours ? 'normal' : 'outside-hours'}`}>
      <span>{formatTime12Hour(slot.start)}</span>
      {!inBusinessHours && (
        <span className="warning">Outside business hours</span>
      )}
    </div>
  );
}


// ============================================================================
// EXAMPLE 9: Timezone Conversion (for future use)
// ============================================================================

import { convertTimezone } from '@/lib/appointmentUtils';

export function TimezoneSelector({ slot, creator }) {
  const [userTz, setUserTz] = useState('America/New_York');
  
  // In real implementation, use date-fns-tz:
  // const convertedTime = formatInTimeZone(slot.start, userTz, 'HH:mm');
  
  const convertedTime = convertTimezone(slot.start, creator.timezone, userTz);

  return (
    <div className="timezone-display">
      <p>Creator timezone: {creator.timezone}</p>
      <p>Your timezone: {userTz}</p>
      <p>Time: {convertedTime}</p>
    </div>
  );
}


// ============================================================================
// EXAMPLE 10: Custom Hook for Appointments
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { getUpcomingSlots, getCountdownsForSlots } from '@/lib/appointmentUtils';

export function useAppointments(slots) {
  const [appointments, setAppointments] = useState([]);
  const [countdowns, setCountdowns] = useState({});

  // Get upcoming appointments
  useEffect(() => {
    const upcoming = getUpcomingSlots(slots);
    setAppointments(upcoming);
  }, [slots]);

  // Update countdowns
  useEffect(() => {
    const updateCountdowns = () => {
      setCountdowns(getCountdownsForSlots(appointments));
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [appointments]);

  return { appointments, countdowns };
}

// Usage:
export function MyComponent({ slots, creators }) {
  const { appointments, countdowns } = useAppointments(slots);

  return (
    <div>
      {appointments.map(slot => (
        <div key={slot.id}>
          <CreatorCard creator={creators.find(c => c.pubkey === slot.creator)} />
          <p>In {countdowns[slot.id]?.minutes}m</p>
        </div>
      ))}
    </div>
  );
}


// ============================================================================
// EXAMPLE 11: Export Appointments to ICS Format
// ============================================================================

export function downloadAppointmentAsICS(slot, creator) {
  const startDate = new Date(slot.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(slot.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TimeMarket//NONSGML Event//EN
BEGIN:VEVENT
UID:${slot.id}@timemarket.com
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${slot.mode === 'Stable' ? 'Booked' : 'Auction'} with ${creator.name}
DESCRIPTION:TimeMarket appointment
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `appointment-${slot.id}.ics`;
  a.click();
}


// ============================================================================
// EXAMPLE 12: Testing with Mock Data
// ============================================================================

import { getUpcomingSlots, groupSlotsByDate, calculateDuration } from '@/lib/appointmentUtils';

export function testAppointmentUtils() {
  const mockSlots = [
    {
      id: '1',
      creator: 'creator1',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 60000).toISOString(),
      mode: 'Stable',
      price: 25,
    },
  ];

  // Test getUpcomingSlots
  const upcoming = getUpcomingSlots(mockSlots, 7);
  console.log('Upcoming slots:', upcoming);

  // Test groupSlotsByDate
  const grouped = groupSlotsByDate(upcoming);
  console.log('Grouped by date:', grouped);

  // Test calculateDuration
  const duration = calculateDuration(mockSlots[0].start, mockSlots[0].end);
  console.log('Duration:', duration, 'minutes');
}


// ============================================================================
// EXAMPLE 13: Responsive Component Wrapper
// ============================================================================

import { useMediaQuery } from 'react-responsive';

export function ResponsiveAppointments({ slots, creators }) {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 960 });

  if (isMobile) {
    return <MobileAppointmentsList slots={slots} creators={creators} />;
  }

  if (isTablet) {
    return <TabletAppointmentsView slots={slots} creators={creators} />;
  }

  return <UpcomingAppointments slots={slots} creators={creators} />;
}


// ============================================================================
// EXAMPLE 14: Analytics Integration
// ============================================================================

export function trackAppointmentClick(slot, creator) {
  // Example: Google Analytics
  gtag('event', 'view_appointment', {
    appointment_id: slot.id,
    creator_id: creator.pubkey,
    creator_name: creator.name,
    slot_mode: slot.mode,
    price: slot.mode === 'Stable' ? slot.price : slot.startPrice,
  });
}


// ============================================================================
// EXAMPLE 15: Storybook Component Story
// ============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import UpcomingAppointments from './UpcomingAppointments';

const meta: Meta<typeof UpcomingAppointments> = {
  component: UpcomingAppointments,
  title: 'Components/UpcomingAppointments',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAppointments: Story = {
  args: {
    slots: [
      {
        id: '1',
        creator: 'creator1',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30 * 60000).toISOString(),
        mode: 'Stable',
        price: 25,
      },
    ],
    creators: [
      {
        pubkey: 'creator1',
        name: 'Aiko',
        avatar: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Aiko',
        fields: ['Illustration'],
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    slots: [],
    creators: [],
  },
};
