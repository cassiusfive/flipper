"use client";

import { CreateRepository } from "@/components/CreateRepository";
import { OwnedRepositories } from "@/components/OwnedRepositories";

export default function Home() {
    return (
        <div className="flex flex-col gap-5">
            <CreateRepository />
            <OwnedRepositories />
        </div>
    );
}
