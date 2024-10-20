import {
  ACCOUNT_SIZE,
  createCloseAccountInstruction,
  createInitializeAccount3Instruction,
  createTransferInstruction,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { makeKeypairs } from "@solana-developers/helpers";
import { ProgramTestContext } from "solana-bankrun";

export const createTransferWrapSolTx = (
  context: ProgramTestContext,
  user: Keypair,
  solAta: PublicKey,
  amount: number
) => {
  const auxAccount = makeKeypairs(1)[0];
  const ixs = [
    SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: auxAccount.publicKey,
      space: ACCOUNT_SIZE,
      // lamports:
      //   (await getMinimumBalanceForRentExemptAccount(provider.connection)) +
      //   depositAmount, // rent + amount
      lamports: LAMPORTS_PER_SOL + amount, // rent + amount
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccount3Instruction(
      auxAccount.publicKey,
      NATIVE_MINT,
      user.publicKey,
      TOKEN_PROGRAM_ID
    ),
    createTransferInstruction(
      auxAccount.publicKey,
      solAta,
      user.publicKey,
      amount
    ),
    createCloseAccountInstruction(
      auxAccount.publicKey,
      user.publicKey,
      user.publicKey
    ),
  ];

  const blockhash = context.lastBlockhash;
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.add(...ixs);
  tx.sign(user, auxAccount);

  return tx;
};
