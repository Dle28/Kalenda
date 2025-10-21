# 🎨 Profile System - Visual Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      UNIFIED PROFILE SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

User clicks "My Profile" in header
           │
           ▼
    ┌──────────────┐
    │  /profile    │  ← Smart Router
    └──────────────┘
           │
     Checks wallet & status
           │
    ┌──────┴──────────┬────────────────┐
    ▼                 ▼                ▼
┌────────┐      ┌──────────┐    ┌────────────┐
│  NEW   │      │INCOMPLETE│    │  COMPLETE  │
└────────┘      └──────────┘    └────────────┘
    │                 │                │
    ▼                 ▼                ▼
Onboarding      Resume Step      Dashboard
  Prompt          1/2/3/4           (Tabs)
```

## User Flows

### Flow 1: New Creator
```
Header "My Profile"
    ↓
Welcome Screen
    ↓
Connect Wallet
    ↓
┌─────────────────────────────┐
│  ONBOARDING (4 Steps)       │
├─────────────────────────────┤
│  1. Profile Basics          │
│     • Name, Bio, Avatar     │
│     • Location, Timezone    │
│                             │
│  2. Session Details         │
│     • Title, Description    │
│     • Meeting types         │
│     • Default pricing       │
│                             │
│  3. Availability            │
│     • Weekly calendar       │
│     • Available hours       │
│                             │
│  4. Review & Launch         │
│     • Preview profile       │
│     • Confirm & save        │
└─────────────────────────────┘
    ↓
Auto-redirect to Dashboard
```

### Flow 2: Returning Creator
```
Header "My Profile"
    ↓
Status Check
    ↓
Auto-redirect to Dashboard
    ↓
┌─────────────────────────────┐
│  DASHBOARD (4 Tabs)         │
├─────────────────────────────┤
│  📊 Overview                │
│     • Stats cards           │
│     • Quick actions         │
│                             │
│  👤 Profile                 │
│     • Inline editor         │
│     • Save button           │
│                             │
│  📅 Slots                   │
│     • Calendar/Quick mode   │
│     • Generate & publish    │
│                             │
│  💰 Earnings                │
│     • Revenue metrics       │
│     • Transaction history   │
└─────────────────────────────┘
```

## Component Hierarchy

```
ProfileSetup Component (Reusable)
├── Avatar Upload
│   ├── Image preview
│   └── Upload button
├── Basic Info Card
│   ├── Name input *required
│   ├── Bio textarea *required
│   ├── Location input
│   └── Timezone input
├── Session Details Card (full mode)
│   ├── Session title
│   ├── Session description
│   ├── Materials link
│   └── Meeting types checkboxes
└── Pricing Defaults Card (full mode)
    ├── Mode selector
    ├── Currency selector
    ├── Duration input
    └── Price inputs (conditional)

Used in:
  • Onboarding page (step 1-2)
  • Dashboard profile tab
```

## API Endpoints Flow

```
Frontend                Backend               Database
   │                       │                     │
   ├─ GET /api/creator/status?pubkey=X
   │                       │
   │                  Load profile
   │                       ├──────────────────>│
   │                       │<──────────────────┤
   │                       │
   │                  Calculate completeness
   │                       │ • hasName: ✓/✗
   │                       │ • hasBio: ✓/✗
   │                       │ • hasSession: ✓/✗
   │                       │ • hasAvailability: ✓/✗
   │                       │
   │<── {status, %, checks, nextStep}
   │
   ├─ POST /api/creator/profile
   │   Body: { pubkey, name, bio, ... }
   │                       │
   │                  Validate & save
   │                       ├──────────────────>│
   │                       │<──────────────────┤
   │<── {profile: saved}
   │
```

## State Management

```
┌──────────────────────────────────────┐
│  Profile State (in components)       │
├──────────────────────────────────────┤
│  {                                   │
│    name: string                      │
│    bio: string                       │
│    location: string                  │
│    timezone: string                  │
│    avatar?: string                   │
│    sessionTitle?: string             │
│    sessionDescription?: string       │
│    sessionMaterials?: string         │
│    meetingTypes: {                   │
│      video: boolean                  │
│      audio: boolean                  │
│      inperson: boolean               │
│    }                                 │
│    defaults?: {                      │
│      mode: 'Stable'|'EnglishAuction' │
│      currency: 'USDC'|'SOL'          │
│      durationMin: string             │
│      bufferMin: string               │
│      price?: string                  │
│      startPrice?: string             │
│      bidStep?: string                │
│    }                                 │
│  }                                   │
└──────────────────────────────────────┘

Shared between:
  • Onboarding steps
  • Dashboard profile tab
  • ProfileSetup component
```

## Visual Design Elements

### Color Palette
```
Primary Blue:    #60a5fa
Primary Purple:  #a855f7
Success Green:   #34d399
Error Red:       #ef4444
Text Primary:    #f8fafc
Text Muted:      #94a3b8
Background:      #0f172a
Card BG:         rgba(15,23,42,0.5)
```

### Gradients Used
```
Hero gradient:
  linear-gradient(135deg, #60a5fa, #a855f7)

Progress bar:
  linear-gradient(90deg, #60a5fa, #a855f7)

Card accents:
  linear-gradient(135deg, rgba(96,165,250,0.05), rgba(168,85,247,0.05))
```

### Animations
```
Page enter:    fadeIn 0.3s ease-in
Tab switch:    fadeIn 0.3s ease-in
Button hover:  transform translateY(-1px)
Progress bar:  width transition 0.3s ease
```

## Key Features Highlight

### Smart Routing Logic
```javascript
if (status === 'new') {
  // Show onboarding prompt
  return <OnboardingPrompt />
}
else if (status === 'incomplete') {
  // Resume at incomplete step
  router.push(nextStep) // e.g., /creator/onboard?step=2
}
else if (status === 'complete') {
  // Go to dashboard
  router.push('/creator/dashboard')
}
```

### Profile Completeness Calculation
```javascript
const checks = {
  hasName: !!profile.name,
  hasBio: !!profile.bio,
  hasSessionTitle: !!profile.sessionTitle,
  hasSessionDescription: !!profile.sessionDescription,
  hasAvailability: Object.keys(availability).length > 0,
  hasPricing: !!(defaults?.price || defaults?.startPrice),
  hasAvatar: !!profile.avatar
}

percentage = (completed / total) * 100
```

## Mobile Responsiveness

```
Desktop (>960px)
├── Full width cards
├── Side-by-side layouts
└── Tabs spread horizontally

Tablet (768-960px)
├── Narrower cards
├── Some stacking
└── Tabs still horizontal

Mobile (<768px)
├── Full stacking
├── Simplified forms
└── Touch-optimized spacing
```

## Success Metrics

After implementation:
- ✅ Single entry point for all profile actions
- ✅ Clear onboarding completion path
- ✅ Reduced confusion (no separate "get started" vs "profile")
- ✅ Professional dashboard feel
- ✅ Easy profile updates post-launch
- ✅ Scalable for future features

---

**Visual Summary**: Clean, modern, gradient-accented interface with smart routing, progressive disclosure, and tabbed organization. Everything a creator needs in one place.
