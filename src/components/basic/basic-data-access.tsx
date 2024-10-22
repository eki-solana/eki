"use client";

import { EKI_PROGRAM_ID as programId, getProgram } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";

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

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const greet = useMutation({
    mutationKey: ["eki", "initialize-exits-account", { cluster }],
    mutationFn: () => program.methods.initializeExits().rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
    },
    onError: () => toast.error("Failed to initialize exits account"),
  });

  return {
    program,
    programId,
    getProgramAccount,
    greet,
  };
}
