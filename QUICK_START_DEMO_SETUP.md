# 🚀 QUICK START DEMO SETUP GUIDE
**Time Required:** 5 minutes  
**CRITICAL: Complete these steps before recording demo**

---

## ✅ STEP 1: Set Treasury Address (REQUIRED)

### What You Need:
Your Phantom wallet address on **Devnet** network

### How to Get It:
1. Open Phantom wallet extension
2. Click Settings (gear icon)
3. Switch to **"Devnet"** network
4. Click your wallet name at top
5. Copy your address (starts with letters/numbers)

### Where to Put It:
**File:** `apps/web/components/FakeReserveButton.tsx`  
**Line:** 8

**Replace this:**
```typescript
const TREASURY_ADDRESS = "PUT_YOUR_WALLET_ADDRESS_HERE";
```

**With your address (example):**
```typescript
const TREASURY_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
```

---

## ✅ STEP 2: Fund Your Devnet Wallet

### Get Free Devnet SOL:
```powershell
# In terminal:
solana airdrop 2 YOUR_ADDRESS --url https://api.devnet.solana.com
```

**OR** use web faucet:
- Visit: https://faucet.solana.com/
- Paste your wallet address
- Select "Devnet"
- Click "Confirm Airdrop"
- Get 1-2 SOL (free testnet tokens)

### Verify Balance:
1. Open Phantom wallet
2. Make sure you're on **Devnet**
3. Check you have at least 1 SOL

---

## ✅ STEP 3: Test Complete Flow

### Start Dev Server:
```powershell
cd apps/web
pnpm dev
```

### Test Booking:
1. Open http://localhost:3000
2. Click "Connect Wallet" (top right)
3. Select Phantom
4. Approve connection
5. Browse creators
6. Click a creator
7. Select a time slot
8. **VERIFY:** Payment shows "0.000 SOL platform fee"
9. Click "Book Now"
10. Approve transaction in Phantom
11. **VERIFY:** Success modal appears
12. Click "View on Solscan"
13. **VERIFY:** Transaction is confirmed

### Success Criteria:
- ✅ Transaction completes without errors
- ✅ Success modal displays with checkmark
- ✅ Solscan shows confirmed transaction
- ✅ Payment breakdown shows "0.000 SOL (0% - You keep 100%!)"

---

## ✅ STEP 4: Record Demo Video

### Preparation:
1. Close unnecessary browser tabs
2. Clear browser console (F12 > clear)
3. Full screen browser (F11)
4. Have script ready: `DEMO_VIDEO_SCRIPT.md`

### Recording Tools:
- **OBS Studio** (free, best quality)
- **Loom** (easy, browser-based)
- **Windows Game Bar** (Win + G)

### Timing:
- **Target:** 60-90 seconds
- **Practice:** 3 times before final recording
- **Backup:** Record 2-3 takes, pick best one

### What to Show:
```
0:00-0:10 - Homepage + Connect Wallet
0:10-0:25 - Browse creators
0:25-0:40 - Select time slot
0:40-0:50 - Review payment (emphasize 0% fee!)
0:50-0:60 - Complete transaction
0:60-0:75 - Success modal + Solscan verification
0:75-0:90 - Show transaction history
```

---

## ✅ STEP 5: Pre-Demo Checklist

### Technical:
- [ ] Treasury address set in FakeReserveButton.tsx
- [ ] Devnet wallet funded with 1+ SOL
- [ ] Test transaction completed successfully
- [ ] Dev server runs without errors
- [ ] No TypeScript errors (`pnpm type-check`)

### UI Verification:
- [ ] Payment shows "0.000 SOL platform fee"
- [ ] Success modal displays correctly
- [ ] Solscan link works
- [ ] Transaction history updates
- [ ] All pages load properly

### Documentation:
- [ ] README.md reviewed
- [ ] PITCH_DECK.md printed/available
- [ ] DEMO_VIDEO_SCRIPT.md memorized
- [ ] Q&A answers prepared

