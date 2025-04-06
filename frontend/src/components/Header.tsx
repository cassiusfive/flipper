"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export function Header() {
    return (
        <header className="flex justify-between items-center mx-12">
            <div className="flex items-center">
                <h1 className="text-4xl font-bold mr-4">Flipper Demo</h1>
                <span className="text-6xl">🦭</span>
            </div>
            <div className="my-4">
                <ConnectButton />
            </div>
        </header>
    );
}
