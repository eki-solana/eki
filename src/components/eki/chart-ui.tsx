"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import useWindowDimensions from "@/hooks/window-dimension";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useEkiProgram } from "./eki-data-access";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";
import { OrderDialog } from "./eki-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { type Connection } from "@solana/web3.js";

const chartData = [
  { month: "January", solPrice: 101 },
  { month: "February", solPrice: 97 },
  { month: "March", solPrice: 125 },
  { month: "April", solPrice: 192 },
  { month: "May", solPrice: 129 },
  { month: "June", solPrice: 165 },
  { month: "July", solPrice: 146 },
  { month: "August", solPrice: 171 },
  { month: "September", solPrice: 135 },
  { month: "October", solPrice: 152 },
];

const chartConfig = {
  solPrice: {
    label: "SOL Price",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export function MarketChart() {
  const { width } = useWindowDimensions();
  const { getMarket, depositTokenA, depositTokenB } = useEkiProgram();
  const { connection } = useConnection();

  if (getMarket.isLoading) {
    return (
      <div className="w-full flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  console.log("Market", getMarket.data);
  let tradingVolumeA = getMarket.data?.tokenAVolume.toNumber() || 0;
  let tradingVolumeB = getMarket.data?.tokenBVolume.toNumber() || 0;
  let isTrading = tradingVolumeA * tradingVolumeB !== 0;

  let marketPrice = isTrading && (tradingVolumeB / tradingVolumeA).toFixed(2);

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div>
        The price chart is just a placeholder for now. But the price and trading
        volume are real time data!
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>tSOL / tUSDC</CardTitle>
          <CardDescription>
            {isTrading && <p>Current Price: {marketPrice} tUSDC per SOL</p>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {" "}
          <div className="w-full">
            <ChartContainer config={chartConfig} className="h-[350px] mx-auto">
              <AreaChart
                accessibilityLayer
                data={chartData}
                width={(5 * width) / 6}
                height={300}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-solPrice)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-solPrice)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="solPrice"
                  type="stepAfter"
                  fill="url(#fill)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-end justify-between gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex flex-col items-start gap-2 font-medium leading-none">
                Trading Volume
              </div>
              <div className="flex flex-col items-start gap-2 leading-none text-muted-foreground">
                <p>
                  {isTrading
                    ? (
                        (tradingVolumeA * 2.5 * 60 * 60) /
                        1000000000 /
                        1000000
                      ).toFixed(2)
                    : 0}{" "}
                  tSOL per hour
                </p>
                <p>
                  {isTrading
                    ? (
                        (tradingVolumeB * 2.5 * 60 * 60) /
                        1000000 /
                        1000000
                      ).toFixed(2)
                    : 0}{" "}
                  tUSDC per hour
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <OrderDialog
                title={"Buy tSOL"}
                amountLabel="Amount of tUSDC"
                handleSubmit={async (amount: number, duration: string) => {
                  let endSlot = await calculateEndSlot(connection, duration);
                  depositTokenB.mutate({ amount: amount, endSlot: endSlot });
                }}
              />
              <OrderDialog
                title={"Sell tSOL"}
                amountLabel="Amount of tSOL"
                handleSubmit={async (amount: number, duration: string) => {
                  let endSlot = await calculateEndSlot(connection, duration);
                  depositTokenA.mutate({ amount: amount, endSlot: endSlot });
                }}
              />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

async function calculateEndSlot(connection: Connection, duration: string) {
  let currentSlot = await connection.getSlot();
  let durationSeconds: number = durationStringToSeconds.get(duration);

  let slotDiff = durationSeconds * 2.5;

  return currentSlot + slotDiff;
}

const durationStringToSeconds = new Map();

durationStringToSeconds.set("1min", 60);
durationStringToSeconds.set("1hour", 60 * 60);
durationStringToSeconds.set("1day", 60 * 60 * 24);
durationStringToSeconds.set("1week", 60 * 60 * 24 * 7);
durationStringToSeconds.set("1month", 60 * 60 * 24 * 30);
