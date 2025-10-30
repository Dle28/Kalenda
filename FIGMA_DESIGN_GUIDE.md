# 🎨 KALENDA FIGMA DESIGN GUIDE
## Complete Design System & Slide Templates

---

## 🎯 DESIGN SYSTEM

### Color Palette

```css
/* Primary Colors */
--primary-green: #10b981;      /* Success, CTAs, Highlights */
--primary-blue: #3b82f6;       /* Links, Secondary actions */
--primary-purple: #a855f7;     /* Accent, Premium features */

/* Background Colors */
--bg-dark: #111827;            /* Main background */
--bg-dark-secondary: #1f2937;  /* Cards, sections */
--bg-dark-tertiary: #374151;   /* Hover states */

/* Text Colors */
--text-primary: #ffffff;       /* Main text */
--text-secondary: #e5e7eb;     /* Body text */
--text-muted: #9ca3af;         /* Labels, meta info */

/* Gradient Definitions */
--gradient-green: linear-gradient(135deg, #10b981, #059669);
--gradient-blue: linear-gradient(135deg, #3b82f6, #2563eb);
--gradient-purple: linear-gradient(135deg, #a855f7, #9333ea);
--gradient-mixed: linear-gradient(135deg, #10b981, #3b82f6);

/* Transparency Layers */
--overlay-dark: rgba(0, 0, 0, 0.75);
--glass-light: rgba(255, 255, 255, 0.05);
--glass-medium: rgba(255, 255, 255, 0.1);
```

### Typography

```css
/* Font Families */
--font-display: 'Sora', sans-serif;     /* Headlines, Logo */
--font-body: 'Inter', sans-serif;       /* Body text, UI */
--font-mono: 'Fira Code', monospace;    /* Code, Signatures */

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
--text-5xl: 48px;
--text-6xl: 60px;
--text-7xl: 72px;

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-extrabold: 800;
```

### Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

---

## 📐 FIGMA SETUP INSTRUCTIONS

### 1. Create New Figma File
- File name: "Kalenda Pitch Deck"
- Canvas size: 1920 x 1080 (16:9 aspect ratio)
- Background: #111827

### 2. Install Fonts
Required fonts (free):
- **Sora**: https://fonts.google.com/specimen/Sora
- **Inter**: https://fonts.google.com/specimen/Inter
- **Fira Code** (optional): https://fonts.google.com/specimen/Fira+Code

### 3. Create Color Styles
In Figma → Assets → Colors:
```
Primary/Green    → #10b981
Primary/Blue     → #3b82f6
Primary/Purple   → #a855f7
Background/Dark  → #111827
Background/Card  → #1f2937
Text/Primary     → #ffffff
Text/Muted       → #9ca3af
```

### 4. Create Text Styles
In Figma → Assets → Text Styles:
```
Display/H1       → Sora, 72px, Bold
Display/H2       → Sora, 60px, Bold
Heading/H3       → Sora, 48px, Bold
Heading/H4       → Sora, 36px, SemiBold
Body/Large       → Inter, 20px, Regular
Body/Regular     → Inter, 16px, Regular
Body/Small       → Inter, 14px, Regular
Caption          → Inter, 12px, Medium
```

---

## 🎨 SLIDE TEMPLATES

