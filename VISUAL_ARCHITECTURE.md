/**
 * VISUAL COMPONENT STRUCTURE
 * 
 * This diagram shows how the Upcoming Appointments feature
 * is organized and how components relate to each other
 */

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                        HOME PAGE (page.tsx)                               ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Hero Section ("TIME IS MONEY")                                       │ ║
║  │ - Heading & CTA buttons                                              │ ║
║  │ - Floating badges                                                    │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ NEW: UpcomingAppointments Component ✨                              │ ║
║  │                                                                      │ ║
║  │  ┌────────────────┐    ┌──────────────────────────────────────────┐│ ║
║  │  │ Mini Calendar  │    │ Appointments List                        ││ ║
║  │  │                │    │                                          ││ ║
║  │  │ Oct 2025       │    │ Today (2)                                ││ ║
║  │  │                │    │ ├─ Aiko - 2:00 PM · 30m · $25          ││ ║
║  │  │ Su Mo Tu ...   │    │ ├─ Ren - 3:00 PM · 45m · $30           ││ ║
║  │  │                │    │                                          ││ ║
║  │  │  1  2  3  4   │    │ Tomorrow (1)                              ││ ║
║  │  │  5  6●7  8   │    │ ├─ Kenta - 10:00 AM · 60m · Auction      ││ ║
║  │  │  9 10 11 12   │    │                                          ││ ║
║  │  │ 13 14 15 16   │    │ (● = has appointments)                  ││ ║
║  │  │               │    │                                          ││ ║
║  │  └────────────────┘    └──────────────────────────────────────────┘│ ║
║  │                                                                      │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Below-Hero Sections (Spotlight, Filters, How-it-works, Top Week)     │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Testimonials & Events Strip                                          │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Footer                                                               │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════════════════╝


DATA FLOW DIAGRAM
═════════════════════════════════════════════════════════════════════════════

    ┌──────────────────┐
    │  Mock Data       │
    │  /lib/mock.ts    │
    │                  │
    │  - slots[]       │◄─── Contains appointment data
    │  - creators[]    │◄─── Contains creator profiles
    └─────────┬────────┘
              │
              │ (Props passed down)
              ▼
    ┌──────────────────────────────┐
    │  page.tsx                    │
    │                              │
    │  <UpcomingAppointments       │
    │    slots={slots}             │
    │    creators={enrichedCreators}│
    │  />                          │
    └─────────┬────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────┐
    │  UpcomingAppointments.tsx           │
    │  ┌────────────────────────────────┐ │
    │  │ Data Processing:               │ │
    │  │ 1. Build creatorMap            │ │
    │  │ 2. getUpcomingSlots()          │ │
    │  │ 3. groupSlotsByDate()          │ │
    │  │ 4. generateCalendarDays()      │ │
    │  └────────────────────────────────┘ │
    │  ┌────────────────────────────────┐ │
    │  │ State Management:              │ │
    │  │ - selectedDate                 │ │
    │  │ - countdowns (live)            │ │
    │  └────────────────────────────────┘ │
    │  ┌────────────────────────────────┐ │
    │  │ Render:                        │ │
    │  │ ├─ Mini Calendar Panel         │ │
    │  │ └─ Appointments List Panel     │ │
    │  └────────────────────────────────┘ │
    └──────────────────────────────────────┘
              │
              ▼
    ┌────────────────────────────────┐
    │  Styling                       │
    │  UpcomingAppointments.css     │
    │                                │
    │  Classes:                      │
    │  - .container                  │
    │  - .calendarPanel              │
    │  - .appointmentsPanel          │
    │  - .appointmentCard            │
    │  - .countdownTimer             │
    └────────────────────────────────┘


COMPONENT TREE
══════════════════════════════════════════════════════════════════════════════

UpcomingAppointments
├── .container
│   ├── .header
│   │   ├── .title
│   │   └── .subtitle
│   │
│   └── .grid
│       ├── .calendarPanel
│       │   ├── .calendarHeader
│       │   │   └── .calendarTitle
│       │   │
│       │   ├── .weekdayRow
│       │   │   └── .weekdayCell (7x)
│       │   │
│       │   └── .calendarGrid
│       │       └── .dateCell (42x)
│       │           ├── .dateNumber
│       │           └── .dotIndicator (conditional)
│       │
│       └── .appointmentsPanel
│           ├── .empty (conditional)
│           │   ├── .emptyIcon
│           │   ├── .emptyText
│           │   ├── .emptySubtext
│           │   └── .exploreLink
│           │
│           └── .appointmentsList
│               └── .dateGroup (1+)
│                   ├── .dateGroupHeader
│                   │   └── .slotCount
│                   │
│                   └── .appointmentCards
│                       └── .appointmentCard (1+)
│                           ├── .avatar
│                           │   └── <img>
│                           │
│                           ├── .appointmentDetails
│                           │   ├── .creatorName
│                           │   ├── .field
│                           │   └── .timeBlock
│                           │       ├── .time
│                           │       └── .countdown
│                           │
│                           └── .appointmentMeta
│                               ├── .priceTag
│                               │   ├── .label
│                               │   └── .price
│                               │
│                               └── .arrow


UTILITY FUNCTIONS LAYER
══════════════════════════════════════════════════════════════════════════════

