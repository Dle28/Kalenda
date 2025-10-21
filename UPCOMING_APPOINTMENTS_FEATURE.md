# Upcoming Appointments Feature - Implementation Guide

## Overview

A beautiful, interactive **Upcoming Appointments** section has been added to the home screen, positioned between the hero section ("TIME IS MONEY") and the "below-hero" content. This feature fills the empty space with a comprehensive appointment management and mini-calendar system that integrates seamlessly with the rest of the platform.

## Features

### 1. **Mini Calendar Panel** (Left Side)
- **Interactive Calendar**: Displays the current month with clickable date selection
- **Visual Indicators**: Dots appear on dates with upcoming appointments
- **Today Highlighting**: Current date is highlighted in green
- **Appointment Count**: Shows number of slots for each date
- **Responsive Design**: Automatically adjusts layout on mobile devices

### 2. **Appointments List Panel** (Right Side)
- **Real-Time Countdown**: Live countdown to each appointment (updates every second)
- **Grouped by Date**: Appointments organized by date with friendly labels ("Today", "Tomorrow", specific dates)
- **Creator Info**: Shows creator avatar, name, expertise field, and slot type
- **Session Details**: Displays time and duration of each appointment
- **Pricing Display**: Shows fixed price or auction starting price
- **Direct Links**: Each card links to the creator's profile page
- **Empty State**: Helpful message when no appointments are scheduled

