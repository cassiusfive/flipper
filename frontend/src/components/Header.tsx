"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export function Header() {
    return (
        <header className="flex justify-end">
            <div className="mr-6 my-4">
                <ConnectButton />
            </div>
        </header>
    );
}