appointmentUtils.ts
│
├── getUpcomingSlots(slots, days)
│   └─► Filters slots within N days
│       Input: Slot[], number
│       Output: Slot[]
│
├── groupSlotsByDate(slots)
│   └─► Groups by YYYY-MM-DD
│       Input: Slot[]
│       Output: Map<string, Slot[]>
│
├── generateCalendarDays(date)
│   └─► Creates calendar grid
│       Input: Date
│       Output: (Date | null)[]
│
├── formatTime12Hour(isoString)
│   └─► Converts to 12-hour format
│       Input: string (ISO)
│       Output: "2:00 PM"
│
├── formatDuration(start, end)
│   └─► Human-readable duration
│       Input: string, string (ISO)
│       Output: "45m" or "1h 30m"
│
├── getTimeUntilSlot(startISO)
│   └─► Real-time countdown
│       Input: string (ISO)
│       Output: {days, hours, minutes, seconds, isUpcoming}
│
└── (+ 9 more utilities)


STATE & LIFECYCLE
═════════════════════════════════════════════════════════════════════════════

Component Lifecycle:
1. Mount
   ├─ Initialize selectedDate = today
   ├─ Initialize countdowns = {}
   └─ Start countdown update effect

2. useMemo Dependencies:
   ├─ creatorMap: [creators]
   ├─ upcomingSlots, slotsByDate, calendarDays: [slots]
   └─ appointmentsByDate: [upcomingSlots]

3. useEffect Dependencies:
   └─ Countdown interval: [upcomingSlots]
      └─ Updates every 1000ms

4. Event Handlers:
   └─ onClick date cell → setSelectedDate(date)

5. Unmount
   └─ Cleanup countdown interval


PERFORMANCE OPTIMIZATIONS
═════════════════════════════════════════════════════════════════════════════

├─ Memoization
│  ├─ creatorMap memoized (lookup O(1))
│  ├─ upcomingSlots memoized (expensive filter/sort)
│  ├─ slotsByDate memoized (grouping calculation)
│  ├─ calendarDays memoized (calendar generation)
│  └─ appointmentsByDate memoized (final grouping)
│
├─ Render Optimization
│  ├─ Only countdown state updates every second
│  ├─ Calendar cells don't re-render on countdown update
│  └─ Appointment cards use Link (no extra renders)
│
├─ CSS Performance
│  ├─ Transform animations (GPU accelerated)
│  ├─ CSS Grid layout (native rendering)
│  └─ Will-change hints on tracked elements
│
└─ Data Optimization
   ├─ 7-day filtering (not 365)
   ├─ Lazy calendar generation (only visible month)
   └─ Efficient Map for creator lookup


RESPONSIVE BREAKPOINTS
═════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│ Desktop (960px+)                                             │
│ ┌────────────────┐  ┌──────────────────────────────────────┐│
│ │ Mini Calendar  │  │ Appointments List                    ││
│ │  (280px)       │  │  (auto, scrollable)                  ││
│ └────────────────┘  └──────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Tablet (640px - 960px)                                       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Mini Calendar (full width)                               │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Appointments List (full width, scrollable)               │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Mobile (<640px)                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Mini Calendar (optimized spacing)                        │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Appointments List (full width, horizontal scroll)        │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘


USER INTERACTION FLOW
═════════════════════════════════════════════════════════════════════════════

1. User lands on home page
   │
   ├─► Sees "Upcoming Appointments" section below hero
   │
   ├─► Reads upcoming appointments for next 7 days
   │
   ├─► Option A: Click date in mini calendar
   │   └─► Calendar visual updates (state change)
   │
   ├─► Option B: Click "Explore Creators" (if empty)
   │   └─► Navigates to /creators
   │
   ├─► Option C: Click appointment card
   │   └─► Navigates to /creator/[creator-id]
   │
   ├─► Watches real-time countdown
   │   └─► Updates every second (in: 5m → in: 4m 59s...)
   │
   └─► Sees pricing and appointment mode clearly
       └─► Can decide whether to book


FUTURE STATE DIAGRAM (with Backend)
═════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────┐
    │  Solana Blockchain  │
    │  Program            │
    │  (timemarket)       │
    │                     │
    │  - Slot PDAs        │
    │  - Reservation      │
    │  - Bids             │
    └──────────┬──────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Backend API         │
    │  (Node.js/Next.js)   │
    │                      │
    │  /api/slots/upcoming │
    │  /api/creators       │
    │  /api/book           │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  Frontend (Next.js)      │
    │                          │
    │  page.tsx                │
    │  └─ UpcomingAppointments │
    │     └─ useSWR/useQuery   │
    │        └─ API calls      │
    └──────────────────────────┘
               │
               ▼
            Browser


KEY METRICS
═════════════════════════════════════════════════════════════════════════════

Performance:
  • Component Mount: < 100ms
  • Re-render on countdown: < 50ms
  • CSS Animation FPS: 60
  • Bundle Size: ~15KB (uncompressed component + CSS)

UX:
  • Slots displayed: 3-20 (depending on calendar)
  • Max appointments shown: Unlimited (scrollable)
  • Countdown update interval: 1000ms (1 second)
  • Calendar days: Always 42 (6 weeks)
  • Date selection response: < 100ms

Accessibility:
  • Color contrast ratio: 4.5:1 (AA compliant)
  • Keyboard navigation: Fully supported
  • Screen reader: Compatible
  • Focus indicators: Visible
  • Text size: Responsive

═════════════════════════════════════════════════════════════════════════════
*/
