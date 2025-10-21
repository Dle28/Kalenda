# Upcoming Appointments - Visual Layout & Architecture

## 📐 Page Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      HOME PAGE (page.tsx)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌──────────────────────┐                 │
│                    │   "TIME IS MONEY."    │                 │
│                    │      Hero Section     │                 │
│                    │     (Featured Creators│                 │
│                    │   Carousel - 2 cols)  │                 │
│                    └──────────────────────┘                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⬇️  NEW: UPCOMING APPOINTMENTS SECTION  ⬇️             │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Your Upcoming Appointments                      │  │ │
│  │  │  Browse and manage your scheduled sessions      │  │ │
│  │  ├──────────────────────────────────────────────────┤  │ │
│  │  │                                                  │  │ │
│  │  │  ┌─────────────────┐  ┌────────────────────┐    │  │ │
│  │  │  │ MINI CALENDAR   │  │ APPOINTMENTS LIST  │    │  │ │
│  │  │  │                 │  │                    │    │  │ │
│  │  │  │  Oct 2025       │  │  Today (3)         │    │  │ │
│  │  │  │  S M T W T F S  │  │  ┌────────────────┐│    │  │ │
│  │  │  │  1 2 3 4 5 6 7  │  │  │ 👤 Creator   ₊ ││    │  │ │
│  │  │  │  8 9●10 11 12 13│  │  │ 10:00 - 45min  ││    │  │ │
│  │  │  │ 14 15 16•17 18 19│ │  │ Fixed $99.00   ││    │  │ │
│  │  │  │ 21 22 23 24•25•26│ │  └────────────────┘│    │  │ │
│  │  │  │ 27 28 29 30 31   │  │ ┌────────────────┐│    │  │ │
│  │  │  │                 │  │ │ 👤 Creator   ₊ ││    │  │ │
│  │  │  │ 🟢 Today         │  │ │ 14:30 - 30min  ││    │  │ │
│  │  │  │ • Has appt.      │  │ │ Auction $50.00 ││    │  │ │
│  │  │  └─────────────────┘  │ └────────────────┘│    │  │ │
│  │  │                        │                    │    │  │ │
│  │  │                        │ Tomorrow (1)       │    │  │ │
│  │  │                        │ ┌────────────────┐│    │  │ │
│  │  │                        │ │ 👤 Creator   ₊ ││    │  │ │
│  │  │                        │ │ 09:00 - 60min  ││    │  │ │
│  │  │                        │ │ Fixed $150.00  ││    │  │ │
│  │  │                        │ └────────────────┘│    │  │ │
│  │  │                        │ [scroll...]       │    │  │ │
│  │  │                        └────────────────────┘    │  │ │
│  │  │                                                  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                    ┌──────────────────────┐                 │
│                    │  "How It Works" Step  │                 │
│                    │  Instructions        │                 │
│                    └──────────────────────┘                 │
│                                                              │
│                   [Testimonials Section]                    │
│                   [Events Strip Section]                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        FOOTER                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Component Architecture

```
UpcomingAppointments.tsx
├── Props Input
│   ├── slots: Slot[]
│   └── creators: Creator[]
│
├── State
│   ├── selectedDate: Date (for calendar)
│   └── countdowns: Record<string, CountdownData>
│
├── Hooks
│   ├── useMemo (creatorMap, upcomingSlots, calendarDays)
│   └── useEffect (countdown timer, 1s interval)
│
├── Computed Values
│   ├── creatorMap (Map<string, Creator>)
│   ├── upcomingSlots (Slot[])
│   ├── slotsByDate (Map<string, Slot[]>)
│   ├── calendarDays (Date[])
│   └── appointmentsByDate (Record<string, Slot[]>)
│
└── Render
    ├── Container
    │   ├── Header
    │   │   ├── Title: "Your Upcoming Appointments"
    │   │   └── Subtitle
    │   │
    │   └── Grid (2-col desktop, 1-col mobile)
    │       ├── CalendarPanel
    │       │   ├── Month/Year Header
    │       │   ├── Weekday Row (Sun-Sat)
    │       │   └── Calendar Grid (7x6)
    │       │       └── DateCell (buttons)
    │       │
    │       └── AppointmentsPanel
    │           ├── Empty State (no appointments)
    │           │   ├── Emoji Icon (📅)
    │           │   ├── Message
    │           │   └── "Explore Creators" Link
    │           │
    │           └── AppointmentsList
    │               └── DateGroup[] (grouped by date)
    │                   ├── DateGroupHeader
    │                   │   ├── Formatted Date
    │                   │   └── Slot Count Badge
    │                   │
    │                   └── AppointmentCard[]
    │                       ├── Avatar (img)
    │                       ├── Details
    │                       │   ├── Creator Name
    │                       │   ├── Field/Category
    │                       │   ├── Time + Duration
    │                       │   └── Countdown (if applicable)
    │                       │
    │                       └── Meta
    │                           ├── Price Tag
    │                           │   ├── Label (Fixed/Auction)
    │                           │   └── Price
    │                           │
    │                           └── Arrow (→)
```

