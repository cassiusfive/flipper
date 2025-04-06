"use client";

import { CreateRepository } from "@/components/CreateRepository";
import { OwnedRepositories } from "@/components/OwnedRepositories";

export default function Home() {
    return (
        <>
            <div className="flex items-center mb-4">
                <h1 className="text-4xl font-bold mr-4">Flipper Demo</h1>
                <span className="text-6xl">🦭</span>
            </div>
            <div className="flex flex-col gap-5">
                <CreateRepository />
                <OwnedRepositories />
            </div>
        </>
    );
}
