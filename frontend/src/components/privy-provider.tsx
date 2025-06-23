"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

interface PrivyAppProviderProps {
  children: ReactNode;
}

export function PrivyAppProvider({ children }: PrivyAppProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Show error if app ID is not configured
  if (!appId) {
    console.error(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set. Please configure your Privy app ID in .env.local"
    );
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold mb-2">
            Privy Configuration Error
          </h2>
          <p className="text-muted-foreground mb-4">
            NEXT_PUBLIC_PRIVY_APP_ID environment variable is not set.
          </p>
          <p className="text-sm text-muted-foreground">
            Please create a .env.local file with your Privy app ID from{" "}
            <a
              href="https://console.privy.io"
              className="text-blue-500 hover:underline"
            >
              console.privy.io
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          showWalletLoginFirst: true,
        },
        supportedChains: [
          {
            id: 97,
            name: "BSC Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: {
              default: {
                http: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
              },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
