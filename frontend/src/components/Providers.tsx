"use client";

import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { networkConfig } from "@/networkConfig";

// Create a client
const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Theme appearance="dark">
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider
                    networks={networkConfig}
                    defaultNetwork="testnet"
                >
                    <WalletProvider autoConnect>{children}</WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </Theme>
    );
}