---

## 🎯 Data Flow

```
page.tsx
├── Import mock data
│   └── slots: Slot[]
│
├── Enrich creators
│   ├── Look up sale summaries
│   └── creators: Creator[]
│
└── Pass to UpcomingAppointments
    ├── [slots]
    ├── [enrichedCreators]
    │
    └── UpcomingAppointments processes:
        ├── Filter upcoming (next 7 days)
        ├── Group by date
        ├── Sort by time
        ├── Generate calendar
        ├── Create countdowns
        └── Render UI

[Real-time Updates]
├── Every 1 second
└── Update countdown values
    ├── useEffect interval
    └── setCountdowns(newValues)

[User Interaction]
├── Click calendar date
│   └── setSelectedDate(date)
│
├── Hover appointment card
│   └── CSS hover state
│
└── Click appointment
    └── Navigate to /creator/[pubkey]
```

---

## 📊 Grid Layout Breakdown

### Desktop (>960px)
```
┌─────────────────────────────────────────────────┐
│ GRID: 280px | 1fr (auto)                        │
├──────────────┬────────────────────────────────┤
│              │                                  │
│  CALENDAR    │      APPOINTMENTS LIST           │
│  (280px)     │      (remaining space)           │
│              │                                  │
│  Oct 2025    │  Today (3 appointments)          │
│  S M T W ...  │  ┌─────────────────────────┐   │
│  1 2 3 4 ...  │  │ Card 1                  │   │
│  8 9 ...      │  │ Avatar | Details | Meta │   │
│  ...          │  └─────────────────────────┘   │
│              │  ┌─────────────────────────┐   │
│              │  │ Card 2                  │   │
│              │  └─────────────────────────┘   │
│              │  ┌─────────────────────────┐   │
│              │  │ Card 3                  │   │
│              │  └─────────────────────────┘   │
│              │                                  │
│              │  Tomorrow (1 appointment)        │
│              │  ┌─────────────────────────┐   │
│              │  │ Card 4                  │   │
│              │  └─────────────────────────┘   │
│              │  [scroll]                       │
└──────────────┴────────────────────────────────┘

Calendar Panel Properties:
- Width: 280px (fixed)
- Height: fit-content
- Border: 1px solid rgba(...)
- Background: rgba(255, 255, 255, 0.02)
- Padding: 12px
- Border-radius: 12px

Appointments Panel Properties:
- Min-height: 280px
- Max-height: 480px (with scroll)
- Gap between cards: 8px
- Overflow-y: auto
```

### Tablet (640-960px)
```
┌─────────────────────────────┐
│ GRID: 1fr (stacked)         │
├─────────────────────────────┤
│                             │
│       CALENDAR              │
│   (height: auto)            │
│                             │
│   Oct 2025                  │
│   S M T W T F S             │
│   1 2 3 4 5 6 7             │
│   8 9 10 11 ...             │
│                             │
├─────────────────────────────┤
│                             │
│    APPOINTMENTS LIST        │
│    (full width)             │
│                             │
│  Today (3)                  │
│  [Card 1]                   │
│  [Card 2]                   │
│  [Card 3]                   │
│                             │
│  Tomorrow (1)               │
│  [Card 4]                   │
│                             │
└─────────────────────────────┘
```

### Mobile (<640px)
```
┌──────────────┐
│  Container   │
│  Padding: 16px
├──────────────┤
│   CALENDAR   │
│   Compact    │
│   S M T ...  │
│   1 2 3 ...  │
├──────────────┤
│ APPOINTMENTS │
│   [Card 1]   │
│   Avatar: 40px
│   [Card 2]   │
│   Text: smaller
│   [Card 3]   │
│              │
│  [scroll]    │
└──────────────┘
```

---

