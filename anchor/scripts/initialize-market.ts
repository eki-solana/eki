import * as anchor from "@coral-xyz/anchor";
import {
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getProgram } from "../src";

import { BN } from "@coral-xyz/anchor";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { idWallet, loadKeypairFromFile } from "./helpers";

// process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
process.env.ANCHOR_WALLET = idWallet;

const EXITS_ACCOUNT_SIZE = 10240024; // check account size in program

// Original USCD mint address
// const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_MINT = new PublicKey("8ib59DoKUq7GiwQfZUmwvaS7WuoCAMx1wrCYkcdEmpxV");

(async () => {
  const provider = anchor.AnchorProvider.env();
  const program = getProgram(provider);

  const payer = loadKeypairFromFile(idWallet);

  const [market] = PublicKey.findProgramAddressSync(
    [Buffer.from("market")],
    program.programId
  );

  const [treasuryA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_a"), market.toBuffer()],
    program.programId
  );

  const [treasuryB] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_b"), market.toBuffer()],
    program.programId
  );

  const [bookkeeping] = PublicKey.findProgramAddressSync(
    [Buffer.from("bookkeeping"), market.toBuffer()],
    program.programId
  );

  const exits = Keypair.generate();

  const createExitsAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: exits.publicKey,
    space: EXITS_ACCOUNT_SIZE,
    lamports:
      await provider.connection.getMinimumBalanceForRentExemption(
        EXITS_ACCOUNT_SIZE
      ),
    programId: program.programId,
  });
  let blockhash = await provider.connection.getLatestBlockhash();

  let messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: [createExitsAccountIx],
  }).compileToV0Message();

  const createExitsTx = new VersionedTransaction(messageV0);

  createExitsTx.sign([payer, exits]);
  const createExitsTxId =
    await provider.connection.sendTransaction(createExitsTx);
  console.log(
    `https://explorer.solana.com/tx/${createExitsTxId}?cluster=devnet`
  );
  await provider.connection.confirmTransaction({
    signature: createExitsTxId,
    ...blockhash,
  });

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM_ID,
    tokenMintA: NATIVE_MINT,
    tokenMintB: USDC_MINT,
    market: market,
    treasuryA: treasuryA,
    treasuryB: treasuryB,
    bookkeeping: bookkeeping,
    exits: exits.publicKey,
  };

  let startSlot = (await provider.connection.getSlot()) + 60 * 60 * 24 * 2.5;

  const ixs = [
    await program.methods
      .initializeExits()
      .accounts({ ...accounts })
      .instruction(),
    await program.methods
      .initializeMarket(new BN(startSlot), new BN(100))
      .accounts({ ...accounts })
      .instruction(),
  ];

  blockhash = await provider.connection.getLatestBlockhash();

  messageV0 = new TransactionMessage({
    payerKey: provider.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const initMarketTx = new VersionedTransaction(messageV0);
  initMarketTx.sign([payer]);
  const txId = await provider.connection.sendTransaction(initMarketTx);
  console.log(`https://explorer.solana.com/tx/${txId}?cluster=devnet`);
})()
  .then(() => console.log("Market initialized!"))
  .catch((e) => console.log(e));
