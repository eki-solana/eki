import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import type { Eki } from "../target/types/eki";
import {
  ACCOUNT_SIZE,
  AccountLayout,
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
import { createTransferWrapSolTx } from "./utils";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;

const EXITS_ACCOUNT_SIZE = 10240016;

const NUM_USERS = 10;

const BOOKKEEPING_PRECISION = 1_000_000; // must be the same as BOOKKEEPING_PRECISION in the program
const VOLUME_PRECISION = 1_000_000; // must be the same as VOLUME_PRECISION in the program

describe("eki", () => {
  let program = anchor.workspace.Eki as Program<Eki>;
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let provider: BankrunProvider;

  const userKeypairs = makeKeypairs(NUM_USERS);
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

  const userDeposits = userKeypairs.map(
    (_, i) => (i + 1) * 10 * LAMPORTS_PER_SOL
  );

  const allPositionsA = Array(NUM_USERS);
  const allPositionsB = Array(NUM_USERS);

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
              amount: 1_000_000_000_000_000n,
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

  it(`initializes market! Starting at slot ${startSlot}`, async () => {
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

  it("deposits token A before market starts!", async () => {
    const userId = 0;
    const endSlot = startSlot + endSlotInterval * 1000;

    const user = userKeypairs[userId];
    const depositAmount = userDeposits[userId];

    const [position, positionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position_a"),
        accounts.market.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tx = createTransferWrapSolTx(
      context,
      user,
      solAtas[userId],
      depositAmount
    );
    await banksClient.processTransaction(tx);

    allPositionsA[userId] = position;
    accounts.positionA = position;
    accounts.depositorTokenAccount = solAtas[userId];

    await program.methods
      .depositTokenA(new BN(userDeposits[userId]), new BN(endSlot))
      .accounts({
        ...accounts,
        depositor: user.publicKey,
        // depositorTokenAccount: atas[0],
        // positionA: position,
      })
      .signers([userKeypairs[userId]])
      .rpc({ skipPreflight: true });

    // Market Account
    const marketAccount = await program.account.market.fetch(accounts.market);
    expect(
      Math.floor(marketAccount.tokenAVolume.toNumber() / VOLUME_PRECISION)
    ).toStrictEqual(Math.floor(userDeposits[userId] / (endSlot - startSlot)));

    // Position Account
    const positionAccount = await program.account.positionA.fetch(
      accounts.positionA
    );
    const startPositionSlot = positionAccount.startSlot.toNumber();
    const endPositionSlot = positionAccount.endSlot.toNumber();
    expect(positionAccount.amount.toNumber()).toStrictEqual(
      userDeposits[userId]
    );
    expect(endPositionSlot - startPositionSlot).toBeGreaterThan(
      endSlotInterval
    );
    expect(positionAccount.bookkeeping.toNumber()).toStrictEqual(0);
    expect(positionAccount.noTradeSlots.toNumber()).toStrictEqual(0);
    expect(startPositionSlot).toStrictEqual(marketAccount.startSlot.toNumber()); // start slot for position was before market start slot
    expect(endPositionSlot % endSlotInterval).toStrictEqual(0);
    expect(positionAccount.bump).toStrictEqual(positionBump);

    // Bookkeeping Account
    const bookkeepingAccount = await program.account.bookkeeping.fetch(
      accounts.bookkeeping
    );
    expect(bookkeepingAccount.aPerB.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.bPerA.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.noTradeSlots.toNumber()).toStrictEqual(0);

    // Treasury Account
    let treasuryAccount = await banksClient.getAccount(accounts.treasuryA);
    let decodedTreasuryAccount = AccountLayout.decode(treasuryAccount?.data);
    expect(Number(decodedTreasuryAccount.amount)).toBe(userDeposits[userId]);
  });

  it("deposits token A after market has started!", async () => {
    const userId = 1;
    const depositAmount = userDeposits[userId];
    const endSlot = startSlot + endSlotInterval * 1000;
    const jumpSlots = 5000;

    context.warpToSlot(BigInt(startSlot + jumpSlots));

    const user = userKeypairs[userId];

    const [position, positionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position_a"),
        accounts.market.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tx = createTransferWrapSolTx(
      context,
      user,
      solAtas[userId],
      depositAmount
    );
    await banksClient.processTransaction(tx);

    allPositionsA[userId] = position;
    accounts.positionA = position;
    accounts.depositorTokenAccount = solAtas[userId];

    await program.methods
      .depositTokenA(new BN(depositAmount), new BN(endSlot))
      .accounts({
        ...accounts,
        depositor: user.publicKey,
        // depositorTokenAccount: atas[0],
        // positionA: position,
      })
      .signers([userKeypairs[userId]])
      .rpc({ skipPreflight: true });

    // Position Account
    const positionAccount = await program.account.positionA.fetch(
      accounts.positionA
    );
    const startPositionSlot = positionAccount.startSlot.toNumber();
    const endPositionSlot = positionAccount.endSlot.toNumber();
    expect(positionAccount.amount.toNumber()).toStrictEqual(depositAmount);
    expect(endPositionSlot - startPositionSlot).toBeGreaterThan(
      endSlotInterval
    );
    expect(positionAccount.bookkeeping.toNumber()).toStrictEqual(0); // still no trade since both deposits are on token A
    expect(positionAccount.noTradeSlots.toNumber()).toStrictEqual(jumpSlots);
    expect(startPositionSlot).toStrictEqual(startSlot + jumpSlots);
    expect(endPositionSlot % endSlotInterval).toStrictEqual(0);
    expect(positionAccount.bump).toStrictEqual(positionBump);

    // Market Account
    const positionAccount0 = await program.account.positionA.fetch(
      allPositionsA[0]
    );
    const marketAccount = await program.account.market.fetch(accounts.market);
    expect(
      Math.floor(marketAccount.tokenAVolume.toNumber() / VOLUME_PRECISION)
    ).toStrictEqual(
      Math.floor(
        userDeposits[0] /
          (positionAccount0.endSlot.toNumber() -
            positionAccount0.startSlot.toNumber()) +
          depositAmount / (endSlot - positionAccount.startSlot.toNumber())
      )
    );

    // Bookkeeping Account
    const bookkeepingAccount = await program.account.bookkeeping.fetch(
      accounts.bookkeeping
    );
    expect(bookkeepingAccount.aPerB.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.bPerA.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.noTradeSlots.toNumber()).toStrictEqual(jumpSlots);

    // Treasury Account
    let treasuryAccount = await banksClient.getAccount(accounts.treasuryA);
    let decodedTreasuryAccount = AccountLayout.decode(treasuryAccount?.data);
    expect(Number(decodedTreasuryAccount.amount)).toBe(
      depositAmount + userDeposits[0]
    );
  });

  it("deposits token B at the same slot!", async () => {
    const userId = 2;
    const depositAmount = userDeposits[userId];
    const endSlot = startSlot + endSlotInterval * 2000;

    const current_slot = await banksClient.getSlot();

    const user = userKeypairs[userId];

    const [position, positionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position_b"),
        accounts.market.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    allPositionsB[userId] = position;
    accounts.positionB = position;
    accounts.depositorTokenAccount = usdcAtas[userId];

    await program.methods
      .depositTokenB(new BN(depositAmount), new BN(endSlot))
      .accounts({
        ...accounts,
        depositor: user.publicKey,
      })
      .signers([userKeypairs[userId]])
      .rpc({ skipPreflight: true });

    // Position Account
    const positionAccount = await program.account.positionB.fetch(
      accounts.positionB
    );
    const startPositionSlot = positionAccount.startSlot.toNumber();
    const endPositionSlot = positionAccount.endSlot.toNumber();
    expect(positionAccount.amount.toNumber()).toStrictEqual(depositAmount);
    expect(endPositionSlot - startPositionSlot).toBeGreaterThan(
      endSlotInterval
    );
    expect(positionAccount.bookkeeping.toNumber()).toStrictEqual(0); // still no trade since this is first deposit on token B
    expect(positionAccount.noTradeSlots.toNumber()).toStrictEqual(
      Number(current_slot) - startSlot
    );
    expect(startPositionSlot).toStrictEqual(Number(current_slot));
    expect(endPositionSlot % endSlotInterval).toStrictEqual(0);
    expect(positionAccount.bump).toStrictEqual(positionBump);

    // Market Account
    const marketAccount = await program.account.market.fetch(accounts.market);
    expect(
      Math.floor(marketAccount.tokenBVolume.toNumber() / VOLUME_PRECISION)
    ).toStrictEqual(
      Math.floor(depositAmount / (endSlot - Number(current_slot)))
    );

    // Bookkeeping Account
    const bookkeepingAccount = await program.account.bookkeeping.fetch(
      accounts.bookkeeping
    );
    expect(bookkeepingAccount.aPerB.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.bPerA.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.noTradeSlots.toNumber()).toStrictEqual(
      Number(current_slot) - startSlot
    );

    // Treasury Account
    let treasuryAccount = await banksClient.getAccount(accounts.treasuryB);
    let decodedTreasuryAccount = AccountLayout.decode(treasuryAccount?.data);
    expect(Number(decodedTreasuryAccount.amount)).toBe(depositAmount);
  });

  it("deposits token A at the same slot as before!", async () => {
    const userId = 3;
    const depositAmount = userDeposits[userId];
    const endSlot = startSlot + endSlotInterval * 3000;
    const current_slot = await banksClient.getSlot();

    const user = userKeypairs[userId];

    const [position, positionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position_a"),
        accounts.market.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tx = createTransferWrapSolTx(
      context,
      user,
      solAtas[userId],
      depositAmount
    );
    await banksClient.processTransaction(tx);

    allPositionsA[userId] = position;
    accounts.positionA = position;
    accounts.depositorTokenAccount = solAtas[userId];

    await program.methods
      .depositTokenA(new BN(depositAmount), new BN(endSlot))
      .accounts({
        ...accounts,
        depositor: user.publicKey,
        // depositorTokenAccount: atas[0],
        // positionA: position,
      })
      .signers([userKeypairs[userId]])
      .rpc({ skipPreflight: true });

    // Position Account
    const positionAccount = await program.account.positionA.fetch(
      accounts.positionA
    );
    const startPositionSlot = positionAccount.startSlot.toNumber();
    const endPositionSlot = positionAccount.endSlot.toNumber();
    expect(positionAccount.amount.toNumber()).toStrictEqual(depositAmount);
    expect(endPositionSlot - startPositionSlot).toBeGreaterThan(
      endSlotInterval
    );
    expect(positionAccount.bookkeeping.toNumber()).toStrictEqual(0); // still no trade since deposits happened on same slot
    expect(positionAccount.noTradeSlots.toNumber()).toStrictEqual(
      Number(current_slot) - startSlot
    );
    expect(startPositionSlot).toStrictEqual(Number(current_slot));
    expect(endPositionSlot % endSlotInterval).toStrictEqual(0);
    expect(positionAccount.bump).toStrictEqual(positionBump);

    // Market Account
    const positionAccount0 = await program.account.positionA.fetch(
      allPositionsA[0]
    );
    const positionAccount1 = await program.account.positionA.fetch(
      allPositionsA[1]
    );
    const marketAccount = await program.account.market.fetch(accounts.market);
    expect(
      Math.floor(marketAccount.tokenAVolume.toNumber() / VOLUME_PRECISION)
    ).toStrictEqual(
      Math.floor(
        userDeposits[0] /
          (positionAccount0.endSlot.toNumber() -
            positionAccount0.startSlot.toNumber()) +
          userDeposits[1] /
            (positionAccount1.endSlot.toNumber() -
              positionAccount1.startSlot.toNumber()) +
          depositAmount / (endSlot - positionAccount.startSlot.toNumber())
      )
    );

    // Bookkeeping Account
    const bookkeepingAccount = await program.account.bookkeeping.fetch(
      accounts.bookkeeping
    );
    expect(bookkeepingAccount.aPerB.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.bPerA.toNumber()).toStrictEqual(0);
    expect(bookkeepingAccount.noTradeSlots.toNumber()).toStrictEqual(
      Number(current_slot) - startSlot
    );

    // Treasury Account
    let treasuryAccount = await banksClient.getAccount(accounts.treasuryA);
    let decodedTreasuryAccount = AccountLayout.decode(treasuryAccount?.data);
    expect(Number(decodedTreasuryAccount.amount)).toBe(
      depositAmount + userDeposits[0] + userDeposits[1]
    );
  });

  it("deposits token A some slots later!", async () => {
    const userId = 4;
    const depositAmount = userDeposits[userId];
    const endSlot = startSlot + endSlotInterval * 4000;

    const lastSlot = Number(await banksClient.getSlot());
    context.warpToSlot(BigInt(lastSlot + 1000));
    const currentSlot = Number(await banksClient.getSlot());

    const user = userKeypairs[userId];

    const [position, positionBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position_a"),
        accounts.market.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tx = createTransferWrapSolTx(
      context,
      user,
      solAtas[userId],
      depositAmount
    );
    await banksClient.processTransaction(tx);

    allPositionsA[userId] = position;
    accounts.positionA = position;
    accounts.depositorTokenAccount = solAtas[userId];

    await program.methods
      .depositTokenA(new BN(depositAmount), new BN(endSlot))
      .accounts({
        ...accounts,
        depositor: user.publicKey,
        // depositorTokenAccount: atas[0],
        // positionA: position,
      })
      .signers([userKeypairs[userId]])
      .rpc({ skipPreflight: true });

    // Market Account
    const positionAccount0 = await program.account.positionA.fetch(
      allPositionsA[0]
    );
    const positionAccount1 = await program.account.positionA.fetch(
      allPositionsA[1]
    );
    const positionAccount3 = await program.account.positionA.fetch(
      allPositionsA[3]
    );
    const marketAccount = await program.account.market.fetch(accounts.market);
    expect(
      Math.floor(marketAccount.tokenAVolume.toNumber() / VOLUME_PRECISION)
    ).toBeCloseTo(
      Math.floor(
        userDeposits[0] /
          (positionAccount0.endSlot.toNumber() -
            positionAccount0.startSlot.toNumber())
      ) +
        Math.floor(
          userDeposits[1] /
            (positionAccount1.endSlot.toNumber() -
              positionAccount1.startSlot.toNumber())
        ) +
        Math.floor(
          userDeposits[3] /
            (positionAccount3.endSlot.toNumber() -
              positionAccount3.startSlot.toNumber()) +
            depositAmount / (endSlot - currentSlot)
        ),
      -1
    );

    // Position Account
    const positionAccount = await program.account.positionA.fetch(
      accounts.positionA
    );
    const startPositionSlot = positionAccount.startSlot.toNumber();
    const endPositionSlot = positionAccount.endSlot.toNumber();
    expect(positionAccount.amount.toNumber()).toStrictEqual(depositAmount);
    expect(endPositionSlot - startPositionSlot).toBeGreaterThan(
      endSlotInterval
    );
    console.log("volume a", marketAccount.tokenAVolume.toNumber());
    console.log("volume b", marketAccount.tokenBVolume.toNumber());

    expect(
      Math.floor(positionAccount.bookkeeping.toNumber() / BOOKKEEPING_PRECISION)
    ).toStrictEqual(
      Math.floor(
        ((currentSlot - lastSlot) *
          Math.floor(
            (marketAccount.tokenBVolume.toNumber() * BOOKKEEPING_PRECISION) /
              (marketAccount.tokenAVolume.toNumber() -
                (depositAmount * VOLUME_PRECISION) / (endSlot - currentSlot))
          )) /
          BOOKKEEPING_PRECISION
      )
    );

    expect(positionAccount.noTradeSlots.toNumber()).toStrictEqual(
      lastSlot - startSlot
    );
    expect(startPositionSlot).toStrictEqual(currentSlot);
    expect(endPositionSlot).toStrictEqual(endSlot);
    expect(endPositionSlot % endSlotInterval).toStrictEqual(0);
    expect(positionAccount.bump).toStrictEqual(positionBump);

    // Bookkeeping Account
    const bookkeepingAccount = await program.account.bookkeeping.fetch(
      accounts.bookkeeping
    );
    expect(
      Math.floor(bookkeepingAccount.aPerB.toNumber() / BOOKKEEPING_PRECISION)
    ).toStrictEqual(
      Math.floor(
        ((currentSlot - lastSlot) *
          Math.floor(
            ((marketAccount.tokenAVolume.toNumber() -
              (depositAmount * VOLUME_PRECISION) / (endSlot - currentSlot)) *
              BOOKKEEPING_PRECISION) /
              marketAccount.tokenBVolume.toNumber()
          )) /
          BOOKKEEPING_PRECISION
      )
    );
    expect(
      Math.floor(bookkeepingAccount.bPerA.toNumber() / BOOKKEEPING_PRECISION)
    ).toStrictEqual(
      Math.floor(
        ((currentSlot - lastSlot) *
          Math.floor(
            (marketAccount.tokenBVolume.toNumber() * BOOKKEEPING_PRECISION) /
              (marketAccount.tokenAVolume.toNumber() -
                (depositAmount * VOLUME_PRECISION) / (endSlot - currentSlot))
          )) /
          BOOKKEEPING_PRECISION
      )
    );
    expect(bookkeepingAccount.noTradeSlots.toNumber()).toStrictEqual(
      lastSlot - startSlot
    );

    // Treasury Account
    let treasuryAccount = await banksClient.getAccount(accounts.treasuryA);
    let decodedTreasuryAccount = AccountLayout.decode(treasuryAccount?.data);
    expect(Number(decodedTreasuryAccount.amount)).toBe(
      depositAmount + userDeposits[0] + userDeposits[1] + userDeposits[3]
    );
  });
});
