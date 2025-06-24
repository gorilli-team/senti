"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpDown } from "lucide-react";
import { DelegationActions } from "./delegation-actions";

export function DelegationButton() {
  const { authenticated, ready } = usePrivy();

  if (!ready || !authenticated) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Delegation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Delegation Manager</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <DelegationActions />
        </div>
      </DialogContent>
    </Dialog>
  );
}
