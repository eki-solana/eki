import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import type { Eki } from "../target/types/eki";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  createCloseAccountInstruction,
  createInitializeAccount3Instruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { makeKeypairs } from "@solana-developers/helpers";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import IDL from "../target/idl/eki.json";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import crypto from "crypto";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;

const MINIMUM_TRADE_DURATION_SECONDS = 10;

const EXITS_ACCOUNT_SIZE = 10240016;

describe("eki", () => {
  let program = anchor.workspace.Eki as Program<Eki>;
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let provider: BankrunProvider;

  const userKeypairs = makeKeypairs(10);
  const usdcMint = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  );
  const usdcAtas = userKeypairs.map((user) =>
    getAssociatedTokenAddressSync(
      usdcMint,
      user.publicKey,
      false,
      TOKEN_PROGRAM_ID
    )
  );
  const solAtas = userKeypairs.map((user) =>
    getAssociatedTokenAddressSync(
      NATIVE_MINT,
      user.publicKey,
      false,
      TOKEN_PROGRAM_ID
    )
  );

  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM_ID,
    tokenMintA: NATIVE_MINT,
    tokenMintB: usdcMint,
  };

  let endSlotInterval = 100;
  let startSlot = 2000;

  beforeAll(async () => {
    const devnet = new Connection("https://api.mainnet-beta.solana.com");
    const accountInfo = await devnet.getAccountInfo(usdcMint);

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
        ...usdcAtas.map((ata, i) => {
          const tokenAccData = Buffer.alloc(ACCOUNT_SIZE);
          AccountLayout.encode(
            {
              mint: usdcMint,
              owner: userKeypairs[i].publicKey,
              amount: 1_000_000_000_000n,
              delegateOption: 0,
              delegate: PublicKey.default,
              delegatedAmount: 0n,
              state: 1,
              isNativeOption: 0,
              isNative: 0n,
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
              owner: TOKEN_PROGRAM_ID,
              executable: false,
            },
          };
        }),
        ...solAtas.map((ata, i) => {
          const tokenAccData = Buffer.alloc(ACCOUNT_SIZE);
          AccountLayout.encode(
            {
              mint: NATIVE_MINT,
              owner: userKeypairs[i].publicKey,
              amount: 0n,
              delegateOption: 0,
              delegate: PublicKey.default,
              delegatedAmount: 0n,
              state: 1,
              isNativeOption: 0,
              isNative: 0n,
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
              owner: TOKEN_PROGRAM_ID,
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

  it("initializes market!", async () => {
    const [market, marketBump] = PublicKey.findProgramAddressSync(
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

    const [bookkeeping, bookkeepingBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("bookkeeping"), market.toBuffer()],
      program.programId
    );

    const exits = makeKeypairs(1)[0];

    const createExitsAccountIx = SystemProgram.createAccount({
      fromPubkey: userKeypairs[0].publicKey,
      newAccountPubkey: exits.publicKey,
      space: EXITS_ACCOUNT_SIZE,
      // lamports: await getMinimumBalanceForRentExemptAccount(
      //   provider.connection
      // ),
      lamports: 100 * LAMPORTS_PER_SOL,
      programId: program.programId,
    });

    let blockhash = context.lastBlockhash;
    const createExitsAccountTx = new Transaction();
    createExitsAccountTx.recentBlockhash = blockhash;
    createExitsAccountTx.add(createExitsAccountIx);
    createExitsAccountTx.sign(userKeypairs[0], exits);
    await banksClient.processTransaction(createExitsAccountTx);

    accounts.market = market;
    accounts.treasuryA = treasuryA;
    accounts.treasuryB = treasuryB;
    accounts.bookkeeping = bookkeeping;
    accounts.exits = exits.publicKey;

    const ixs = [
      await program.methods
        .initializeExits()
        .accounts({ ...accounts })
        .instruction(),
      await program.methods
        .initializeMarket(new BN(startSlot), new BN(endSlotInterval))
        .accounts({ ...accounts })
        .instruction(),
    ];

    blockhash = context.lastBlockhash;
    const initializeTx = new Transaction();
    initializeTx.recentBlockhash = blockhash;
    initializeTx.add(...ixs);
    initializeTx.sign(provider.wallet.payer);
    await banksClient.processTransaction(initializeTx);

    // Market Account
    const marketAccount = await program.account.market.fetch(market);
    expect(marketAccount.treasuryA.toString()).toStrictEqual(
      accounts.treasuryA.toString()
    );
    expect(marketAccount.treasuryB.toString()).toStrictEqual(
      accounts.treasuryB.toString()
    );
    expect(marketAccount.tokenAVolume.toString()).toStrictEqual("0");
    expect(marketAccount.tokenBVolume.toString()).toStrictEqual("0");
    expect(marketAccount.startSlot.toNumber()).toStrictEqual(startSlot);
    expect(marketAccount.endSlotInterval.toNumber()).toStrictEqual(
      endSlotInterval
    );
    expect(marketAccount.bump).toStrictEqual(marketBump);

    // Bookkeeping
    const bookkeepingAccount =
      await program.account.bookkeeping.fetch(bookkeeping);
    expect(bookkeepingAccount.aPerB.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.noTradeSlots.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.bPerA.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.lastSlot.toNumber()).toStrictEqual(
      marketAccount.startSlot.toNumber()
    );
    expect(bookkeepingAccount.bump).toStrictEqual(bookkeepingBump);

    // Exits
    const exitsAccount = await program.account.exits.fetch(exits.publicKey);
    expect(exitsAccount.pointer.toNumber()).toStrictEqual(0);

    // Treasury Account
    const treasuryAccountA = await banksClient.getAccount(accounts.treasuryA);
    const decodedTreasuryAccountA = AccountLayout.decode(
      treasuryAccountA?.data
    );
    expect(decodedTreasuryAccountA.owner.toBase58()).toBe(market.toBase58());
    expect(decodedTreasuryAccountA.mint.toBase58()).toBe(
      accounts.tokenMintA.toBase58()
    );

    const treasuryAccountB = await banksClient.getAccount(accounts.treasuryB);
    const decodedTreasuryAccountB = AccountLayout.decode(
      treasuryAccountB?.data
    );
    expect(decodedTreasuryAccountB.owner.toBase58()).toBe(market.toBase58());
    expect(decodedTreasuryAccountB.mint.toBase58()).toBe(
      accounts.tokenMintB.toBase58()
    );
  });

  it("deposits token when creating a position!", async () => {
    const depositAmount = 10 * LAMPORTS_PER_SOL;
    const startSlot = Number(await banksClient.getSlot());
    const endSlot = startSlot + endSlotInterval * 10000;

    const user = userKeypairs[0];

    const [position, positionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position_a"),
        accounts.market.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const auxAccount = makeKeypairs(1)[0];
    const ixs = [
      SystemProgram.createAccount({
        fromPubkey: user.publicKey,
        newAccountPubkey: auxAccount.publicKey,
        space: ACCOUNT_SIZE,
        // lamports:
        //   (await getMinimumBalanceForRentExemptAccount(provider.connection)) +
        //   depositAmount, // rent + amount
        lamports: LAMPORTS_PER_SOL + depositAmount, // rent + amount
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
        solAtas[0],
        user.publicKey,
        depositAmount
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
    await banksClient.processTransaction(tx);

    accounts.positionA = position;
    accounts.depositorTokenAccount = solAtas[0];

    const txSig = await program.methods
      .depositTokenA(new BN(depositAmount), new BN(endSlot))
      .accounts({
        ...accounts,
        depositor: userKeypairs[0].publicKey,
        // depositorTokenAccount: atas[0],
        // positionA: position,
      })
      .signers([userKeypairs[0]])
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", txSig);

    // Position Account
    const positionAccount = await program.account.positionA.fetch(
      accounts.positionA
    );
    const marketAccount = await program.account.market.fetch(accounts.market);
    const startPositionSlot = positionAccount.startSlot.toNumber();
    const endPositionSlot = positionAccount.endSlot.toNumber();
    expect(positionAccount.amount.toNumber()).toStrictEqual(depositAmount);
    expect(endPositionSlot - startPositionSlot).toBeGreaterThan(
      endSlotInterval
    );
    expect(startPositionSlot).toStrictEqual(marketAccount.startSlot.toNumber()); // start slot for position was before market start slot
    expect(endPositionSlot % 10).toStrictEqual(0);
    expect(positionAccount.bump).toStrictEqual(positionBump);

    // Treasury Account
    let treasuryAccount = await banksClient.getAccount(accounts.treasuryA);
    let decodedTreasuryAccount = AccountLayout.decode(treasuryAccount?.data);
    expect(Number(decodedTreasuryAccount.amount)).toBe(depositAmount);
  });
});
