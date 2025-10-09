import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, Idl, setProvider } from "@coral-xyz/anchor";
import { myProgramIdl as idl } from "@starter/ts-sdk/idl";

type Wallet = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
};

export const getProgram = (conn: Connection, wallet: Wallet) => {
  const provider = new AnchorProvider(conn, wallet, { commitment: "processed" });
  setProvider(provider);

  const pid = process.env.NEXT_PUBLIC_PROGRAM_ID;
  if (!pid) throw new Error("NEXT_PUBLIC_PROGRAM_ID is not defined");
  const programId = new PublicKey(pid);

  // Cast the generated JSON to Anchor Idl
  const anchorIdl = idl as unknown as Idl;
  return new Program(anchorIdl, provider, programId);
};
