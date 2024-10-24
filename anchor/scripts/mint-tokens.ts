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
import {
  createMint,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { idWallet, loadKeypairFromFile } from "./helpers";

// process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
process.env.ANCHOR_WALLET = idWallet;

const SOL_MINT = new PublicKey("9TmSJeP1K89kGJJQf54D2P6kYeD5Uc7j2pzFWFre5Fms");
const USDC_MINT = new PublicKey("95eBaAbEAZvxngRgNL4qmikTcYhzHNBwxKTuT2p7SGU");

const destination = new PublicKey(
  "6myQN9vzddHpWfWWHeqBZ4HkPEcQu82Ar5X2HHMTr1TQ"
);

(async () => {
  const provider = anchor.AnchorProvider.env();

  const payer = loadKeypairFromFile(idWallet);

  let solATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    SOL_MINT,
    destination
  );

  let usdcATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    USDC_MINT,
    destination
  );

  await mintTo(
    provider.connection,
    payer,
    SOL_MINT,
    solATA.address,
    payer,
    1000000000000
  );

  await mintTo(
    provider.connection,
    payer,
    USDC_MINT,
    usdcATA.address,
    payer,
    1000000000
  );
})()
  .then(() => console.log("Tokens minted!"))
  .catch((e) => console.log(e));
