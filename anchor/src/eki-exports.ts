// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import EkiIDL from "../target/idl/eki.json";
import type { Eki } from "../target/types/eki";

// Re-export the generated IDL and type
export { Eki, EkiIDL };

// The programId is imported from the program IDL.
export const EKI_PROGRAM_ID = new PublicKey(EkiIDL.address);

// This is a helper function to get the Basic Anchor program.
export function getProgram(provider: AnchorProvider) {
  return new Program(EkiIDL as Eki, provider);
}
