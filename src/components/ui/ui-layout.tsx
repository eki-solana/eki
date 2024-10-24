"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ReactNode, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";

import { AccountChecker } from "../account/account-ui";
import {
  ClusterChecker,
  ClusterUiSelect,
  ExplorerLink,
} from "../cluster/cluster-ui";
import { WalletButton } from "../solana/solana-provider";
import { Button } from "./button";
import { LoadingSpinner } from "./loading-spinner";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function UiLayout({
  children,
  links,
}: {
  children: ReactNode;
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center p-2 w-full min-h-16  bg-base-300 text-neutral-content flex-col md:flex-row space-y-2 md:space-y-0">
        <div className="flex-1 flex items-center">
          <Button variant="ghost" asChild>
            <Link className="text-xl mr-8" href="/">
              <img className="h-4 md:h-6" alt="Logo" src="/logo.png" />
            </Link>
          </Button>
          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              {links.map(({ label, path }) => (
                <NavigationMenuItem
                  key={path}
                  className={
                    pathname.startsWith(path) ? "text-accent-foreground" : ""
                  }
                >
                  <Link href={path} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex-none space-x-2 flex items-center">
          <WalletButton />
          <ClusterUiSelect />
        </div>
      </div>
      <ClusterChecker>
        <AccountChecker />
      </ClusterChecker>
      <div className="flex-grow mx-4">
        <Suspense
          fallback={
            <div className="text-center my-32">
              <LoadingSpinner />
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
      <footer className="text-center p-4 bg-base-300 text-base-content w-full">
        <aside>
          <p>Footer Placeholder</p>
        </aside>
      </footer>
    </div>
  );
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="grid w-full place-items-center bg-cover bg-center py-[64px]">
      <div className="flex items-center justify-center gap-4 p-4 z-0 text-center">
        <div className="max-w-2xl">
          {typeof title === "string" ? (
            <h1 className="text-5xl font-bold">{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === "string" ? (
            <p className="py-6">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ellipsify(str = "", len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + ".." + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={"text-center"}>
        <div className="text-lg">Transaction sent</div>
        <Button asChild variant={"default"} size={"sm"}>
          <ExplorerLink path={`tx/${signature}`} label={"View Transaction"} />
        </Button>
      </div>
    );
  };
}
