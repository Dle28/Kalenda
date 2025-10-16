import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, Idl, setProvider } from "@coral-xyz/anchor";
import { myProgramIdl as idl } from "@starter/ts-sdk/idl";

type Wallet = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
};

function getProgramId(): PublicKey {
  const fromEnv = process.env.NEXT_PUBLIC_PROGRAM_ID?.trim();
  const fromIdl = (idl as any)?.address as string | undefined; // nếu idl có address
  const candidate = fromEnv ?? fromIdl;

  if (!candidate) {
    throw new Error(
      "Program ID is missing. Set NEXT_PUBLIC_PROGRAM_ID or include `address` in your IDL."
    );
  }
  try {
    return new PublicKey(candidate);
  } catch (e) {
    throw new Error(`Invalid Program ID: "${candidate}". ${String(e)}`);
  }
}

export const getProgram = (conn: Connection, wallet: Wallet) => {
  const provider = new AnchorProvider(conn, wallet as any, { commitment: "processed" });
  setProvider(provider);

  const programId = getProgramId();
  return new Program(idl as unknown as Idl, programId, provider as any);
};
