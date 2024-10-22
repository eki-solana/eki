"use client";

import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useEkiProgram } from "./basic-data-access";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export function BasicCreate() {
  const { greet } = useEkiProgram();

  return (
    <Button onClick={() => greet.mutateAsync()} disabled={greet.isPending}>
      Run program{greet.isPending && "..."}
    </Button>
  );
}

export function BasicProgram() {
  const { getProgramAccount } = useEkiProgram();

  if (getProgramAccount.isLoading) {
    return <LoadingSpinner />;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <Alert>
        <MagnifyingGlassIcon className="h-4 w-4" />
        <AlertTitle>Program account not found!</AlertTitle>
        <AlertDescription>
          Make sure you have deployed the program and are on the correct
          cluster.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <div className={"space-y-6"}>
      <pre>{JSON.stringify(getProgramAccount.data.value, null, 2)}</pre>
    </div>
  );
}
