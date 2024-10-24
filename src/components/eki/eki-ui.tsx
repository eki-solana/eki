"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useEkiProgram } from "./eki-data-access";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function EkiProgram() {
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
const FormSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().gt(0, "Must be greater than zero")
  ),
  time: z.string({
    required_error: "Please set a time horizon.",
  }),
});

export function OrderDialog({
  title,
  amountLabel,
  handleSubmit,
}: {
  title: string;
  amountLabel: string;
  handleSubmit: (amount: number, duration: string) => void;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    handleSubmit(data.amount, data.time);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{title}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Stream your order over your desired time horizon.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col space-y-1.5">
                    <FormLabel>{amountLabel}</FormLabel>
                    <Input
                      id="amount"
                      placeholder="0,0"
                      type="number"
                      defaultValue={field.value}
                      onChange={field.onChange}
                      onVolumeChange={field.onChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time horizon</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5min">5 min</SelectItem>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="1day">1 day</SelectItem>
                      <SelectItem value="1week">1 week</SelectItem>
                      <SelectItem value="1month">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your order is evenly distributed over this period of time.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit order</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
