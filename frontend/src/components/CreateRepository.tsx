// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from "@mysten/sui/transactions";
import { Button, Card, Flex } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useState } from "react";
import { useNetworkVariable } from "@/networkConfig";

export function CreateRepository() {
    const [name, setName] = useState("");
    const packageId = useNetworkVariable("packageId");
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showEffects: true,
                },
            }),
    });

    function createRepository(name: string) {
        if (name === "") {
            alert("Please enter a name for the repository");
            return;
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${packageId}::repository::create_repository_entry`,
            arguments: [tx.pure.string(name)],
        });
        tx.setGasBudget(10000000);
        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: async (result) => {
                    console.log("res", result);
                    const repositoryObject = result.effects?.created?.find(
                        (item) =>
                            item.owner &&
                            typeof item.owner === "object" &&
                            "Shared" in item.owner,
                    );
                    const createdObjectId =
                        repositoryObject?.reference?.objectId;
                    if (createdObjectId) {
                        console.log(createdObjectId);
                    }
                },
            },
        );
    }

    return (
        <Card>
            <h2 className="font-bold" style={{ marginBottom: "1rem" }}>
                New Repository
            </h2>
            <Flex direction="row" gap="2" justify="start">
                <input
                    placeholder="Repository Name"
                    onChange={(e) => setName(e.target.value)}
                />
                <Button
                    size="3"
                    onClick={() => {
                        createRepository(name);
                    }}
                >
                    Create Repository
                </Button>
            </Flex>
        </Card>
    );
}
