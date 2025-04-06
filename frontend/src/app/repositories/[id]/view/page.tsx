"use client";

import { Feeds } from "@/components/Feeds";
import { use } from "react";

export default function RepositoryViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <div className="p-4">
            <Feeds allowlistId={id} />
        </div>
    );
}
