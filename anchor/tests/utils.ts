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
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
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

  const tx = buildTransaction({
    context,
    payer: user.publicKey,
    signers: [user, auxAccount],
    instructions: ixs,
  });

  return tx;
};

export function buildTransaction({
  context,
  payer,
  signers,
  instructions,
}: {
  context: ProgramTestContext;
  payer: PublicKey;
  signers: Keypair[];
  instructions: TransactionInstruction[];
}): VersionedTransaction {
  const blockhash = context.lastBlockhash;

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  signers.forEach((s) => tx.sign([s]));

  return tx;
}