## 🎨 Color & Typography Hierarchy

```
CONTAINER BACKGROUND
├── rgba(255, 255, 255, 0.04)
└── backdrop-filter: blur(10px)

HEADER
├── Title: 20px / 700 / #e5e7eb
└── Subtitle: 13px / 400 / #9ca3af

CALENDAR PANEL
├── Background: rgba(255, 255, 255, 0.02)
├── Month Header: 14px / 600 / #e5e7eb
├── Weekday: 11px / 600 / #9ca3af
├── Date Cell
│   ├── Normal: 12px / 500 / #e5e7eb
│   ├── Today: 22c55e (green), 700 weight
│   ├── Hover: rgba(239, 132, 189, 0.08) bg
│   └── Other Month: opacity 0.3
└── Dot Indicator: 4px radius, rgba(239, 132, 189)

APPOINTMENT CARDS
├── Background: rgba(255, 255, 255, 0.03)
├── Hover: rgba(239, 132, 189, 0.08) bg
├── Creator Name: 13px / 600 / #e5e7eb
├── Field: 11px / 400 / #9ca3af
├── Time: 11px / 500 / rgba(255, 255, 255, 0.7)
├── Countdown: 10px / 600 / rgba(34, 197, 94, 0.8)
├── Label: 10px / 600 / #9ca3af
├── Price: 12px / 700 / rgba(239, 132, 189, 0.9)
└── Arrow: 16px / rgba(239, 132, 189, 0.6)

ACCENT COLORS
├── Primary Pink: rgba(239, 132, 189)
├── Success Green: rgba(34, 197, 94)
├── Text Primary: #e5e7eb
├── Text Secondary: #9ca3af
└── Borders: rgba(255, 255, 255, 0.12)
```

---

## 🔄 State Management Flow

```
UpcomingAppointments
│
├── [selectedDate: Date]
│   └── Updated by: Click calendar date button
│       Used by: Visual highlight on calendar
│
├── [countdowns: Record<string, CountdownData>]
│   └── Updated by: useEffect interval (1s)
│       Used by: Display "in Xh Xm" text
│
├── [computed: creatorMap]
│   └── Derived from: creators prop
│       Used by: Fast lookup O(1) for each card
│
├── [computed: upcomingSlots]
│   └── Derived from: slots prop
│       Used by: Filtered list display
│
├── [computed: calendarDays]
│   └── Derived from: selectedDate
│       Used by: Calendar grid rendering
│
└── [computed: appointmentsByDate]
    └── Derived from: upcomingSlots
        Used by: Group and display by date
```

---

## 🎬 Animation & Transitions

```
Hover Card Effect:
┌─────────────────┐
│ Normal State    │
│ ┌─────────────┐ │
│ │ Card        │ │
│ │ bg: 0.03    │ │
│ │ border: 0.1 │ │
│ │ transform:  │ │
│ │ none        │ │
│ └─────────────┘ │
└─────────────────┘
        ⬇️ (0.2s ease)
┌─────────────────┐
│ Hover State     │
│ ┌─────────────┐ │
│ │ Card        │ │
│ │ bg: 0.08 ⚡ │ │
│ │ border: 0.3 │ │
│ │ transform:  │ │
│ │ translateX+ │ │
│ └─────────────┘ │
└─────────────────┘

Calendar Date Hover:
Normal → (scale 1.05) + (color change) + (border glow)

Transitions Applied:
- Background: 0.2s ease
- Transform: 0.2s ease
- Border: 0.2s ease
- Color: 0.2s ease
```

---

## 📦 Props Interface

```typescript
interface UpcomingAppointmentsProps {
  slots: Slot[]      // Array of time slot objects
  creators: Creator[] // Array of creator profiles
}

interface Slot {
  id: string                          // Unique identifier
  creator: string                     // Creator public key
  start: string                       // ISO 8601 datetime
  end: string                         // ISO 8601 datetime
  mode: 'Stable' | 'EnglishAuction'  // Pricing mode
  price?: number                      // Fixed price
  startPrice?: number                 // Auction starting price
}

interface Creator {
  pubkey: string       // Unique identifier
  name: string        // Display name
  avatar?: string     // Image URL
  timezone?: string   // Timezone offset
  fields?: string[]   // Categories/fields
  rating?: number     // Star rating
}
```

---

**Last Updated**: October 21, 2025  
**Component Version**: 1.0  
**Status**: ✅ Production Ready
