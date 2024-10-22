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
import { createMint, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { idWallet, loadKeypairFromFile } from "./helpers";

// process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
process.env.ANCHOR_WALLET = idWallet;

(async () => {
  const provider = anchor.AnchorProvider.env();

  const payer = loadKeypairFromFile(idWallet);

  const mintKeypair = Keypair.generate();

  const tokenConfig = {
    decimals: 6,
    name: "Fake USDC",
    symbol: "USDC",
    uri: "https://thisisnot.arealurl/info.json",
  };

  const mint = await createMint(
    provider.connection,
    payer,
    // mint authority
    payer.publicKey,
    // freeze authority
    payer.publicKey,
    // decimals - use any number you desire
    tokenConfig.decimals,
    // manually define our token mint address
    mintKeypair
  );

  console.log("Token's mint address:", mint.toBase58());
})()
  .then(() => console.log("Market initialized!"))
  .catch((e) => console.log(e));