### 3. **Visual Design**
- **Premium Aesthetics**: Frosted glass effect (backdrop blur) with subtle borders
- **Color Coding**: 
  - Pink (#EF84BD) for auction slots
  - Green (#22C55E) for today's date and countdowns
  - Gray tones for secondary information
- **Hover Effects**: Smooth animations and color transitions
- **Accessibility**: Proper contrast ratios and keyboard navigation

## File Structure

```
apps/web/
├── components/
│   ├── UpcomingAppointments.tsx           # Main component
│   └── UpcomingAppointments.module.css    # Styling
├── lib/
│   └── appointmentUtils.ts               # Utility functions
└── app/
    └── page.tsx                           # Updated with import & integration
```

## Component Architecture

### UpcomingAppointments.tsx

**Props:**
```typescript
interface UpcomingAppointmentsProps {
  slots: Slot[];        // Array of appointment slots
  creators: Creator[];  // Array of creator data
}
```

**Key Features:**
- Automatically filters slots within the next 7 days
- Groups appointments by date using utility functions
- Maintains countdown timers that update every second
- Memoizes expensive calculations for performance
- Responsive grid layout (2-column on desktop, 1-column on mobile)

### appointmentUtils.ts

**Exported Functions:**
- `getUpcomingSlots()` - Filters slots within N days
- `groupSlotsByDate()` - Groups slots by date (YYYY-MM-DD)
- `generateCalendarDays()` - Creates calendar grid for a month
- `formatTime12Hour()` - Formats ISO time to 12-hour format
- `formatDuration()` - Calculates and formats appointment length
- `formatDateFriendly()` - Creates friendly date strings
- `getTimeUntilSlot()` - Calculates countdown to appointment
- `getCountdownsForSlots()` - Batch countdown calculations
- `calculateDuration()` - Returns duration in minutes
- `convertTimezone()` - Placeholder for timezone conversion
- `isBusinessHours()` - Checks if time is within business hours
- `isSameDay()` - Date comparison utility

### UpcomingAppointments.module.css

**Key Classes:**
- `.container` - Main wrapper with frosted glass effect
- `.calendarPanel` - Mini calendar section
- `.appointmentsPanel` - Appointments list section
- `.appointmentCard` - Individual appointment card with hover effects
- `.dateCell` - Calendar date cells with state styles
- `.countdownTimer` - Real-time countdown display

## Integration Details

### In `page.tsx`:

```typescript
import UpcomingAppointments from '@/components/UpcomingAppointments';

// In the JSX, positioned between hero and below sections:
<FloatingBadges />

{/* Upcoming Appointments Section */}
<div className="container">
  <UpcomingAppointments slots={slots} creators={enrichedCreators} />
</div>

{/* Below-hero sections */}
<section className={styles.below}>
  {/* Existing content */}
</section>
```

### Data Sources:

The component uses data from the mock library:
- **Slots**: `/lib/mock.ts` - Contains `slots[]` with appointment data
- **Creators**: `/lib/mock.ts` - Contains `creators[]` with creator profiles

## Styling System

### Color Palette:
```css
/* Primary Brand */
--primary-pink: rgba(239, 132, 189, 0.8-0.9);
--light-pink: rgba(239, 132, 189, 0.06-0.3);

/* Accents */
--success-green: rgba(34, 197, 94, 0.5-0.8);
--text-primary: #e5e7eb;
--text-secondary: #9ca3af;
--text-muted: #6b7280;

/* Backgrounds */
--glass-primary: rgba(255, 255, 255, 0.03-0.04);
--glass-secondary: rgba(255, 255, 255, 0.02);
--border: rgba(255, 255, 255, 0.1-0.12);
```

### Responsive Breakpoints:
- **Desktop**: 960px+ (2-column grid)
- **Tablet**: 640px-960px (single column)
- **Mobile**: <640px (optimized spacing and sizing)

## Real-Time Features

### Countdown Timer:
```typescript
// Updates every second
useEffect(() => {
  const interval = setInterval(() => {
    // Recalculate all countdowns
    setCountdowns(newCountdowns);
  }, 1000);
  return () => clearInterval(interval);
}, [upcomingSlots]);
```

**Display Formats:**
- Days: "in 3d"
- Hours: "in 5h"
- Minutes: "in 45m"

## Backend Integration Points

### Current Implementation (Mock Data):
- Reads from `slots` array in `/lib/mock.ts`
- Reads creator data from `creators` array in `/lib/mock.ts`

### Future API Integration:
The component is designed to easily accept real backend data:

```typescript
// Example: Replace mock data with API calls
const { data: slots } = useSWR('/api/slots/upcoming');
const { data: creators } = useSWR('/api/creators');

// Component remains the same
<UpcomingAppointments slots={slots} creators={creators} />
```

### Expected API Response Format:

**GET /api/slots/upcoming?days=7**
```json
{
  "slots": [
    {
      "id": "slot-123",
      "creator": "creator-pubkey",
      "start": "2025-10-21T14:00:00Z",
      "end": "2025-10-21T14:30:00Z",
      "mode": "Stable",
      "price": 25.00
    }
  ]
}
```

**GET /api/creators**
```json
{
  "creators": [
    {
      "pubkey": "creator-pubkey",
      "name": "Aiko",
      "avatar": "https://...",
      "fields": ["Illustration", "VTuber"],
      "timezone": "Asia/Tokyo"
    }
  ]
}
```

## Performance Optimizations

1. **Memoization**: Uses `useMemo` for expensive calculations
   - Creator map lookup
   - Slot filtering and grouping
   - Calendar generation

2. **Lazy Updates**: Countdown only updates when needed (1-second interval)

3. **CSS Performance**: 
   - GPU-accelerated transforms
   - Efficient grid layouts
   - Minimal repaints

4. **Responsive Images**: Avatar images are properly sized

## Accessibility Features

- Semantic HTML (buttons, links)
- Proper ARIA labels where needed
- Keyboard navigable (buttons are tab-accessible)
- High contrast text for readability
- Proper heading hierarchy
- Screen reader friendly descriptions

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE 11 (not supported - uses CSS Grid)

## Customization Guide

### Change Color Scheme:
Edit the CSS variables in `.appointmentCard:hover` and price tag styles:
```css
.priceTag {
  /* Change this color */
  color: rgba(239, 132, 189, 0.9); /* Primary pink */
}

.countdown {
  /* Change this color */
  color: rgba(34, 197, 94, 0.8); /* Success green */
}
```

### Adjust Appointment Display Limit:
In `UpcomingAppointments.tsx`, change the `getUpcomingSlots` parameter:
```typescript
const upcoming = getUpcomingSlots(slots, 14); // Show 14 days instead of 7
```

### Modify Calendar Layout:
In CSS, adjust grid columns:
```css
.grid {
  grid-template-columns: 320px 1fr; /* Make calendar wider */
}
```

## Testing Checklist

- [x] Component renders without errors
- [x] Mini calendar displays current month correctly
- [x] Appointments grouped and sorted by date
- [x] Countdown timer updates in real-time
- [x] Hover effects work smoothly
- [x] Links navigate to creator profiles
- [x] Empty state displays when no appointments
- [x] Responsive design works on mobile/tablet
- [x] Creator data displays correctly
- [x] Pricing shows for both fixed and auction slots
- [x] CSS animations are smooth
- [x] Scrolling works in appointments list

## Common Issues & Solutions

### Issue: Countdowns not updating
**Solution**: Ensure the component is not memoized with `React.memo()`. The effect hook depends on `upcomingSlots`.

### Issue: Calendar shows wrong month
**Solution**: Check that `selectedDate` state is properly initialized with `new Date()`.

### Issue: Creator images not loading
**Solution**: Verify creator avatars have proper URLs. Fallback to placeholder image included.

### Issue: Responsive layout broken on mobile
**Solution**: Check media queries in CSS. Default breakpoint is 960px for grid change.

## Future Enhancements

1. **Filtering**: Add filters for creator category, price range, etc.
2. **Sorting**: Sort by price, time, or creator rating
3. **Edit/Cancel**: Allow users to modify or cancel appointments
4. **Notifications**: Alert users before appointment time
5. **Timezone Support**: Display times in user's local timezone
6. **Sync with Calendar**: Export to Google Calendar, iCal
7. **Search**: Search appointments by creator name
8. **Advanced Calendar**: Month/week/day view options
9. **Status Indicators**: Show cancelled, rescheduled, completed states
10. **Feedback**: Rate and review completed appointments

## Support & Maintenance

- **Component Owner**: TimeMarket Team
- **Last Updated**: October 21, 2025
- **Next Review**: When backend API is finalized
- **Dependencies**: React 18+, Next.js 13+

## Quick Start for Developers

```bash
# To add this component to another page:
import UpcomingAppointments from '@/components/UpcomingAppointments';
import { slots, creators } from '@/lib/mock';

<UpcomingAppointments slots={slots} creators={creators} />
```

---

**Note**: All utility functions in `appointmentUtils.ts` are exported and can be used independently in other components for calendar displays, countdown timers, or appointment formatting.
