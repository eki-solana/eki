import * as anchor from "@coral-xyz/anchor";
import { BN, type Program } from "@coral-xyz/anchor";
import type { Eki } from "../target/types/eki";
import {
  TOKEN_2022_PROGRAM_ID,
  type TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { confirmTransaction, makeTokenMint } from "@solana-developers/helpers";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;

const SECONDS = 1000;

const ANCHOR_SLOW_TEST_THRESHOLD = 40 * SECONDS;

describe("eki", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = (provider.wallet as anchor.Wallet).payer;

  const connection = provider.connection;

  const program = anchor.workspace.Eki as Program<Eki>;

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM,
  };

  let tokenMintA: anchor.web3.PublicKey;
  let tokenMintB: anchor.web3.PublicKey;

  beforeAll(async () => {
    tokenMintA = await makeTokenMint(connection, payer, "Token A", "A", 9, "");
    tokenMintB = await makeTokenMint(connection, payer, "Token B", "B", 9, "");

    // Save the accounts for later use
    accounts.tokenMintA = tokenMintA;
    accounts.tokenMintB = tokenMintB;
  });

  it(
    "Initializes market!",
    async () => {
      const [market, marketBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          accounts.tokenMintA.toBuffer(),
          accounts.tokenMintB.toBuffer(),
        ],
        program.programId
      );

      accounts.market = market;

      const startTime = Date.now() / 1000 + 86400;
      const txSig = await program.methods
        .initializeMarket(new BN(startTime))
        .accounts({ ...accounts })
        .rpc();
      console.log("Your transaction signature", txSig);

      await confirmTransaction(connection, txSig);

      const marketAccount = await program.account.market.fetch(market);
      expect(marketAccount.tokenMintA.toString()).toStrictEqual(
        accounts.tokenMintA.toString()
      );
      expect(marketAccount.tokenMintB.toString()).toStrictEqual(
        accounts.tokenMintB.toString()
      );
      expect(marketAccount.tokenAVolume.toString()).toStrictEqual("0");
      expect(marketAccount.tokenBVolume.toString()).toStrictEqual("0");
      expect(marketAccount.bump).toStrictEqual(marketBump);
    },
    ANCHOR_SLOW_TEST_THRESHOLD
  );
});