### SLIDE 1: TITLE SLIDE

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│                   [LOGO: KALENDA]                  │
│                                                    │
│         Decentralized Time Booking on Solana       │
│                                                    │
│                                                    │
│           [Subtitle: Time is Money]                │
│                                                    │
│                                                    │
│         [Your Name] • [Date] • [Hackathon]         │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Logo: 200px height, centered
- Title: Sora, 48px, #ffffff
- Subtitle: Inter, 24px, #9ca3af
- Background: #111827
- Optional: Gradient overlay from bottom
```

### SLIDE 2: PROBLEM SLIDE

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  💸 THE BOOKING PROBLEM                            │
│  ────────────────────────────                      │
│                                                    │
│  [Left Column]                  [Right Column]     │
│                                                    │
│  ❌ High Platform Fees          15-30% of earnings │
│  ❌ Slow Settlements            7-30 day wait      │
│  ❌ No Price Flexibility        Fixed pricing only │
│  ❌ Zero Transparency           Hidden fees        │
│                                                    │
│  [Bottom Center]                                   │
│  Traditional platforms take too much               │
│  and give too little control                       │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Emoji: 64px
- Title: Sora, 48px, #ffffff
- Line separator: 2px, #10b981
- Items: Inter, 24px, left: #ffffff, right: #ef4444
- Bottom text: Inter, 18px, #9ca3af, italic
- Left padding: 80px, Right padding: 80px
```

### SLIDE 3: SOLUTION SLIDE

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ✨ KALENDA SOLUTION                               │
│  ────────────────────────────                      │
│                                                    │
│  [4-Column Grid]                                   │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │    💰    │  │    ⚡    │  │    🔐    │        │
│  │   Zero   │  │ Instant  │  │Blockchain│        │
│  │   Fees   │  │Settlement│  │ Verified │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │    📊    │  │    🎯    │  │    🌐    │        │
│  │Analytics │  │ Dual     │  │  Global  │        │
│  │Dashboard │  │ Pricing  │  │  Access  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Cards: 280px x 200px
- Card background: rgba(255,255,255,0.05)
- Card border: 1px, rgba(16,185,129,0.3)
- Card radius: 20px
- Emoji: 48px, centered
- Title: Inter, 20px, #ffffff, centered
- Hover: Scale 1.05, border opacity 1.0
```

### SLIDE 4: HOW IT WORKS

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  🔄 USER FLOW                                      │
│                                                    │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐   │
│  │  1️⃣  │ ─→ │  2️⃣  │ ─→ │  3️⃣  │ ─→ │  4️⃣  │   │
│  │Browse│    │Select│    │Connect    │  Pay  │   │
│  │      │    │ Slot │    │Wallet│    │      │   │
│  └──────┘    └──────┘    └──────┘    └──────┘   │
│                                                    │
│  ┌──────┐    ┌──────┐                             │
│  │  5️⃣  │ ─→ │  6️⃣  │                             │
│  │Confirm    │Verify│                             │
│  │      │    │      │                             │
│  └──────┘    └──────┘                             │
│                                                    │
│  Total Time: ~20 seconds                          │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Steps: 160px x 140px boxes
- Box background: rgba(59,130,246,0.1)
- Box border: 2px, rgba(59,130,246,0.3)
- Arrows: 2px line, #3b82f6, with arrowhead
- Emoji: 40px
- Text: Inter, 16px, #ffffff, centered
- Timeline total: Inter, 20px, #10b981, bold
```

### SLIDE 5: DEMO SLIDE

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  [Full Screen Video/GIF Embed]                     │
│                                                    │
│  or                                                │
│                                                    │
│  [App Screenshot with Callouts]                    │
│                                                    │
│  ┌──────────────────────────────┐                 │
│  │                              │                 │
│  │  [Screenshot of Success      │                 │
│  │   Modal with Solscan Link]   │                 │
│  │                              │                 │
│  └──────────────────────────────┘                 │
│                                                    │
│  Key Features:                                     │
│  ✓ One-click booking  ✓ Instant confirmation      │
│  ✓ Blockchain proof   ✓ Transaction history       │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Screenshot: Max 1400px width, centered
- Drop shadow: 0 25px 50px rgba(0,0,0,0.5)
- Border: 1px, rgba(16,185,129,0.2)
- Radius: 20px
- Callout arrows: 3px, #10b981
- Feature list: Inter, 18px, #ffffff
- Checkmarks: #10b981
```

### SLIDE 6: FEATURES GRID

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  💎 KEY FEATURES                                   │
│                                                    │
│  [3x2 Grid]                                        │
│                                                    │
│  ┌─────────────────┐ ┌─────────────────┐         │
│  │ 💰 Dual Pricing │ │ ⚡ Solana Speed │         │
│  │                 │ │                 │         │
│  │ Fixed + Auction │ │ 400ms txn time  │         │
│  │ Flexible rates  │ │ $0.0001 fee     │         │
│  └─────────────────┘ └─────────────────┘         │
│                                                    │
│  ┌─────────────────┐ ┌─────────────────┐         │
│  │ 📊 Dashboard    │ │ 🔐 Verified     │         │
│  │                 │ │                 │         │
│  │ Full history    │ │ On-chain proof  │         │
│  │ Real-time stats │ │ Solscan links   │         │
│  └─────────────────┘ └─────────────────┘         │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Cards: 400px x 250px
- Card background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05))
- Card border: 1px, rgba(16,185,129,0.2)
- Card radius: 16px
- Emoji: 40px, top-left
- Title: Sora, 24px, #ffffff
- Description: Inter, 16px, #9ca3af
- Padding: 24px
```

