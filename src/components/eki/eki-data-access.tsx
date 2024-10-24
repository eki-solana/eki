"use client";

import { EKI_PROGRAM_ID as programId, getProgram, Eki } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

export function useEkiProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const program = getProgram(provider);

  let exitsAddress = new PublicKey(
    "E2jbEbziwzhXFh9qeGgQKvETcg4EymYHhnUDtNeW516o"
  );
  let pricesAddress = new PublicKey(
    "3p4W52QJnsaFMje2FQwtEwN2UFdiu5mKaGci5dRDAzW2"
  );

  let solMint = new PublicKey("9TmSJeP1K89kGJJQf54D2P6kYeD5Uc7j2pzFWFre5Fms");
  let usdcMint = new PublicKey("95eBaAbEAZvxngRgNL4qmikTcYhzHNBwxKTuT2p7SGU");

  let [marketPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market")],
    program.programId
  );

  let depositorATA = getAssociatedTokenAddressSync(solMint, provider.publicKey);

  const [treasuryA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_a"), marketPda.toBuffer()],
    program.programId
  );

  const [treasuryB] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_b"), marketPda.toBuffer()],
    program.programId
  );

  const [bookkeeping] = PublicKey.findProgramAddressSync(
    [Buffer.from("bookkeeping"), marketPda.toBuffer()],
    program.programId
  );

  const [positionAPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_a"),
      marketPda.toBuffer(),
      provider.publicKey.toBuffer(),
    ],
    program.programId
  );

  const [positionBPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_b"),
      marketPda.toBuffer(),
      provider.publicKey.toBuffer(),
    ],
    program.programId
  );

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const getMarket = useQuery({
    queryKey: ["get-market", { cluster }],
    queryFn: () => program.account.market.fetch(marketPda),
  });

  const getPositionA = useQuery({
    queryKey: ["get-postion-a", { cluster }],
    queryFn: () => program.account.positionA.fetch(positionAPda),
  });

  const getPositionB = useQuery({
    queryKey: ["get-postion-b", { cluster }],
    queryFn: () => program.account.positionB.fetch(positionBPda),
  });

  const depositTokenA = useMutation({
    mutationKey: ["eki", "deposit-token-a", { cluster }],
    mutationFn: ({ amount, endSlot }: { amount: number; endSlot: number }) =>
      program.methods
        .depositTokenA(new BN(amount), new BN(endSlot))
        .accounts({
          depositor: provider.publicKey,
          // depositorTokenAccount: depositorATA,
          tokenMintA: solMint,
          // market: marketPda,
          // positionA: positionAPda,
          // treasuryA: treasuryA,
          // bookkeeping: bookkeeping,
          exits: exitsAddress,
          prices: pricesAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
    },
    onError: (e) => toast.error(`Failed create order: ${e.message}`),
  });

  const depositTokenB = useMutation({
    mutationKey: ["eki", "deposit-token-b", { cluster }],
    mutationFn: ({ amount, endSlot }: { amount: number; endSlot: number }) =>
      program.methods
        .depositTokenB(new BN(amount), new BN(endSlot))
        .accounts({
          depositor: provider.publicKey,
          // depositorTokenAccount: depositorATA,
          tokenMintB: usdcMint,
          // market: marketPda,
          // positionB: positionAPda,
          // treasuryB: treasuryA,
          // bookkeeping: bookkeeping,
          exits: exitsAddress,
          prices: pricesAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
    },
    onError: (e) => toast.error(`Failed create order: ${e.message}`),
  });

  return {
    program,
    programId,
    getProgramAccount,
    depositTokenA,
    depositTokenB,
    getMarket,
    getPositionA,
    getPositionB,
  };
}