### Backup Plans:
- [ ] Demo video recorded and saved
- [ ] Screenshots of working demo
- [ ] Offline slide deck ready
- [ ] GitHub repo link ready

---

## ⚠️ TROUBLESHOOTING

### Issue: Transaction Fails
**Symptoms:** Error after clicking "Book Now"

**Solutions:**
1. Check wallet has SOL (Devnet)
2. Verify treasury address is correct
3. Check you're on Devnet network
4. Try disconnecting and reconnecting wallet
5. Refresh page and try again

### Issue: "Invalid Address" Error
**Symptoms:** Error when setting treasury address

**Solutions:**
1. Verify address is from Phantom wallet
2. Check you copied entire address
3. Make sure you're on Devnet (not Mainnet)
4. Address should be 32-44 characters
5. No spaces or special characters

### Issue: Solscan Shows Nothing
**Symptoms:** Transaction doesn't appear on Solscan

**Solutions:**
1. Wait 10-15 seconds for confirmation
2. Make sure Solscan is on "Devnet" mode
3. Check transaction signature is correct
4. Try refreshing Solscan page
5. Verify RPC connection in providers.tsx

### Issue: Wallet Won't Connect
**Symptoms:** Phantom doesn't pop up

**Solutions:**
1. Unlock Phantom wallet
2. Refresh browser page
3. Check Phantom extension is enabled
4. Try different browser (Chrome recommended)
5. Clear browser cache

---

## 🎯 DEMO DAY CHECKLIST

### 1 Hour Before:
- [ ] Restart computer (fresh start)
- [ ] Close all unnecessary apps
- [ ] Open only: VS Code, Browser, Terminal
- [ ] Start dev server: `pnpm dev`
- [ ] Test wallet connection
- [ ] Run one test transaction
- [ ] Check Solscan link works

### 15 Minutes Before:
- [ ] Clear browser console
- [ ] Full screen browser (F11)
- [ ] Have backup video ready
- [ ] Have pitch deck open
- [ ] Practice voiceover one last time
- [ ] Take deep breath 😊

### During Demo:
- [ ] Speak slowly and clearly
- [ ] Emphasize "0% platform fees"
- [ ] Show Solscan verification
- [ ] Mention auction roadmap
- [ ] End with strong call-to-action

### After Demo:
- [ ] Share GitHub repo link
- [ ] Share demo video
- [ ] Answer questions confidently
- [ ] Network with judges/attendees

---

## 📞 EMERGENCY CONTACTS

### If Technical Issues During Demo:

**Plan A:** Show pre-recorded video
- Location: `[Save your video file path here]`
- Do voiceover while video plays

**Plan B:** Use slides with screenshots
- File: `PITCH_DECK.md`
- Walk through features verbally

**Plan C:** Code walkthrough
- Show GitHub: https://github.com/[your-username]/Kalenda
- Explain architecture live

---

## 🎉 FINAL CONFIDENCE BOOST

### Your Strengths:
✅ **Working MVP** - Real blockchain transactions  
✅ **Unique Value Prop** - 0% platform fees  
✅ **Professional UI** - Beautiful success modal  
✅ **Clear Vision** - Auction system roadmap  
✅ **Comprehensive Docs** - Pitch deck, design system  

### Remember:
- You built a REAL dApp with actual Solana transactions
- Your 0% fee model is unique and defensible
- Judges love working demos
- You have excellent documentation
- You're prepared!

---

## 🚀 YOU'RE READY!

Once you complete Steps 1-3, you're good to go!

**Main thing:** Set that treasury address and test one transaction.

**Everything else is polish.**

---

**Need Help?**
- Check: `PROJECT_AUDIT_REPORT.md`
- Demo Script: `DEMO_VIDEO_SCRIPT.md`
- Pitch Deck: `PITCH_DECK.md`
- Design System: `FIGMA_DESIGN_GUIDE.md`

**Good luck! You've got this! 🏆🚀**