### SLIDE 7: COMPETITIVE ADVANTAGE

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ⚔️ KALENDA vs COMPETITION                         │
│                                                    │
│  [Comparison Table]                                │
│                                                    │
│  ┌──────────┬────────────┬────────────┐          │
│  │ Feature  │ Calendly   │ Kalenda    │          │
│  ├──────────┼────────────┼────────────┤          │
│  │ Fees     │ 8-15%      │ 0%         │          │
│  │ Settle   │ 7-30 days  │ Instant    │          │
│  │ Auction  │ No         │ Yes        │          │
│  │ On-chain │ No         │ Yes        │          │
│  │ Control  │ Limited    │ Full       │          │
│  └──────────┴────────────┴────────────┘          │
│                                                    │
│  🏆 First mover in Web3 booking                   │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Table width: 1200px
- Header row: #1f2937 background, 18px Inter Bold
- Data rows: Alternate rgba(255,255,255,0.02) / transparent
- Cell padding: 20px 24px
- Competitor column: #ef4444 for negatives
- Kalenda column: #10b981 for positives
- Bottom tagline: Sora, 24px, gradient text
```

### SLIDE 8: ROADMAP

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  🛣️ PRODUCT ROADMAP                               │
│                                                    │
│  [Timeline with 3 phases]                          │
│                                                    │
│  Q1 2025          Q2 2025          Q3-Q4 2025     │
│    │                │                │             │
│    ●────────────────●────────────────●            │
│    │                │                │             │
│  ┌─▼─┐            ┌─▼─┐            ┌─▼─┐          │
│  │ ✅ │            │ 🔜 │            │ 🔮 │          │
│  │MVP │            │NFT │            │DAO │          │
│  └───┘            └───┘            └───┘          │
│                                                    │
│  • Booking        • Tickets        • Governance   │
│  • Auctions       • Multi-token    • Mobile app   │
│  • Phantom        • Analytics      • Integrations │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Timeline: 4px line, #3b82f6
- Milestones: 24px circle, gradient fill
- Phase cards: 200px x 180px
- Card border: 2px dashed, rgba(255,255,255,0.2)
- Emoji: 48px
- Title: Sora, 20px, #ffffff
- Features: Inter, 14px, #9ca3af, bullet list
```

