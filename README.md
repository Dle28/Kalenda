# 🗓️ Kalenda - Decentralized Time Booking on Solana

> **Zero Platform Fees. Instant Settlement. Blockchain Verified.**

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Kalenda is a decentralized time booking platform built on Solana that lets creators monetize their time with **0% platform fees** and instant blockchain settlement.

🎥 **[Demo Video](#)** | 📊 **[Pitch Deck](PITCH_DECK.md)** | 🎨 **[Design System](FIGMA_DESIGN_GUIDE.md)**

---

## ✨ Features

### ✅ Available Now (MVP)
- **🆓 Zero Platform Fees** - Creators keep 100% of their earnings
- **⚡ Instant Settlement** - No waiting, payments settle immediately on-chain
- **🔗 Blockchain Verified** - All transactions viewable on Solscan
- **👛 Phantom Wallet Integration** - Seamless Web3 login and payments
- **📊 Transaction History** - Full on-chain transaction tracking
- **🎨 Beautiful UI** - Professional success modals and responsive design
- **📅 Interactive Calendar** - Easy time slot selection and booking (with demo data)

### 🔜 Coming Soon (Roadmap)
- **🎯 Auction Bidding System** - Smart contracts complete, frontend integration in progress
- **💰 USDC/USDT Support** - Stablecoin payments for price stability
- **🎫 NFT Ticketing** - Provable attendance with tradeable NFTs
- **🏆 Creator Rankings** - Reputation system based on completed bookings
- **📱 Mobile App** - Native iOS and Android applications

---

## � Technical Details

### Current MVP Implementation
- **Payment Method:** Direct SOL transfers via `SystemProgram.transfer()` - 100% real blockchain transactions
- **Data Source:** Mock creator profiles for demo purposes (production data layer coming soon)
- **Smart Contracts:** Anchor auction contracts written and tested, deployment in progress
- **Wallet Support:** Phantom & Solflare integration (fully functional)
- **Network:** Solana Devnet (Mainnet-ready architecture)

### Why Mock Data?
The MVP demonstrates the complete user experience with real payments. Mock creator data allows us to showcase the platform's UX/UI without requiring on-chain profile management, which is planned for Q2 2025 with the auction system integration.

### Production Roadmap
1. Deploy Anchor auction contracts to Devnet
2. Integrate frontend with smart contract methods
3. Replace mock data with on-chain creator profiles
4. Add USDC/USDT support via Token Program
5. Implement NFT ticketing system

---

## �🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- [Phantom Wallet](https://phantom.app/) browser extension
- Devnet SOL (free from [Solana Faucet](https://faucet.solana.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/Dle28/Kalenda.git
cd Kalenda

# Install dependencies
pnpm install

# Start development server
cd apps/web
pnpm dev
```

Visit `http://localhost:3000` and connect your Phantom wallet (on Devnet)!

### 🎯 For Demo/Hackathon Setup
**See [QUICK_START_DEMO_SETUP.md](QUICK_START_DEMO_SETUP.md) for detailed 5-minute setup guide.**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Creators   │  │  Time Slots  │  │ Transaction  │ │
│  │   Browser    │  │   Booking    │  │   History    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
          ┌─────────────────────────────┐
          │   @solana/wallet-adapter    │
          │   (Phantom, Solflare)       │
          └──────────────┬──────────────┘
                         │
                         ▼
          ┌─────────────────────────────┐
          │      Solana Blockchain      │
          │    (SystemProgram.transfer) │
          │         Devnet/Mainnet      │
          └─────────────────────────────┘
```

**Current MVP:** Uses `SystemProgram.transfer()` for fixed-price bookings  
**Future:** Anchor smart contracts for auction system with escrow

See [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) for detailed technical diagrams.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.2** - React framework with App Router
- **TypeScript 5.6** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **FullCalendar** - Interactive calendar component

### Blockchain
- **Solana Web3.js** - Blockchain interaction
- **@solana/wallet-adapter** - Wallet connection (Phantom, Solflare)
- **Anchor Framework** - Smart contract development (in progress)

### Infrastructure
- **pnpm Workspaces** - Monorepo management
- **Vercel** - Deployment (frontend)
- **Solana Devnet** - Development blockchain

---

## 📂 Project Structure

```
Kalenda/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/               # App router pages
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── creators/      # Creator listing
│   │   │   ├── creator/       # Creator profiles
│   │   │   ├── slot/          # Slot booking
│   │   │   └── history/       # Transaction history
│   │   ├── components/        # React components
│   │   │   ├── FakeReserveButton.tsx  # Booking logic
│   │   │   ├── PaymentBox.tsx         # Fee breakdown
│   │   │   └── WeekCalendar.tsx       # Calendar UI
│   │   └── lib/               # Utilities
│   └── actions/               # Backend actions (Blinks)
├── programs/
│   └── timemarket/            # Anchor smart contracts (in dev)
├── packages/
│   └── ts-sdk/                # TypeScript SDK
├── tests/                     # Anchor tests
└── docs/                      # Additional documentation
```

---

## 💡 How It Works

### For Users (Booking a Slot)
1. **Connect Wallet** - Use Phantom wallet extension
2. **Browse Creators** - Explore available time slots
3. **Select Time** - Choose a convenient time slot
4. **Review Payment** - See breakdown (0% platform fee!)
5. **Confirm Transaction** - Approve in wallet
6. **Get Confirmation** - Instant blockchain verification

### For Creators (Listing Time)
1. **Create Profile** - Set hourly rate and availability
2. **Set Schedule** - Define available time slots
3. **Receive Bookings** - Get paid instantly when booked
4. **View History** - Track all transactions on-chain
5. **Keep 100%** - No platform fees deducted

---

## 🎯 Why Kalenda?

### Problem We Solve
Traditional booking platforms like Calendly charge **8-12% fees** and have **2-7 day settlement delays**. For creators earning $50k/year, that's **$4,000-$6,000 lost to fees** plus cash flow issues.

### Our Solution
- **0% Platform Fees** - Zero network fees (0.001 SOL ≈ $0.00015)
- **Instant Settlement** - Payments in ~400ms, not 2-7 days
- **Blockchain Verified** - Transparent, immutable transaction records
- **No Custody** - Creators control their funds (non-custodial)
- **Global Access** - No bank accounts or KYC required

### Competitive Advantage
We're the **first platform combining 0% fees with auction bidding mechanisms** on Solana, enabling creators to maximize earnings during high-demand periods.

---

## 📊 Demo & Pitch Materials

- **🎬 Demo Video Script** - [DEMO_VIDEO_SCRIPT.md](DEMO_VIDEO_SCRIPT.md)
- **📊 Pitch Deck** - [PITCH_DECK.md](PITCH_DECK.md) (10 slides, 4-6 min)
- **🎨 Design System** - [FIGMA_DESIGN_GUIDE.md](FIGMA_DESIGN_GUIDE.md)
- **📝 Project Audit** - [PROJECT_AUDIT_REPORT.md](PROJECT_AUDIT_REPORT.md)
- **📚 All Documentation** - [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## 🧪 Testing

```bash
# Run Anchor tests
anchor test

# Run frontend tests
cd apps/web
pnpm test

# Type checking
pnpm type-check
```

See [README-TESTS.md](README-TESTS.md) for detailed testing guide.

---

## 🗺️ Roadmap

### Q1 2025 (Current - MVP)
- [x] Fixed-price booking system
- [x] Phantom wallet integration
- [x] Transaction history
- [x] Beautiful UI with success modals
- [x] Solscan verification

### Q2 2025 (Next Priority)
- [ ] **USDC/USDT Support** - Stablecoin payments (high priority)
- [ ] **Auction System** - Smart contracts with Anchor
- [ ] **NFT Ticketing** - Provable attendance tokens
- [ ] **Creator Dashboard** - Analytics and earnings tracking
- [ ] **Mobile Responsive** - Full mobile optimization

### Q3 2025 (Growth)
- [ ] **Multi-chain Support** - Ethereum, Polygon integration
- [ ] **Team Bookings** - Group scheduling features
- [ ] **API Integration** - Google Calendar, Zoom sync
- [ ] **Advanced Analytics** - Revenue insights and trends
- [ ] **White Label** - Custom branding for enterprises

### Q4 2025 (Scale)
- [ ] **Mobile Apps** - Native iOS and Android
- [ ] **Recurring Bookings** - Subscription support
- [ ] **DAO Governance** - Community-driven development
- [ ] **Token Launch** - Platform token with utility
- [ ] **Mainnet Deployment** - Production launch

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website:** [kalenda.app](#) (coming soon)
- **GitHub:** [github.com/Dle28/Kalenda](https://github.com/Dle28/Kalenda)
- **Twitter:** [@KalendaApp](#) (coming soon)
- **Discord:** [discord.gg/kalenda](#) (coming soon)
- **Solscan (Devnet):** [solscan.io](https://solscan.io)

---

## 👥 Team

Built with ❤️ by [Dle28](https://github.com/Dle28) for the Solana Hackathon 2025.

---

## 🙏 Acknowledgments

- **Solana Foundation** - For the amazing blockchain infrastructure
- **Phantom Team** - For the seamless wallet experience
- **Anchor Framework** - For smart contract development tools
- **Next.js Team** - For the excellent React framework

---

## 📞 Support

- **Email:** support@kalenda.app (coming soon)
- **GitHub Issues:** [Create an issue](https://github.com/Dle28/Kalenda/issues)
- **Documentation:** See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## 🎉 Quick Links for Hackathon Judges

1. 🚀 **[Setup Demo in 5 min](QUICK_START_DEMO_SETUP.md)**
2. 📊 **[Project Audit Report](PROJECT_AUDIT_REPORT.md)** - Full analysis
3. 🎤 **[Pitch Deck](PITCH_DECK.md)** - Presentation materials
4. 🎬 **[Demo Video Script](DEMO_VIDEO_SCRIPT.md)** - Recording guide
5. 🎨 **[Design System](FIGMA_DESIGN_GUIDE.md)** - Complete design specs

---

<p align="center">
  <strong>Built on Solana 🌟 Zero Fees 💰 Instant Settlement ⚡</strong>
</p>

<p align="center">
  Made with 💜 for the decentralized future
</p>
