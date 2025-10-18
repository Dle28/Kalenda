import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '../index';

// PDA helpers (mirror on-chain seeds)

export function platformPda(admin: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('platform'),
    admin.toBuffer(),
  ], programId);
}

export function feeAuthorityPda(platform: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('fee'),
    platform.toBuffer(),
  ], programId);
}

export function creatorProfilePda(authority: PublicKey, platform: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('creator'),
    authority.toBuffer(),
    platform.toBuffer(),
  ], programId);
}

export function timeSlotPda(profile: PublicKey, startTs: number, programId = new PublicKey(PROGRAM_ID)) {
  const le = Buffer.alloc(8);
  le.writeBigInt64LE(BigInt(startTs));
  return PublicKey.findProgramAddressSync([
    Buffer.from('slot'),
    profile.toBuffer(),
    le,
  ], programId);
}

export function escrowPda(slot: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('escrow'),
    slot.toBuffer(),
  ], programId);
}

export function bidBookPda(slot: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('bidbook'),
    slot.toBuffer(),
  ], programId);
}

export function refundQueuePda(slot: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('refund'),
    slot.toBuffer(),
  ], programId);
}

export function commitStorePda(slot: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('commit'),
    slot.toBuffer(),
  ], programId);
}

export function autoBidStorePda(slot: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('autobid'),
    slot.toBuffer(),
  ], programId);
}

export function nftAuthPda(slot: PublicKey, programId = new PublicKey(PROGRAM_ID)) {
  return PublicKey.findProgramAddressSync([
    Buffer.from('nft_auth'),
    slot.toBuffer(),
  ], programId);
}
