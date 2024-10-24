"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";

import { MarketChart } from "./chart-ui";
import { useEkiProgram } from "./eki-data-access";

export default function EkiFeature() {
  const { publicKey } = useWallet();
  const { getPositionA, getPositionB } = useEkiProgram();

  return publicKey ? (
    <div className="py-24">
      {/* <AppHero
        title="Basic"
        subtitle={'Run the program by clicking the "Run program" button.'}
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <MarketData />
      </AppHero> */}
      <MarketChart />
      <div>PositionA</div>
      <div>{getPositionA.data?.amount.toNumber() / 1000000000}</div>
      <div>PositionB</div>
      <div>{getPositionB.data?.amount.toNumber() / 1000000}</div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="py-[64px]">
        <div className="text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
