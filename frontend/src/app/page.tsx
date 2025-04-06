"use client";

import { CreateRepository } from "@/components/CreateRepository";
import { OwnedRepositories } from "@/components/OwnedRepositories";

export default function Home() {
    return (
        <>
            <h1 className="text-4xl font-bold mb-8">Flipper Demo</h1>
            <div className="flex flex-col gap-5">
                <CreateRepository />
                <OwnedRepositories />
            </div>
        </>
    );
}
