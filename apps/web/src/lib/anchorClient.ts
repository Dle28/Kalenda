import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import idl from "@starter/ts-sdk/idl/my_program.json";

export const getProgram = (conn: Connection, wallet: any) => {
  const provider = new AnchorProvider(conn, wallet, { commitment: "processed" });
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
  return new Program(idl as Idl, programId, provider);
};
