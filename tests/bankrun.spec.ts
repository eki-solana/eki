import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import type { Eki } from "../target/types/eki";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  type TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { confirmTransaction, makeKeypairs } from "@solana-developers/helpers";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import IDL from "../target/idl/eki.json";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;

describe("eki", () => {
  let program = anchor.workspace.Eki as Program<Eki>;
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let provider: BankrunProvider;

  const userKeypairs = makeKeypairs(10);
  const usdcMint = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  );
  const atas = userKeypairs.map((user) =>
    getAssociatedTokenAddressSync(usdcMint, user.publicKey)
  );

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM,
    tokenMintA: usdcMint,
    tokenMintB: NATIVE_MINT,
  };

  beforeAll(async () => {
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const accountInfo = await connection.getAccountInfo(usdcMint);

    context = await startAnchor(
      "",
      [{ name: "eki", programId: new PublicKey(IDL.address) }],
      [
        {
          address: usdcMint,
          info: accountInfo,
        },
        ...userKeypairs.map((user) => {
          return {
            address: user.publicKey,
            info: {
              lamports: 1000 * LAMPORTS_PER_SOL,
              data: Buffer.alloc(0),
              owner: SYSTEM_PROGRAM_ID,
              executable: false,
            },
          };
        }),
        ...atas.map((ata, i) => {
          const tokenAccData = Buffer.alloc(ACCOUNT_SIZE);
          AccountLayout.encode(
            {
              mint: usdcMint,
              owner: userKeypairs[i].publicKey,
              amount: BigInt(1_000_000_000_000),
              delegateOption: 0,
              delegate: PublicKey.default,
              delegatedAmount: BigInt(0),
              state: 1,
              isNativeOption: 0,
              isNative: BigInt(0),
              closeAuthorityOption: 0,
              closeAuthority: PublicKey.default,
            },
            tokenAccData
          );

          return {
            address: ata,
            info: {
              lamports: 1 * LAMPORTS_PER_SOL,
              data: tokenAccData,
              owner: TOKEN_PROGRAM,
              executable: false,
            },
          };
        }),
      ]
    );

    provider = new BankrunProvider(context);
    anchor.setProvider(provider);

    program = new Program<Eki>(IDL as Eki, provider);
    banksClient = context.banksClient;
  });

  it("Initializes market!", async () => {
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
  });
});