### SLIDE 9: TEAM / TRACTION

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  📈 TRACTION & MARKET                              │
│                                                    │
│  [3 Metric Cards]                                  │
│                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │              │ │              │ │           │ │
│  │   $104B      │ │     40%      │ │  Working  │ │
│  │   Market     │ │   YoY Growth │ │    MVP    │ │
│  │              │ │              │ │           │ │
│  │   Creator    │ │   Web3       │ │  On Dev   │ │
│  │   Economy    │ │   Adoption   │ │   net     │ │
│  │              │ │              │ │           │ │
│  └──────────────┘ └──────────────┘ └───────────┘ │
│                                                    │
│  Target: 1,000 creators in 6 months               │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Cards: 340px x 280px
- Card background: gradient per theme
- Number: Sora, 60px, gradient text, bold
- Label: Inter, 18px, #ffffff
- Sublabel: Inter, 14px, #9ca3af
- Target text: Inter, 20px, #10b981, centered
```

### SLIDE 10: CLOSING / CALL TO ACTION

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│              🚀 TIME IS MONEY                      │
│                                                    │
│           Make it count with Kalenda               │
│                                                    │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │  🌐 kalenda-demo.vercel.app              │    │
│  │  💻 github.com/Dle28/Kalenda            │    │
│  │  📧 your-email@example.com               │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│              Thank you! Questions?                 │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘

Design Specs:
- Main title: Sora, 64px, gradient text
- Subtitle: Inter, 32px, #9ca3af
- Contact box: rgba(255,255,255,0.05) background
- Contact box: 2px border, rgba(16,185,129,0.3)
- Contact box: 24px radius
- Links: Inter, 20px, #3b82f6, monospace
- Thank you: Sora, 28px, #ffffff
```

---

## 🎨 COMPONENT LIBRARY

### Button Component
```
Primary Button:
- Background: linear-gradient(135deg, #10b981, #059669)
- Padding: 16px 32px
- Border radius: 12px
- Font: Inter, 16px, Bold
- Color: #ffffff
- Shadow: 0 4px 12px rgba(16,185,129,0.3)
- Hover: Scale 1.05, shadow 0 8px 20px

Secondary Button:
- Background: transparent
- Border: 2px solid rgba(255,255,255,0.2)
- Padding: 14px 30px
- Rest same as primary
```

### Card Component
```
Standard Card:
- Background: rgba(255,255,255,0.05)
- Border: 1px solid rgba(255,255,255,0.1)
- Border radius: 16px
- Padding: 24px
- Shadow: 0 10px 30px rgba(0,0,0,0.3)

Hover state:
- Background: rgba(255,255,255,0.08)
- Border: 1px solid rgba(16,185,129,0.3)
- Transform: translateY(-4px)
- Shadow: 0 20px 40px rgba(0,0,0,0.4)
```

### Badge Component
```
Success Badge:
- Background: rgba(16,185,129,0.15)
- Color: #10b981
- Padding: 6px 12px
- Border radius: 20px
- Font: Inter, 12px, SemiBold

Error Badge:
- Background: rgba(239,68,68,0.15)
- Color: #ef4444
- Rest same as success
```

---

## 📦 ASSET EXPORT SETTINGS

### For Presentation:
- Format: PNG
- Scale: 2x (for retina displays)
- Background: Include (if needed)

### For Web:
- Format: SVG (for icons, logos)
- Format: WebP (for screenshots)
- Compression: Medium-High

### For Print:
- Format: PDF
- Resolution: 300 DPI
- Color space: RGB (for screen) or CMYK (for print)

---

## 🔗 USEFUL FIGMA PLUGINS

1. **Unsplash** - Free stock photos
2. **Iconify** - Icon library
3. **Stark** - Accessibility checker
4. **Content Reel** - Mock data generator
5. **Contrast** - Color contrast checker
6. **Chart** - Create data visualizations

---

## 📱 RESPONSIVE VERSIONS

Create variants for:
- Desktop: 1920x1080
- Tablet: 1024x768
- Mobile: 375x667

---

## ✅ DESIGN CHECKLIST

Before finalizing:
- [ ] All text is readable (min 14px)
- [ ] Colors have sufficient contrast (WCAG AA)
- [ ] Animations are smooth (use ease-in-out)
- [ ] Spacing is consistent (use 8px grid)
- [ ] Fonts are properly embedded
- [ ] Images are optimized
- [ ] Slide transitions are consistent
- [ ] Mobile version created (if needed)

---

**Figma File Ready! 🎨✨**

Copy these specs into your Figma file and customize as needed. Good luck with your presentation! 🚀
