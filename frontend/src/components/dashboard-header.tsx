"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { WalletConnect } from "@/components/wallet-connect";
import { DelegationButton } from "@/components/delegation-button";

export function DashboardHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-2 px-3"></div>
      <div className="flex items-center gap-2">
        <DelegationButton />
        <WalletConnect />
      </div>
    </header>
  );
}
